#!/usr/bin/env node
/**
 * audit-affiliate-links.mjs
 *
 * Inventories every affiliate link across the six site projects, then tests
 * BOTH halves of each link:
 *   1. the tracking URL (awin1.com/cread.php...) — does Awin still accept it?
 *   2. the destination (the `ued=` merchant page) — does the product still exist?
 *
 * A link is only "alive" if both halves work. A 403 from a merchant is reported
 * separately as BLOCKED, because Cloudflare/bot protection returns 403 to
 * scripts even when the page is fine for a human.
 *
 * Output: tools/.affiliate-audit.json  (+ human table on stdout)
 *
 * Run:  node tools/audit-affiliate-links.mjs
 *       node tools/audit-affiliate-links.mjs --site=TimerHaven
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECTS_DIR = 'C:/Projects';
const CONCURRENCY = 10;
const TIMEOUT_MS = 12000;

const SITES = {
  blueseasfishing: 'BlueSeasFishing-Website',
  gardenwithserge: 'GardenWithSerge-Website',
  timerhaven: 'TimerHaven-Website',
  nexuscut: 'NexusCut-Website',
  newgiftsandgadgets: 'NewGiftsAndGadgets-Website',
  laseniorservices: 'LASeniorServicesDirectory-Website',
};

const only = (process.argv.find((a) => a.startsWith('--site=')) || '').split('=')[1] || null;

const SCAN_EXT = new Set(['.html', '.htm', '.js', '.mjs', '.php', '.json', '.md', '.txt']);
const SKIP_DIR = /node_modules|[\\/]\.git|[\\/]backup|\.idxwork|__pycache__|[\\/]logs$/i;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/131.0.0.0 Safari/537.36';

function walk(dir, out, depth = 0) {
  if (depth > 8) return out;
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (SKIP_DIR.test(p)) continue;
    if (e.isDirectory()) { walk(p, out, depth + 1); continue; }
    if (!SCAN_EXT.has(extname(e.name).toLowerCase())) continue;
    let txt;
    try {
      if (statSync(p).size > 4_000_000) continue;
      txt = readFileSync(p, 'utf8');
    } catch { continue; }
    if (!/awin1\.com|amazon\.|amzn\.to/.test(txt)) continue;

    const reAwin = /https?:\/\/www\.awin1\.com\/cread\.php\?([^"'\s>)]+)/g;
    let m;
    while ((m = reAwin.exec(txt))) {
      // Some configs store links inside JSON, where & arrives escaped as \u0026.
      const q = new URLSearchParams(m[1].replace(/&amp;/g, '&').replace(/\\u0026/gi, '&'));
      const mid = q.get('awinmid');
      const affid = q.get('awinaffid');
      const ued = q.get('ued');
      if (!mid || !/^\d+$/.test(mid)) continue; // skip anything that failed to parse cleanly
      out.push({
        kind: 'awin', mid, affid,
        target: ued || '',
        trackingUrl: `https://www.awin1.com/cread.php?awinmid=${mid}&awinaffid=${affid}${ued ? `&ued=${encodeURIComponent(ued)}` : ''}`,
        file: p,
      });
    }

    const reAz = /https?:\/\/(?:www\.)?amazon\.[a-z.]+\/[^"'\s>)]*?(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})[^"'\s>)]*/g;
    while ((m = reAz.exec(txt))) {
      const raw = m[0].replace(/&amp;/g, '&');
      const tag = (raw.match(/[?&]tag=([A-Za-z0-9_-]+)/) || [])[1] || '';
      out.push({ kind: 'amazon', asin: m[1], tag, target: raw, trackingUrl: raw, file: p });
    }
    const reShort = /https?:\/\/amzn\.to\/[A-Za-z0-9]+/g;
    while ((m = reShort.exec(txt))) out.push({ kind: 'amazon-short', target: m[0], trackingUrl: m[0], file: p });
  }
  return out;
}

const cache = new Map();
function probe(url, { method = 'GET' } = {}) {
  const key = `${method} ${url}`;
  if (cache.has(key)) return cache.get(key);
  const p = (async () => {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: ctl.signal,
        headers: {
          'user-agent': UA,
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9',
        },
      });
      clearTimeout(t);
      const body = method === 'GET' ? await res.text().catch(() => '') : '';
      return { status: res.status, finalUrl: res.url, body: body.slice(0, 120_000) };
    } catch (err) {
      return { status: 0, error: String(err.message || err), body: '' };
    }
  })();
  cache.set(key, p);
  return p;
}

async function pool(jobs, limit) {
  const out = new Array(jobs.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    while (i < jobs.length) {
      const idx = i++;
      out[idx] = await jobs[idx]();
    }
  });
  await Promise.all(workers);
  return out;
}

