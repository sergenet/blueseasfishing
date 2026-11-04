// tools/i18n/mt.mjs — machine-translation client with cache. FREE endpoints only.
//
// Transport history:
//  1. public gtx scrape (abandoned 2026-10-14: hard per-IP throttling on bulk),
//  2. paid Google Cloud Translation v2 (removed 2026-10-14 — owner decision to
//     never pay for MT again; nothing reads the GCP key anymore),
//  3. current: the SAME free recipe gardenwithserge.com has run at zero cost —
//     the public Google Translate web endpoint across regional hosts, then the
//     free MyMemory API as last resort. Fine for minor changes and monthly
//     content; volumes are small and the cache makes repeats free.
//
// Glossary protection is kept: brand terms are wrapped in <x>N</x> so they
// pass through untranslated.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const CACHE_DIR = join(HERE, 'cache');

const BATCH_MAX = 128;   // strings per chunk (sequential free-endpoint calls)
const RETRIES = 8;      // attempts per string; a 429 consumes one and backs off
const THROTTLE_LIMIT = 6; // consecutive 429s across strings before abandoning the run
const PACE_MS = 250;     // polite gap for the free endpoints

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastAt = 0;

export let quotaExhausted = false;

// ---------- glossary ----------
// longest-first so 'blueseasfishing.com' wins over 'BlueSeasFishing'
// 'Blue Seas' was added 2026-11-02: titles were shortened to "... | Blue Seas"
// to fit Google's 60-character cut, and without this entry the bare brand was
// machine-translated like ordinary words — Spanish titles came back reading
// "Mares azules" (literally "blue seas"). 'Blue Seas Fishing' must stay first:
// the alternation takes the first alternative that matches.
const GLOSSARY = [
  'blueseasfishing.com',
  'Blue Seas Fishing',
  'Blue Seas',
  'BlueSeasFishing',
  'BlueSeas',
  'Wikimedia Commons',
  'Piscifun',
  'TideWe',
];
const GLOSSARY_RE = new RegExp('(' + GLOSSARY.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
const TOKEN_RE = /<x>(\d+)<\/x>/g;

function protect(line) {
  const tokens = [];
  const wire = line.replace(GLOSSARY_RE, (m) => {
    tokens.push(m);
    return `<x>${tokens.length - 1}</x>`;
  });
  return { wire, tokens };
}
function restore(text, tokens) {
  if (!tokens.length) return text;
  return text.replace(TOKEN_RE, (_, i) => tokens[+i] ?? '');
}

// ---------- cache ----------
function cachePath(locale) {
  return join(CACHE_DIR, `${locale}.json`);
}
export function loadCache(locale) {
  if (!existsSync(cachePath(locale))) return {};
  try { return JSON.parse(readFileSync(cachePath(locale), 'utf8')); } catch { return {}; }
}
export function saveCache(locale, cache) {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath(locale), JSON.stringify(cache));
}

// ---------- monthly volume ledger / spend cap ----------
// The current transport is free, so nothing is billed and the cap can never
// trip (price defaults to 0). The ledger still counts characters per calendar
// month as a volume stat. If a paid transport is ever reintroduced, set
// BSF_MT_PRICE_PER_MILLION (e.g. 20) and the $100 cap enforces again.
const SPEND_CAP_USD = Number(process.env.BSF_SPEND_CAP_USD || 100);
const PRICE_PER_MILLION = Number(process.env.BSF_MT_PRICE_PER_MILLION || 0); // 0 = free transport
const FREE_CHARS = Number(process.env.BSF_MT_FREE_CHARS || 500000);
const SPEND_FILE = join(CACHE_DIR, '.spend.json');

const monthKey = () => new Date().toISOString().slice(0, 7);
function loadSpend() {
  try {
    const s = JSON.parse(readFileSync(SPEND_FILE, 'utf8'));
    if (s && s.month === monthKey() && Number.isFinite(s.chars)) return s;
  } catch { /* first run */ }
  return { month: monthKey(), chars: 0 };
}
const spend = loadSpend();
function saveSpend() {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(SPEND_FILE, JSON.stringify(spend, null, 2));
}
const spendUsd = (chars) => (Math.max(0, chars - FREE_CHARS) / 1e6) * PRICE_PER_MILLION;

export let spendCapReached = false;
export const spendSummary = () =>
  `${spend.chars} chars ≈ $${spendUsd(spend.chars).toFixed(2)} of $${SPEND_CAP_USD.toFixed(2)} cap (${spend.month})`;

