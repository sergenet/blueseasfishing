#!/usr/bin/env node
// tools/i18n/build.mjs — full-site localization build.
//
// 1. Injects hreflang cluster + lang-switch.js into every English source page
//    (idempotent — only writes when something changed).
// 2. Mirrors every source page into each target locale directory (es/, fr/, ...)
//    with translated text, rewritten links, locale canonical/hreflang.
//
// Incremental: manifest.json stores source sha1 per page; unchanged pages are
// skipped (unless --force). MT strings are cached in cache/<locale>.json so
// monthly regeneration only pays for new/changed text.
//
// Run:  node tools/i18n/build.mjs [--limit N] [--only substr] [--locale xx] [--force] [--no-en]
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALES, TARGETS, SKIP_DIRS, SKIP_FILES, SKIP_PATTERN } from './config.mjs';
import { loadCache, saveCache, quotaExhausted, spendCapReached, spendSummary } from './mt.mjs';
import { transformPage } from './transform.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const MANIFEST = join(HERE, 'manifest.json');
// bump when transform logic changes → forces full re-mirror
// 4 (2026-11-02): 'Blue Seas' joined the MT glossary. Titles shortened to
// "... | Blue Seas" were machine-translated like ordinary words, so every
// mirror built under v3 can carry "Mares azules" in its <title>. Bumping the
// version re-mirrors all pages; the cache returns existing translations, so
// only the affected strings are actually re-sent.
const VERSION = 4;

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const LIMIT = opt('--limit') ? parseInt(opt('--limit'), 10) : Infinity;
const ONLY = opt('--only');
const ONLY_LOC = opt('--locale');
const FORCE = args.includes('--force');
const NO_EN = args.includes('--no-en');

// ---------- scan source pages ----------
function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue;
      yield* walk(join(dir, e.name));
    } else if (e.name.endsWith('.html')) {
      if (SKIP_FILES.has(e.name) || SKIP_PATTERN.test(e.name)) continue;
      yield join(dir, e.name);
    }
  }
}

const sources = [];
for (const abs of walk(ROOT)) {
  const rel = abs.slice(ROOT.length + 1).replace(/\\/g, '/');
  if (ONLY && !rel.includes(ONLY)) continue;
  sources.push(rel);
}
sources.sort();
console.log(`Source pages: ${sources.length}${ONLY ? ` (filter: ${ONLY})` : ''}`);

let manifest = {};
if (existsSync(MANIFEST)) {
  try { manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')); } catch { manifest = {}; }
}
if (manifest.__version !== VERSION) { manifest = { __version: VERSION }; FORCE && console.log('(force)'); }

const sha1 = (s) => createHash('sha1').update(s).digest('hex');

// ---------- load caches ----------
const caches = {};
for (const l of LOCALES) caches[l.code] = loadCache(l.code);

// ---------- process ----------
let enWritten = 0, enSkipped = 0, mirrored = 0, skipped = 0, failed = 0, deferred = 0;
let done = 0;
const t0 = Date.now();

for (const rel of sources) {
  done++;
  const src = readFileSync(join(ROOT, rel), 'utf8');
  const hash = sha1(rel + '\0' + VERSION + '\0' + src);

  // fast path: unchanged source + all locale files present → skip
  const prev = manifest[rel];
  const localesNeeded = ONLY_LOC ? LOCALES.filter((l) => l.code === ONLY_LOC) : LOCALES;
  const outputsExist = localesNeeded.every((l) =>
    l.code === 'en' ? true : existsSync(join(ROOT, l.code, rel)));
  if (!FORCE && prev === hash && outputsExist && (NO_EN || existsSync(join(ROOT, rel)))) {
    skipped++;
    continue;
  }

  // 1. English structural injection (hreflang + switcher + lang)
  let pageFallbacks = 0;
  if (!NO_EN) {
    try {
      const r = await transformPage(rel, src, 'en');
      const en = r.html;
      if (en !== src) {
        writeFileSync(join(ROOT, rel), en);
        enWritten++;
      } else enSkipped++;
    } catch (e) {
      console.error(`  ! en ${rel}: ${e.message}`);
      failed++;
      continue;
    }
  }

  // 2. locale mirrors
  for (const l of TARGETS) {
    if (ONLY_LOC && l.code !== ONLY_LOC) continue;
    if (quotaExhausted || spendCapReached) break;
    try {
      const r = await transformPage(rel, src, l.code, {
        cache: caches[l.code],
        onProgress: (a, b) => { if (a === b) process.stdout.write(`\r  ${l.code}: ${rel} `.padEnd(80)); },
      });
      const dest = join(ROOT, l.code, rel);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, r.html);
      mirrored++;
      pageFallbacks += r.fallbacks || 0;
    } catch (e) {
      console.error(`  ! ${l.code} ${rel}: ${e.message}`);
      failed++;
    }
  }

  // Only mark done when every segment translated — otherwise next run retries it.
  if (pageFallbacks === 0 && !quotaExhausted && !spendCapReached) {
    manifest[rel] = hash;
  } else {
    deferred++;
    // Drop any stale entry: the mirror on disk may hold untranslated fallback
    // text, and a still-valid hash would make the next run fast-path-skip it,
    // leaving the degraded file in place forever.
    delete manifest[rel];
  }
  if (done % 25 === 0) {
    writeFileSync(MANIFEST, JSON.stringify(manifest));
    for (const l of LOCALES) saveCache(l.code, caches[l.code]);
    const secs = ((Date.now() - t0) / 1000).toFixed(0);
    console.log(`\n[${done}/${sources.length}] mirrored=${mirrored} skipped=${skipped} deferred=${deferred} failed=${failed} (${secs}s)`);
  }
  if (done >= LIMIT) break;
  if (quotaExhausted || spendCapReached) { console.log('\nMT stopped early — re-run to resume where it stopped.'); break; }
}

// ---------- finalize ----------
writeFileSync(MANIFEST, JSON.stringify(manifest));
for (const l of LOCALES) saveCache(l.code, caches[l.code]);
const secs = ((Date.now() - t0) / 1000).toFixed(0);
console.log(`\nDone in ${secs}s: en-injected=${enWritten} (unchanged=${enSkipped}), mirrored=${mirrored}, skipped=${skipped}, deferred=${deferred}, failed=${failed}`);
if (quotaExhausted) { console.log('MT quota hit — re-run this command to resume where it stopped.'); process.exit(2); }
if (spendCapReached) {
  console.log(`MT spend cap hit — ${spendSummary()}.`);
  console.log('Nothing more will be billed this month; re-run next month (cap and GCP budget both reset on the 1st).');
  process.exit(3);
}
if (failed) process.exit(1);
