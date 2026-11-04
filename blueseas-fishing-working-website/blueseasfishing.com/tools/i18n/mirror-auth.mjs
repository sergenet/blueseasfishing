// tools/i18n/mirror-auth.mjs — localize the pages the main build.mjs pipeline
// deliberately SKIPS (login, premium, subscribe, members-area,
// premium-success, trip-planner, gear-recommendations) into every locale.
//
// It reuses the SAME proven transformPage() machinery as the main build
// (mask scripts/styles/comments → translate only real text nodes → prefix
// links → set lang/canonical/hreflang → inject lang-switch.js + rtl.css),
// so functional JS, <style> blocks and attribute wiring stay byte-identical.
// The only difference from build.mjs is the transport: build.mjs uses mt.mjs
// (gtx, currently 429-throttled on this IP); this script uses the MyMemory
// free endpoint, which works, backed by the same on-disk cache so re-runs
// are free and the two tools never fight over the same cache file.
//
// The species-db*.js data packs are handled separately, by textual
// in-place replacement of English display literals (see localizePack),
// which keeps the merge IIFEs, comments and structure byte-identical.
//
// Run: node tools/i18n/mirror-auth.mjs [--locale xx] [--only substr] [--data-only]
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALES, TARGETS } from './config.mjs';
import { transformPage } from './transform.mjs';
import { localizeTripPlanner } from './localize-trip-planner.mjs';
import { localizeMembersArea } from './localize-members-area.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const CACHE_DIR = join(HERE, 'cache');
mkdirSync(CACHE_DIR, { recursive: true });

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const ONLY_LOC = opt('--locale');
const ONLY = opt('--only');
const DATA_ONLY = args.includes('--data-only');

const PAGES = [
  'login.html', 'premium.html', 'subscribe.html', 'members-area.html',
  'premium-success.html', 'trip-planner.html',
];
const DATA_FILES = [
  'species-db.js', 'species-db.enriched.js', 'species-db.enriched.world.js',
  'species-db.expanded.js', 'species-db.expanded.worldwide.js', 'species-db.regions.js',
  'species-db.images.js', // names must translate with the same cache as the base pack
];