let nextSpendLogPct = 25;
// Called before each request: would billing `chars` more cross the cap?
function chargeable(chars) {
  if (spendCapReached) return false;
  if (spendUsd(spend.chars + chars) > SPEND_CAP_USD) {
    spendCapReached = true;
    console.error(`\n! MT spend cap reached — ${spendSummary()}. Falling back to source text;`);
    console.error('  the cap resets on the 1st (as does the $100 GCP budget alert).');
    return false;
  }
  return true;
}
// Called after a successful (billed) request.
function chargeSpend(chars) {
  spend.chars += chars;
  saveSpend();
  const pct = (spendUsd(spend.chars) / SPEND_CAP_USD) * 100;
  if (pct >= nextSpendLogPct) {
    console.log(`\n[mt] spend ${spendSummary()}`);
    nextSpendLogPct = Math.floor(pct / 25) * 25 + 25;
  }
}

// ---------- transport: free endpoints (gardenwithserge.com recipe) ----------
// Public Google Translate web endpoint (regional hosts, rotated on 429), then
// the free MyMemory API as last resort. No key, no account, no billing.
const GTX_HOSTS = [
  'translate.google.co.uk', 'translate.google.de', 'translate.google.fr',
  'translate.google.com',
];
const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get';
// MyMemory wants regional pairs (same mapping the garden site uses).
const MYMEMORY_PAIRS = {
  es: 'en-GB|es-ES', fr: 'en-GB|fr-FR', de: 'en-GB|de-DE',
  el: 'en-GB|el-GR', ru: 'en-GB|ru-RU', ar: 'en-GB|ar-SA',
};
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
let hostIdx = 0;