function classify(r) {
  if (r.status === 0) return 'UNREACHABLE';
  if (r.status === 404 || r.status === 410) return 'DEAD';
  if (r.status === 403 || r.status === 429 || r.status === 503) return 'BLOCKED';
  if (r.status >= 500) return 'SERVER ERROR';
  if (r.status >= 400) return 'DEAD';
  return 'OK';
}

function looksDiscontinued(r) {
  if (r.status !== 200) return false;
  const b = r.body || '';
  const title = (b.match(/<title[^>]*>([^<]{0,200})/i) || [])[1] || '';
  return /page not found|404|not found|no longer available|product.*(isn't|is not) available/i.test(title);
}

// ---- pass 1: collect ------------------------------------------------------
const perSite = [];
for (const [name, dir] of Object.entries(SITES)) {
  if (only && !name.toLowerCase().includes(only.toLowerCase())) continue;
  const base = join(PROJECTS_DIR, dir);
  try { statSync(base); } catch { console.log(`skip ${name}: not found at ${base}`); continue; }
  const links = walk(base, []);
  if (!links.length) { console.log(`## ${name}: no affiliate links found`); continue; }
  const uniq = new Map();
  for (const l of links) {
    const key = `${l.kind}|${l.mid || l.asin || ''}|${l.target}`;
    if (!uniq.has(key)) uniq.set(key, { ...l, count: 0, files: new Set() });
    const u = uniq.get(key);
    u.count++;
    u.files.add(l.file.replace(base, '.'));
  }
  perSite.push({ name, base, linksCount: links.length, uniq });
}

// ---- pass 2: probe everything in parallel --------------------------------
const jobs = [];
for (const s of perSite) {
  for (const l of s.uniq.values()) {
    if (l.kind === 'awin') {
      jobs.push(() => probe(l.trackingUrl, { method: 'HEAD' }));
      if (l.target) jobs.push(() => probe(l.target));
    } else {
      jobs.push(() => probe(l.target));
    }
  }
}
await pool(jobs, CONCURRENCY);

// ---- pass 3: assemble ---------------------------------------------------
const results = [];
for (const s of perSite) {
  console.log(`\n## ${s.name} — ${s.linksCount} links, ${s.uniq.size} unique`);
  for (const l of s.uniq.values()) {
    let dest = null, track = null;
    if (l.kind === 'awin') {
      track = await probe(l.trackingUrl, { method: 'HEAD' });
      dest = l.target ? await probe(l.target) : null;
    } else {
      dest = await probe(l.target);
    }
    const destClass = dest ? (looksDiscontinued(dest) ? 'DEAD (soft 404)' : classify(dest)) : 'NO TARGET';
    const trackClass = track ? classify(track) : 'n/a';
    const trackOk = trackClass === 'OK' || trackClass === 'n/a';
    const verdict = dest ? (destClass === 'OK' && trackOk ? 'ALIVE' : 'BROKEN') : 'CHECK';
    const row = {
      site: s.name, kind: l.kind,
      mid: l.mid || l.asin || '', affid: l.affid || l.tag || '',
      target: l.target, count: l.count, pages: l.files.size, sample: [...l.files][0],
      trackingStatus: track ? track.status : null,
      destStatus: dest ? dest.status : null,
      destFinal: dest ? dest.finalUrl : null,
      destClass, verdict,
    };
    results.push(row);
    const flag = verdict === 'ALIVE' ? 'ok  ' : verdict === 'BROKEN' ? 'FAIL' : '??  ';
    console.log(
      `${flag} mid=${String(row.mid).padEnd(7)} dest=${String(row.destStatus ?? '-').padEnd(4)} ` +
      `${destClass.padEnd(14)} x${String(row.count).padEnd(4)} ${l.target.replace(/^https?:\/\//, '').slice(0, 72)}`
    );
  }
}

writeFileSync(join(ROOT, 'tools', '.affiliate-audit.json'), JSON.stringify(results, null, 2));

const byVendor = new Map();
for (const r of results) {
  const k = `${r.site}|${r.kind}|${r.mid}`;
  const v = byVendor.get(k) || { site: r.site, kind: r.kind, mid: r.mid, total: 0, broken: 0 };
  v.total++;
  if (r.verdict !== 'ALIVE') v.broken++;
  byVendor.set(k, v);
}
console.log('\n\n=== summary by vendor ===');
for (const v of [...byVendor.values()].sort((a, b) => a.site.localeCompare(b.site))) {
  console.log(`${v.broken ? 'BROKEN' : '  ok  '} ${v.site.padEnd(20)} ${v.kind.padEnd(13)} mid=${String(v.mid).padEnd(8)} ${v.broken}/${v.total} dead`);
}
const broken = results.filter((r) => r.verdict !== 'ALIVE');
console.log(`\n${results.length} unique links, ${broken.length} need attention. Report: tools/.affiliate-audit.json`);