// ---------- glossary: never translate brands / proper nouns / sci names ----------
const GLOSSARY = [
  'blueseasfishing.com', 'Blue Seas Fishing', 'BlueSeasFishing', 'BlueSeas',
  'Stripe', 'FishBase', 'IGFA',
  'Micropterus', 'Oncorhynchus', 'Salmo', 'Salvelinus', 'Esox', 'Sander',
  'Morone', 'Lepomis', 'Pomoxis', 'Ictalurus', 'Cyprinus', 'Sciaenops',
  'Cynoscion', 'Centropomus', 'Megalops', 'Paralichthys', 'Seriola',
  'Lutjanus', 'Mycteroperca', 'Coryphaena', 'Thunnus', 'Acanthocybium',
  'Makaira', 'Istiophorus', 'Xiphias', 'Perca', 'Barbus', 'Sparus',
  'Gadus', 'Pollachius', 'Lates', 'Maccullochella', 'Caranx', 'Cichla',
  'Salminus', 'Albula', 'Trachinotus', 'Scomberomorus',
];
const GLOSSARY_RE = new RegExp('(' + GLOSSARY.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
const TOKEN_RE = /<x>(\d+)<\/x>/g;
function protect(s) {
  const tokens = [];
  const wire = s.replace(GLOSSARY_RE, (m) => { tokens.push(m); return `<x>${tokens.length - 1}</x>`; });
  return { wire, tokens };
}
function restore(s, tokens) {
  return tokens.length ? s.replace(TOKEN_RE, (_, i) => tokens[+i] ?? '') : s;
}

// ---------- MyMemory free transport + cache ----------
function loadCache(loc) {
  try { return JSON.parse(readFileSync(join(CACHE_DIR, `auth-${loc}.json`), 'utf8')); } catch { return {}; }
}
// The main build (mt.mjs) keeps its much larger cache in <loc>.json with the
// SAME key layout (`${loc}\t${text}`). Read it too so every string the main
// pipeline already translated is a free cache hit here.
function loadMainCache(loc) {
  try { return JSON.parse(readFileSync(join(CACHE_DIR, `${loc}.json`), 'utf8')); } catch { return {}; }
}
function saveCache(loc, c) { writeFileSync(join(CACHE_DIR, `auth-${loc}.json`), JSON.stringify(c)); }

const MM_PAIRS = {
  es: 'en-GB|es-ES', fr: 'en-GB|fr-FR', de: 'en-GB|de-DE',
  el: 'en-GB|el-GR', ru: 'en-GB|ru-RU', ar: 'en-GB|ar-SA', pt: 'en-GB|pt-PT',
};
// ---------- gtx transport (primary since 2026-10-16: gtx un-throttled again,
// MyMemory free quota is exhausted daily by bulk runs) ----------
// Same public Google Translate web endpoint mt.mjs uses, with host rotation.
const GTX_HOSTS = [
  'translate.google.co.uk', 'translate.google.de', 'translate.google.fr',
  'translate.google.com',
];
let gtxHostIdx = 0;

// Google's edge 429s Node's undici/TLS fingerprint after bulk traffic while
// allowing the SAME requests from curl (verified side-by-side 2026-10-15:
// curl → 200, fetch → 429 on the same URL/IP/UA). So the transport spawns
// curl and only falls back to fetch if curl is unavailable on this machine.
const GTX_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
let curlOK = true;
function gtxCurl(url) {
  return new Promise((resolve) => {
    execFile('curl', ['-s', '-m', '10', '-A', GTX_UA, '-w', '\n%{http_code}', url],
      { windowsHide: true, maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
        if (err) {
          if (err.code === 'ENOENT') curlOK = false; // no curl → fetch fallback
          resolve(null);
          return;
        }
        const s = String(stdout);
        const cut = s.lastIndexOf('\n');
        if (cut < 0) { resolve(null); return; }
        resolve({ status: Number(s.slice(cut + 1).trim()) || 0, body: s.slice(0, cut) });
      });
  });
}
async function gtxOnce(text, loc) {
  const host = GTX_HOSTS[gtxHostIdx % GTX_HOSTS.length];
  const url = `https://${host}/translate_a/single?client=gtx&sl=en&tl=${loc}&dt=t&q=${encodeURIComponent(text)}`;
  let status = 0, body = null, fetched = false;
  if (curlOK) {
    const res = await gtxCurl(url);
    if (res) { status = res.status; body = res.body; }
    else if (curlOK) return { failed: true }; // curl error (timeout etc.)
    // res == null with curlOK == false falls through to fetch below
  }
  if (!curlOK || (!body && status === 0)) {
    fetched = true;
    let r;
    try {
      r = await fetch(url, { headers: { 'User-Agent': GTX_UA } });
    } catch { return { failed: true }; }
    status = r.status;
    if (r.ok) { try { body = JSON.stringify(await r.json()); } catch { body = null; } }
  }
  if (status === 429) { gtxHostIdx++; return { throttle: true }; }
  if (status !== 200 || !body) return { failed: true };
  try {
    const j = JSON.parse(body);
    const out = Array.isArray(j?.[0]) ? j[0].map((seg) => (seg && seg[0]) || '').join('') : '';
    return out ? { text: out } : { failed: true };
  } catch { return { failed: true }; }
}

const MM = 'https://api.mymemory.translated.net/get';
// Hand overrides for strings where gtx answers in English (no MT pair for
// that language). Seeded here so the locale never ships the English text and
// re-runs keep the override instead of re-caching Google's English reply.
const HAND = {
  'el\tStay on the Bite': 'Μείνετε στο δάγκωμα',
};
// MyMemory raises the free daily cap from 1,000 to 50,000 segments when you
// pass a contact email (documented at mymemory.translated.net/doc/usagelimits.php).
// This is the site's public contact address, not a secret key.
const MM_EMAIL = 'contact@blueseasfishing.com';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastAt = 0, throttled = false, quotaOut = false;
// gtx 429-wave state: escalating pause lets short waves pass DURING a run
// instead of dumping the remaining files to English. Fresh per process.
let gtxPauseUntil = 0, gtxWaveStrikes = 0;
const WAVE_MAX_STRIKES = 6;

// MyMemory rejects queries over ~480 chars with a "QUERY LENGTH LIMIT
// EXCEEDED" warning (returned as a normal 200, so it would otherwise pass
// through as a bogus "translation"). Chunk long literals at word boundaries.
const MM_MAX = 400;
function chunkLong(text) {
  if (text.length <= MM_MAX) return [text];
  const pieces = [];
  let rest = text;
  while (rest.length > MM_MAX) {
    let cut = rest.lastIndexOf('. ', MM_MAX);
    if (cut < MM_MAX * 0.5) cut = rest.lastIndexOf('; ', MM_MAX);
    if (cut < MM_MAX * 0.5) cut = rest.lastIndexOf(', ', MM_MAX);
    if (cut < MM_MAX * 0.5) cut = rest.lastIndexOf(' ', MM_MAX);
    if (cut < MM_MAX * 0.5) cut = MM_MAX; else cut += 1;
    pieces.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) pieces.push(rest);
  return pieces;
}

async function mmOnce(text, loc) {
  const pair = MM_PAIRS[loc] || `en|${loc}`;
  let r;
  try {
    r = await fetch(`${MM}?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(pair)}&de=${encodeURIComponent(MM_EMAIL)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
  } catch { return { failed: true }; }
  // 429 from MyMemory = daily quota exhausted (distinct from a burst backoff):
  // flag it so the caller exits 4 and the resume loop waits out the reset.
  if (r.status === 429) { quotaOut = true; return { throttle: true }; }
  if (!r.ok) return { failed: true };
  try {
    const j = await r.json();
    const t = j?.responseData?.translatedText;
    // MyMemory returns the input + a warning header when over the length cap
    if (t && !/^MYMEMORY WARNING/i.test(t)) return { text: t };
    return { failed: true };
  } catch { return { failed: true }; }
}

async function translateOne(text, loc, cache) {
  const key = `${loc}\t${text}`;
  if (HAND[key] != null) return HAND[key];
  if (cache[key] != null) return cache[key];
  // Chunk oversized literals so no single MyMemory query exceeds the cap.
  const pieces = chunkLong(text);
  const done = [];
  for (const piece of pieces) {
    const k = piece === text ? key : `${loc}\t${piece}`;
    let t = cache[k];
    if (t == null) {
      t = null;
      let a = 0;
      while (a < 5 && !throttled && t == null) {
        // Sustained outage already declared for this process → skip fast
        // (each file's `throttled = false` reset still lets the next file
        // re-probe once via the strikes check below).
        if (gtxWaveStrikes >= WAVE_MAX_STRIKES) { throttled = true; break; }
        const pauseLeft = gtxPauseUntil - Date.now();
        if (pauseLeft > 0) await sleep(pauseLeft);
        // 700ms pace (≈85 req/min): the old 260ms pace (≈230 req/min) was
        // what triggered gtx's per-IP bulk throttle waves mid-pass.
        const wait = lastAt + 700 - Date.now();
        if (wait > 0) await sleep(wait);
        lastAt = Date.now();
        const { wire, tokens } = protect(piece);
        // gtx first (fast, no daily cap); MyMemory only as last resort.
        // Track gtx's 429 flag BEFORE any MM call: MM quota-out (also a 429)
        // must never mask a real gtx throttle wave.
        let g = await gtxOnce(wire, loc);
        const gtxDown = g.throttle === true;
        if (!g.text && !quotaOut) {
          const m = await mmOnce(wire, loc);
          if (m.text) g = m; // keep gtx's flags when MM can't help either
        }
        if (g.text) {
          const got = restore(g.text, tokens).trim();
          if (got) { t = got; cache[k] = t; gtxWaveStrikes = 0; gtxPauseUntil = 0; }
          else a++; // empty/junk result — count toward the per-string bound
        }
        else if (gtxDown) {
          // 429 wave: wait it out IN PLACE (short waves last 1–3 min) instead
          // of dumping the rest of the file to English. Escalating pause,
          // capped; after WAVE_MAX_STRIKES rounds declare a sustained outage
          // and let the run exit 2 for the driver's cooldown.
          gtxWaveStrikes++;
          if (gtxWaveStrikes >= WAVE_MAX_STRIKES) { throttled = true; break; }
          gtxPauseUntil = Date.now() + Math.min(30000 * gtxWaveStrikes, 120000);
          // do NOT increment a — the string retries fully once the wave lifts
        }
        else {
          // genuine failure (network/5xx, or MM quota with no gtx throttle)
          a++;
          if (a < 5) await sleep(1300 * a);
        }
      }
    }
    if (t == null) {
      // TRUE fallback: the transport failed for this piece, so the source
      // text ships untranslated. A translation that legitimately EQUALS the
      // source ("Forum", "Bermuda", loanwords) is a success, not a fallback —
      // counting dst === source made exit 0 unreachable and the resume driver
      // looped forever on the same cached identicals.
      t = piece; // source fallback (not cached → retried next run)
      totalFallbacks++;
      debugFallback(loc, piece);
    }
    done.push(t);
  }
  return done.join(' ').replace(/\s+([,.;:!?])/g, '$1').trim();
}

// Same signature/behaviour contract as mt.mjs translateBatch, but MyMemory.
let totalFallbacks = 0;
// I18N_DEBUG=1 → append every string counted as a fallback to /tmp/bsf-fallbacks.txt
// so we can tell genuine English leftovers apart from translations that are
// legitimately identical to the source (brands, loanwords, single nouns).
const DEBUG_FB = process.env.I18N_DEBUG === '1';
function debugFallback(loc, s) {
  if (!DEBUG_FB) return;
  try { appendFileSync('/tmp/bsf-fallbacks.txt', `${loc}\t${JSON.stringify(s)}\n`); } catch {}
}
async function translateBatch(strings, loc, cache, onProgress, stats) {
  const out = new Array(strings.length);
  for (let i = 0; i < strings.length; i++) {
    const s = strings[i];
    if (s == null || !s.trim()) { out[i] = s; continue; }
    const before = totalFallbacks;
    const dst = await translateOne(s, loc, cache);
    // count strings that had at least one piece genuinely fall back
    if (totalFallbacks > before && stats) stats.fallbacks = (stats.fallbacks || 0) + 1;
    out[i] = dst;
  }
  if (onProgress) onProgress(strings.length, strings.length);
  return out;
}

// ---------- species-db pack localization (textual, structure-preserving) ----------
// Translate quoted English string literals that hold display text, skipping
// property names, URLs/paths, env codes and pure numbers. Splice by offset so
// the surrounding JS (IIFEs, comments, merge logic) stays byte-identical.
const LIT_RE = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g;
function isWordy(s) { return /[A-Za-z]{2,}\s/.test(s) || (/[A-Za-z]{3,}/.test(s) && !/[{}();=<>]/.test(s)); }
function looksLikeCode(val) {
  // Prose may legitimately contain () and ; ("lakes, rivers (reservoirs)") —
  // only skip real paths/URLs/markup fragments. The property-key guard in
  // localizePack handles the structural cases this used to over-catch.
  return /[{}<>]|^\/|\/\/|https?:|\.(js|css|png|jpg|jpeg|webp|svg)$/i.test(val);
}
// Binomial/trinomial scientific names ("Micropterus salmoides", "Acipenser
// oxyrinchus desotoi") stay Latin — MT would otherwise "translate" the
// epithet and break fish-id's sci-name matching.
const SCI_RE = /^[A-Z][a-z]{2,}(?:\s[a-z][a-z-]*){1,2}$/;
// Same slug algorithm the client uses (gallery.toSlug / fish-id.toSlug), so a
// stored slug always equals toSlug(englishName).
const slugify = (str) => String(str || '').toLowerCase()
  .replace(/[\(\)\[\]]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
// Detect `name:` / `species:` keys directly before a string literal
// (tolerates quoted JSON keys: "name": "...").
const NAME_KEY_RE = /(?:name|species)["']?\s*:\s*$/;
// `env` values are functional enum codes ('Freshwater'/'Saltwater'/'Brackish')
// that fish-id and gallery compare with === — never translate them.
const ENV_KEY_RE = /(?:\benv)["']?\s*:\s*$/;
// Tuple-pack row: ['Common Name', 'Sci name'] — expanded*.js consumes these
// positionally, so the translated name needs a slug appended as element 3.
const TUPLE_RE = /\[\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\]/g;
async function localizePack(js, loc, cache) {
  // expanded*.js builds rows from positional tuples — patch the consumer to
  // carry the slug element through (exact strings; no-ops in other packs).
  const hadTupleConsumer =
    js.includes('fish.forEach(([name, sci]) => {') || js.includes('var name = pair[0], sci = pair[1];');
  js = js
    .replace('fish.forEach(([name, sci]) => {', 'fish.forEach(([name, sci, slug]) => {')
    .replace('extra.push({name, sci, env:', 'extra.push({name, slug, sci, env:')
    .replace('var name = pair[0], sci = pair[1];', 'var name = pair[0], sci = pair[1], slug = pair[2];')
    .replace('extra.push({ name: name, sci: sci, env:', 'extra.push({ name: name, slug: slug, sci: sci, env:');
  // images/regions packs merge by name only — add a slug fallback so a
  // translation mismatch can't orphan the row (same string in both files).
  const NAME_ONLY_MERGE = 'return norm(s.name || s.species) === norm(rec.name); }';
  const SLUG_FALLBACK_MERGE = 'return norm(s.name || s.species) === norm(rec.name) || (s.slug && s.slug === norm(rec.name).replace(/[^a-z0-9]+/g,\'-\').replace(/^-+|-+$/g,\'\')); }';
  js = js.split(NAME_ONLY_MERGE).join(SLUG_FALLBACK_MERGE);
  const jobs = [];
  const slugJobs = [];
  let m;
  LIT_RE.lastIndex = 0;
  while ((m = LIT_RE.exec(js)) !== null) {
    const val = m[1] != null ? m[1] : m[2];
    const q = m[1] != null ? '"' : "'";
    if (!val) continue;
    // property keys ("name": …) are structural — translating them would
    // destroy the pack's API (client reads s.name / s.sci / s.env)
    if (/^\s*:/.test(js.slice(m.index + m[0].length))) continue;
    if (SCI_RE.test(val)) continue;            // scientific names stay untouched
    if (!isWordy(val)) continue;               // numbers / punctuation only
    if (looksLikeCode(val)) continue;          // URLs, paths, code fragments
    if (val.length < 3) continue;
    const before = js.slice(Math.max(0, m.index - 16), m.index);
    if (ENV_KEY_RE.test(before)) continue;     // enum codes compared with ===
    // `name: "X"` → inject slug:"x" right after the literal so translated
    // display names keep linking to the English /species/x.html pages
    if (q === '"' && NAME_KEY_RE.test(before)) {
      const slug = slugify(val);
      if (slug) slugJobs.push({ at: m.index + 1 + val.length + 1, text: `, slug: "${slug}"` });
    }
    jobs.push({ start: m.index + 1, end: m.index + 1 + val.length, val, q });
  }
  // tuple rows in expanded*.js: translate the common name, append the slug as
  // a third element so the patched consumer gets it
  if (hadTupleConsumer) {
    TUPLE_RE.lastIndex = 0;
    let t;
    while ((t = TUPLE_RE.exec(js)) !== null) {
      const name = t[1];
      if (SCI_RE.test(name) || !isWordy(name) || name.length < 3) continue;
      const close = t.index + t[0].lastIndexOf(']');
      const slug = slugify(name);
      if (slug) slugJobs.push({ at: close, text: `,'${slug}'` });
    }
  }
  if (!jobs.length && !slugJobs.length) return js;
  const results = jobs.length ? await translateList(jobs.map((j) => j.val), loc, cache) : [];
  const ops = [];
  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    const t = results[i] ?? j.val;
    if (t === j.val) continue;
    const safe = t.replace(/[\r\n]+/g, ' ').split(j.q).join(''); // never break the literal
    ops.push({ start: j.start, end: j.end, text: safe });
  }
  for (const sj of slugJobs) ops.push({ start: sj.at, end: sj.at, text: sj.text });
  // splice everything in reverse offset order so earlier offsets stay valid
  ops.sort((a, b) => b.start - a.start);
  let out = js;
  for (const op of ops) out = out.slice(0, op.start) + op.text + out.slice(op.end);
  return out;
}
async function translateList(list, loc, cache) {
  const out = [];
  for (const s of list) {
    const before = totalFallbacks;
    const t = await translateOne(s, loc, cache);
    // Pack strings that missed MT stay English (not cached → retried next
    // run). translateOne counts those; we only add pack context for the debug
    // dump so page and pack leftovers can be told apart.
    if (totalFallbacks > before) debugFallback(loc, '[pack] ' + s);
    out.push(t);
  }
  return out;
}

// ---------- main ----------
const caches = {};
const baseCaches = {}; // read-through view of the big main-build caches
for (const l of LOCALES) {
  baseCaches[l.code] = loadMainCache(l.code);
  // Merge the main build's translation cache so strings already translated
  // there are cache hits here (auth entries win on conflict).
  caches[l.code] = { ...baseCaches[l.code], ...loadCache(l.code) };
}

async function main() {
  // Startup probe: if EVERY gtx host is 429-ing right now, exit 2 at once —
  // a full pass would take ~10 minutes just to rediscover that.
  // Pace the probe calls: rapid-fire requests can themselves look like a
  // burst and keep the throttle window open even after it has expired.
  let gtxAlive = false;
  for (let i = 0; i < GTX_HOSTS.length && !gtxAlive; i++) {
    if (i) await sleep(700);
    const p = await gtxOnce('The fish are biting today', 'es');
    if (p.text) gtxAlive = true;
  }
  if (!gtxAlive) {
    console.log('\nAll gtx hosts throttled (429) at startup — exit 2, retry later.');
    process.exit(2);
  }

  const targets = ONLY_LOC ? TARGETS.filter((l) => l.code === ONLY_LOC) : TARGETS;

  if (!DATA_ONLY) {
    for (const rel of PAGES) {
      if (ONLY && !rel.includes(ONLY)) continue;
      const src = join(ROOT, rel);
      if (!existsSync(src)) { console.log(`  ? missing ${rel}`); continue; }
      const html = readFileSync(src, 'utf8');
      for (const l of targets) {
        // Throttling is a short-lived per-request condition, not a global
        // off-switch: reset it per page so a 429 wave only leaves that one
        // page in English (retried next run) instead of starving the rest.
        throttled = false;
        const stats = {};
        const r = await transformPage(rel, html, l.code, {
          cache: caches[l.code],
          stats,
          // Use this script's MyMemory transport (mt.mjs/gtx is IP-throttled).
          translateBatch,
        });
        const dir = join(ROOT, l.code);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, rel), r.html, 'utf8');
        console.log(`  ✓ ${l.code}/${rel}${r.fallbacks ? ` (fallbacks:${r.fallbacks})` : ''}`);
      }
    }
  }

  // <locale>/trip-planner.html is rebuilt above from the EN source, and
  // transformPage copies script blocks VERBATIM from that source — so any
  // script-text localization done directly in the locale files is reverted by
  // every run (verified 2026-10-16). Re-apply the per-locale script literals
  // right after the pages loop: pure string ops, no network, idempotent.
  if (!DATA_ONLY) {
    const lp = localizeTripPlanner({ quiet: !ONLY_LOC && !ONLY ? true : false });
    if (!lp.ok) console.error('  ! trip-planner script localization incomplete');
    else console.log('  ✓ trip-planner script text localized for ' + lp.report.map((r) => r.loc).join(' '));
    const lm = localizeMembersArea({ quiet: !ONLY_LOC && !ONLY ? true : false });
    if (!lm.ok) console.error('  ! members-area script localization incomplete');
    else console.log('  ✓ members-area script text localized for ' + lm.report.map((r) => r.loc).join(' '));
  }

  for (const file of DATA_FILES) {
    if (ONLY && !file.includes(ONLY)) continue;
    const src = join(ROOT, file);
    if (!existsSync(src)) continue;
    const js = readFileSync(src, 'utf8');
    for (const l of targets) {
      throttled = false;
      const out = await localizePack(js, l.code, caches[l.code]);
      const dir = join(ROOT, l.code);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, file), out, 'utf8');
      console.log(`  ✓ ${l.code}/${file}`);
    }
  }

  // Persist only the delta (new/changed entries) to auth-*.json — the big
  // main-build cache files stay owned by mt.mjs and are never rewritten here.
  for (const l of LOCALES) {
    const base = baseCaches[l.code] || {};
    const delta = {};
    for (const k in caches[l.code]) {
      if (!(k in base) || base[k] !== caches[l.code][k]) delta[k] = caches[l.code][k];
    }
    saveCache(l.code, delta);
  }
  // Exit 2 (throttled) FIRST: it is the actionable signal — the resume
  // driver cools down adaptively and retries from cache.
  if (throttled) { console.log('\nMT throttled (429). Re-run to resume from cache.'); process.exit(2); }
  // Remaining fallbacks with MM quota out: same actionable signal as a
  // throttle — retry later from cache (gtx recovers independently of MM's
  // daily quota). Exit 2 keeps the resume driver on its adaptive cooldown
  // instead of the old exit-4 "sleep until hour block" path.
  if (totalFallbacks) {
    console.log(`\n${totalFallbacks} strings still fell back to English (MyMemory quota ${quotaOut ? 'out' : 'ok'}) — exit 2, retry later from cache.`);
    process.exit(2);
  }
  console.log('\nDone.');
}

main();