async function httpGet(url) {
  const ctl = new AbortController();
  // 20s, not 30s: a stuck endpoint is retried (see translateOne), and at 30s a
  // single unresponsive string could burn 6 attempts x 2 providers x 30s =
  // six minutes, which is how one page stalled a full rebuild on 2026-11-02.
  const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    return await fetch(url, { headers: UA, signal: ctl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// One string via the free Google web endpoint → {text} | {throttle} | {failed}.
async function gtxOnce(text, locale) {
  const host = GTX_HOSTS[hostIdx % GTX_HOSTS.length];
  let r;
  try {
    r = await httpGet(`https://${host}/translate_a/single?client=gtx&sl=en&tl=${locale}&dt=t&q=${encodeURIComponent(text)}`);
  } catch { return { failed: true }; }
  if (r.status === 429) { hostIdx++; return { throttle: true }; }
  if (!r.ok) return { failed: true };
  try {
    const j = await r.json();
    const out = Array.isArray(j?.[0]) ? j[0].map((seg) => (seg && seg[0]) || '').join('') : '';
    return out ? { text: out } : { failed: true };
  } catch { return { failed: true }; }
}

// Last-resort free fallback, same provider the garden site uses.
async function myMemoryOnce(text, locale) {
  const pair = MYMEMORY_PAIRS[locale] || `en|${locale}`;
  let r;
  try {
    r = await httpGet(`${MYMEMORY_ENDPOINT}?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(pair)}`);
  } catch { return { failed: true }; }
  if (r.status === 429) return { throttle: true };
  if (!r.ok) return { failed: true };
  try {
    const j = await r.json();
    const t = j?.responseData?.translatedText;
    if (t && !/^MYMEMORY WARNING/i.test(t)) return { text: t };
    return { failed: true };
  } catch { return { failed: true }; }
}

// Giving up on the first 429 wave was too eager: a full-site re-mirror sends
// thousands of small requests, and the free endpoints answer some of them with
// 429 as a matter of course. Declaring exhaustion after two such replies meant
// a 7,700-request job died every few pages and never finished (observed
// 2026-11-02). Now a 429 rotates to another regional host and backs off, and the
// run is only abandoned after THROTTLE_LIMIT consecutive throttles — roughly
// 80 seconds of solid refusal.
async function translateOne(text, locale) {
  let throttles = 0;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    if (quotaExhausted) return null;
    const wait = lastAt + PACE_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastAt = Date.now();

    const g = await gtxOnce(text, locale);
    if (g.text) return g.text;

    const m = await myMemoryOnce(text, locale);
    if (m.text) return m.text;

    if (g.throttle || m.throttle) {
      hostIdx++;                       // next regional gtx host
      if (++throttles >= THROTTLE_LIMIT) {
        quotaExhausted = true;
        console.error(`\n! Free MT endpoints throttled (429 x${throttles}). Re-run to resume from cache.`);
        return null;
      }
      await sleep(4000 * throttles);   // 4s, 8s, 12s, ...
      continue;
    }
    await sleep(1500 * attempt);
  }
  return null;
}

// MyMemory hard-rejects queries over ~480 chars with a
// "QUERY LENGTH LIMIT EXCEEDED" warning string (which its API returns as a
// normal 200, so it would otherwise pass through as a bogus "translation").
// gtx has no such cap but is often IP-throttled. Chunk every long string into
// <=MM_MAX pieces at sentence/word boundaries, translate each, rejoin.
const MM_MAX = 400;
function chunkForMT(text) {
  if (text.length <= MM_MAX) return [text];
  const pieces = [];
  let rest = text;
  while (rest.length > MM_MAX) {
    // prefer the last sentence boundary, then the last space, before MM_MAX
    let cut = rest.lastIndexOf('. ', MM_MAX);
    if (cut < MM_MAX * 0.5) cut = rest.lastIndexOf('; ', MM_MAX);
    if (cut < MM_MAX * 0.5) cut = rest.lastIndexOf(' ', MM_MAX);
    if (cut < MM_MAX * 0.5) cut = MM_MAX;
    else cut += 1; // keep the trailing punctuation with the left piece
    pieces.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) pieces.push(rest);
  return pieces;
}

async function translateLong(text, locale) {
  const pieces = chunkForMT(text);
  if (pieces.length === 1) return translateOne(text, locale);
  const out = [];
  for (const piece of pieces) {
    const t = await translateOne(piece, locale);
    if (t == null) return null; // any failed chunk → whole string falls back
    out.push(t);
  }
  return out.join(' ').replace(/\s+([,.;:!?])/g, '$1').trim();
}

// Translate a chunk. Returns { out, failed } where out is index-aligned and
// failed lists the indexes that never translated.
//
// This used to return null when ANY single string failed, which threw away up
// to 127 good translations with it and left the caller falling back to English
// for the entire chunk. One stubborn string was therefore enough to strip the
// translated text from a whole section of a page. Failures are now isolated to
// the string that actually failed.
async function requestBatch(locale, wireStrings) {
  const out = new Array(wireStrings.length);
  const failed = [];
  for (let i = 0; i < wireStrings.length; i++) {
    const t = await translateLong(wireStrings[i], locale);
    if (t == null) { out[i] = null; failed.push(i); } else out[i] = t;
  }
  return { out, failed };
}

// Translate strings; returns same-order array. stats.fallbacks counts source-returns.
export async function translateBatch(strings, locale, cache, onProgress, stats) {
  const out = new Array(strings.length);
  const needIdx = [];
  strings.forEach((s, i) => {
    if (s == null || !s.trim()) { out[i] = s; return; }
    const key = `${locale}\t${s}`;
    if (cache[key] != null) { out[i] = cache[key]; return; }
    needIdx.push(i);
  });
  if (!needIdx.length) return out;

  // chunk into batches; protect brands per string
  const chunks = [];
  for (let i = 0; i < needIdx.length; i += BATCH_MAX) {
    chunks.push(needIdx.slice(i, i + BATCH_MAX));
  }

  let done = 0;
  for (const chunk of chunks) {
    if (quotaExhausted) {
      chunk.forEach((i) => { out[i] = strings[i]; });
      if (stats) stats.fallbacks = (stats.fallbacks || 0) + chunk.length;
      break;
    }

    const prot = chunk.map((i) => protect(strings[i].replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()));
    const chunkChars = prot.reduce((n, p) => n + p.wire.length, 0);
    if (!chargeable(chunkChars)) {
      chunk.forEach((i) => { out[i] = strings[i]; });
      if (stats) stats.fallbacks = (stats.fallbacks || 0) + chunk.length;
      break;
    }
    const { out: translated, failed } = await requestBatch(locale, prot.map((p) => p.wire));
    const failedSet = new Set(failed);
    let okChars = 0;
    chunk.forEach((i, k) => {
      if (failedSet.has(k)) {
        // Only this string falls back; its neighbours keep their translation.
        out[i] = strings[i];
        if (stats) stats.fallbacks = (stats.fallbacks || 0) + 1;
        return;
      }
      const dst = restore(translated[k], prot[k].tokens).trim() || strings[i];
      out[i] = dst;
      cache[`${locale}\t${strings[i]}`] = dst;
      okChars += prot[k].wire.length;
    });
    if (okChars) chargeSpend(okChars);

    done += chunk.length;
    if (onProgress) onProgress(done, needIdx.length);
  }
  return out;
}
