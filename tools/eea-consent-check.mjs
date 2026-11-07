#!/usr/bin/env node
/**
 * eea-consent-check.mjs — does each site behave correctly for a European visitor?
 *
 * Run this from an EU connection (a VPN in the EEA, or the home line in Greece).
 * Google decides from the IP whether its certified CMP covers the visitor, so a
 * non-European exit node makes every site look like it has no message.
 *
 * For each site it starts a throwaway browser profile, waits for the page to
 * settle, and records:
 *
 *   cmp      — is the IAB TCF API present, and did the CMP report itself loaded?
 *   message  — did Google report its message as displayed (displayStatus)?
 *   gated    — did any analytics request leave before a decision was made?
 *   ads      — were AdSense requests made (informational)?
 *   banner   — did the site's own banner appear as well (a double prompt)?
 *
 * Usage:
 *   node tools/eea-consent-check.mjs
 *   node tools/eea-consent-check.mjs --json
 *   node tools/eea-consent-check.mjs --site=blueseasfishing.com
 *
 * Exit code is 1 when a site fails cmp, message or gating, so it can be used in
 * a pre-deploy check.
 *
 * No dependencies: drives Chrome through the DevTools protocol with Node's
 * built-in WebSocket (Node 22+).
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = Number(process.env.CDP_PORT || 9333);
const SETTLE_MS = Number(process.env.SETTLE_MS || 9000);

const SITES = [
  { name: 'Blue Seas', url: 'https://www.blueseasfishing.com/', ads: true },
  { name: 'TimerHaven', url: 'https://timerhaven.com/', ads: true },
  { name: 'Garden with Serge', url: 'https://www.gardenwithserge.com/', ads: true },
  { name: 'NewGiftsAndGadgets', url: 'https://newgiftsandgadgets.com/', ads: true },
];

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const only = args.find((a) => a.startsWith('--site='))?.slice('--site='.length);

const PROBE = `new Promise(function (resolve) {
  function ping() {
    return new Promise(function (r) {
      if (typeof window.__tcfapi !== 'function') { r(null); return; }
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; r({ timeout: true }); } }, 2500);
      try {
        window.__tcfapi('ping', 2, function (d, ok) {
          if (done) return;
          done = true;
          clearTimeout(t);
          r({ ok: !!ok, gdprApplies: d && d.gdprApplies, cmpStatus: d && d.cmpStatus,
              displayStatus: d && d.displayStatus, cmpId: d && d.cmpId });
        });
      } catch (e) {
        done = true;
        clearTimeout(t);
        r({ error: String(e) });
      }
    });
  }
  ping().then(function (p) {
    var nets = performance.getEntriesByType('resource').map(function (e) { return e.name; });
    function count(re) { return nets.filter(function (n) { return re.test(n); }).length; }
    var banner = document.querySelector('.garden-consent-banner, #bsf-consent-banner, [class*=consent-banner]');
    resolve(JSON.stringify({
      cmpLoaded: typeof window.__tcfapi === 'function',
      ping: p,
      googlefc: typeof window.googlefc,
      adRequests: count(/pagead2\\.googlesyndication/),
      cmpHits: count(/fundingchoicesmessages/),
      analyticsRequests: nets.filter(function (n) {
        return /googletagmanager|google-analytics\\.com|analytics\\.google\\.com|clarity\\.ms/.test(n);
      }).length,
      dataLayer: (window.dataLayer || []).length,
      bannerVisible: banner ? !!(banner.offsetWidth || banner.offsetHeight) : false,
      stored: (function () {
        try { return JSON.stringify(localStorage).slice(0, 240); } catch (e) { return 'blocked'; }
      })()
    }));
  });
})`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForDevTools(port) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      const body = await res.json();
      if (body.webSocketDebuggerUrl) return body.webSocketDebuggerUrl;
    } catch {
      // Chrome not listening yet.
    }
    await sleep(250);
  }
  throw new Error(`Chrome did not expose DevTools on port ${port}`);
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  let nextId = 1;

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve());
    ws.addEventListener('error', (e) => reject(new Error(`CDP socket error: ${e.message || 'unknown'}`)));
  });

  ws.addEventListener('message', (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    if (!msg.id) return;
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    if (msg.error) entry.reject(new Error(msg.error.message));
    else entry.resolve(msg.result);
  });

  function send(method, params = {}, sessionId) {
    const id = nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify(payload));
    });
  }

  return { ready, send, close: () => ws.close() };
}

async function checkSite(cdp, site) {
  const { browserContextId } = await cdp.send('Target.createBrowserContext', { disposeOnDetach: true });
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

  try {
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Page.navigate', { url: site.url }, sessionId);
    await sleep(SETTLE_MS);

    const result = await cdp.send(
      'Runtime.evaluate',
      { expression: PROBE, awaitPromise: true, returnByValue: true },
      sessionId,
    );

    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || 'probe threw');
    }
    return JSON.parse(result.result.value);
  } finally {
    await cdp.send('Target.disposeBrowserContext', { browserContextId }).catch(() => {});
  }
}

function verdict(site, data) {
  const ping = data.ping || {};
  const checks = {
    cmp: Boolean(data.cmpLoaded && ping.cmpStatus === 'loaded'),
    message: ping.displayStatus === 'visible' || ping.displayStatus === 'shown',
    gated: data.analyticsRequests === 0,
    // A European visitor must be asked once. If the site's own banner is still
    // up while Google's message is showing, the visitor is being asked twice.
    singlePrompt: !(data.bannerVisible && data.cmpLoaded),
  };
  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  return { checks, failed, ok: failed.length === 0 };
}

async function main() {
  const profile = mkdtempSync(join(tmpdir(), 'eea-consent-'));
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--lang=en-US',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  let cdp;
  const rows = [];
  try {
    const wsUrl = await waitForDevTools(PORT);
    cdp = connect(wsUrl);
    await cdp.ready;

    for (const site of SITES) {
      if (only && !site.url.includes(only)) continue;
      process.stderr.write(`checking ${site.name}…\n`);
      let data;
      try {
        data = await checkSite(cdp, site);
      } catch (error) {
        rows.push({ site: site.name, error: String(error.message || error) });
        continue;
      }
      rows.push({ site: site.name, url: site.url, ...data, ...verdict(site, data) });
    }
  } finally {
    try { cdp?.close(); } catch {}
    chrome.kill();
    // Windows keeps the profile locked until the process is really gone, and a
    // cleanup failure must never hide the results that were already collected.
    await new Promise((resolve) => {
      if (chrome.exitCode !== null) return resolve();
      const timer = setTimeout(resolve, 5000);
      chrome.once('exit', () => { clearTimeout(timer); resolve(); });
    });
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      // A leftover temp profile is harmless; the next run makes its own.
    }
  }

  if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    const pad = (s, n) => String(s).padEnd(n);
    console.log('');
    console.log(pad('site', 22) + pad('CMP', 6) + pad('message', 10) + pad('gated', 7) + pad('ads', 5) + 'own banner');
    console.log('-'.repeat(64));
    for (const row of rows) {
      if (row.error) {
        console.log(pad(row.site, 22) + row.error);
        continue;
      }
      const tick = (ok) => (ok ? 'ok' : 'FAIL');
      console.log(
        pad(row.site, 22) +
          pad(tick(row.checks.cmp), 6) +
          pad(tick(row.checks.message), 10) +
          pad(tick(row.checks.gated), 7) +
          pad(row.adRequests > 0 ? 'yes' : 'no', 5) +
          (row.bannerVisible ? (row.checks.cmp && row.checks.message ? 'yes (double prompt)' : 'yes (only prompt)') : 'no'),
      );
    }
    console.log('');
  }

  const failures = rows.filter((r) => r.error || !r.ok);
  if (failures.length) {
    console.error(`${failures.length} of ${rows.length} site(s) need attention.`);
    process.exitCode = 1;
  } else {
    console.log(`All ${rows.length} sites behave correctly for a European visitor.`);
  }
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
