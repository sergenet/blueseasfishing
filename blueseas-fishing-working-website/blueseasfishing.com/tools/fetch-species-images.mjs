#!/usr/bin/env node
/**
 * fetch-species-images.mjs
 *
 * Bakes one representative photo per species into the site so the species
 * database and generated pages work without runtime Wikipedia API calls
 * (ad-blockers, rate limits, and missing pages made those unreliable).
 *
 * For every species that has no image yet:
 *   1. Look up the scientific name on Wikipedia (pageimages, 1200px thumb)
 *   2. Fall back to the common name with parentheticals stripped
 *   3. Fall back to the raw common name
 * Downloads the best image to  images/species/<slug>.<ext>  and emits
 * species-db.images.js — a self-merging, fill-or-add pack like regions.
 *
 * Cached: species with a local file are skipped, so re-runs are cheap.
 * Polite: batched queries (~40 titles/request), 1s pause between requests,
 * descriptive User-Agent per Wikimedia policy.
 *
 * Run:  node tools/fetch-species-images.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'images', 'species');
const PACK = join(ROOT, 'species-db.images.js');
const UA = 'BlueSeasFishingSiteBot/1.0 (https://www.blueseasfishing.com; contact: admin@blueseasfishing.com)';
const BATCH = 40;

/* ----------------------------------------------------- load the species DB */
function loadSpeciesDb() {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  const db = [];
  const byName = new Map();
  const take = () => {
    for (const key of ['SPECIES_DB', 'SPECIES_DB_ENRICH', 'SPECIES_DB_CATALOG_ROWS']) {
      const arr = sandbox.window[key];
      if (!Array.isArray(arr)) continue;
      for (const s of arr) {
        const name = String(s?.name || '').toLowerCase().trim();
        if (!name) continue;
        if (!byName.has(name)) { byName.set(name, s); db.push(s); }
        else {
          const ex = byName.get(name);
          for (const [f, v] of Object.entries(s)) if (v != null && v !== '' && (ex[f] == null || ex[f] === '')) ex[f] = v;
        }
      }
    }
  };
  for (const file of ['species-db.js', 'species-db.enriched.js', 'species-db.enriched.world.js', 'species-db.expanded.js', 'species-db.expanded.worldwide.js']) {
    try { vm.runInContext(readFileSync(join(ROOT, file), 'utf8'), sandbox); } catch (e) { console.warn(`  ! ${file}: ${e.message}`); }
    take();
  }
  return db;
}

const toSlug = (str) => String(str || '').toLowerCase()
  .replace(/[()[\]]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const stripParens = (s) => String(s || '').replace(/\s*[([].*?[)\]]\s*/g, ' ').replace(/\s+/g, ' ').trim();

/* ------------------------------------------------------------- wikipedia */
async function apiBatch(titles) {
  const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages'
    + '&piprop=thumbnail%7Coriginal&pithumbsize=1200&redirects=1&titles='
    + encodeURIComponent(titles.join('|'));
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Map a batch response back to requested titles → image URL. */
function extract(json, requested) {
  const out = new Map(); // requested title -> url
  const q = json?.query;
  if (!q?.pages) return out;
  // Alias chains: requested -> normalized -> redirect target -> page key
  const alias = new Map();
  for (const t of requested) alias.set(t, t);
  for (const n of q.normalized || []) if (alias.has(n.from)) alias.set(n.from, n.to);
  for (const r of q.redirects || []) for (const [from, to] of [...alias]) if (to === r.from) alias.set(from, r.to);
  const byTitle = new Map(Object.values(q.pages).map((p) => [p.title, p]));
  for (const [from, to] of alias) {
    const p = byTitle.get(to);
    const url = p?.thumbnail?.source || p?.original?.source;
    if (p && url) out.set(from, url);
  }
  return out;
}

async function lookupAll(candidates) {
  // candidates: Map lookupTitle -> species[] ; returns Map speciesName -> url
  const found = new Map();
  const titles = [...candidates.keys()];
  for (let i = 0; i < titles.length; i += BATCH) {
    const batch = titles.slice(i, i + BATCH);
    try {
      const m = extract(await apiBatch(batch), batch);
      for (const [t, url] of m) for (const sp of candidates.get(t)) if (!found.has(sp.name)) found.set(sp.name, url);
    } catch (e) {
      console.warn(`  ! batch failed: ${e.message}`);
    }
    process.stdout.write(`  queried ${Math.min(i + BATCH, titles.length)}/${titles.length}\r`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  process.stdout.write('\n');
  return found;
}

/* ------------------------------------------------------------- downloads */
async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 3000) throw new Error(`suspiciously small (${buf.length}b)`);
  writeFileSync(dest, buf);
  return buf.length;
}

/* ------------------------------------------------------------------ main */
const db = loadSpeciesDb();
const seen = new Map();
for (const s of db) { const k = String(s.name || '').toLowerCase().trim(); if (k && !seen.has(k)) seen.set(k, s); }
const species = [...seen.values()].filter((s) => s.name);
console.log(`DB: ${species.length} unique species`);

// Existing pack rows (re-runs): keep prior img values so we only fill gaps.
let existingRows = new Map();
if (existsSync(PACK)) {
  const sandbox = { window: {}, console, setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {} };
  vm.createContext(sandbox);
  try {
    vm.runInContext(readFileSync(PACK, 'utf8'), sandbox);
    if (Array.isArray(sandbox.window.SPECIES_DB_IMAGE_ROWS)) {
      existingRows = new Map(sandbox.window.SPECIES_DB_IMAGE_ROWS.map((r) => [String(r.name).toLowerCase(), r.img]));
    }
  } catch (e) { console.warn(`  ! could not reuse pack (${e.message}), starting fresh`); }
}

// Local files already downloaded?
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
const haveFiles = new Set(readdirSync(OUT_DIR).map((f) => f.toLowerCase()));
const localFor = (slug) => {
  for (const ext of ['webp', 'jpg', 'jpeg', 'png']) {
    if (haveFiles.has(`${slug}.${ext}`)) return `/images/species/${slug}.${ext}`;
  }
  return '';
};

const needLookup = [];
for (const sp of species) {
  const slug = toSlug(sp.name);
  const existing = existingRows.get(String(sp.name).toLowerCase());
  const local = localFor(slug);
  if ((existing && existing !== 'wiki-pending') || local) continue;
  needLookup.push(sp);
}
console.log(`Need lookup: ${needLookup.length} (cached: ${species.length - needLookup.length})`);

// Build candidate lookup titles in priority order.
const candidates = new Map(); // title -> Set<species>
const addCand = (title, sp) => {
  if (!title) return;
  if (!candidates.has(title)) candidates.set(title, []);
  candidates.get(title).push(sp);
};
for (const sp of needLookup) {
  if (sp.sci) addCand(String(sp.sci).trim(), sp);
}

const bySci = await lookupAll(candidates);
const still = needLookup.filter((sp) => !bySci.has(sp.name));
const candidates2 = new Map();
for (const sp of still) addCand(stripParens(sp.name), sp);
const byCommon = await lookupAll(candidates2);
const still2 = needLookup.filter((sp) => !bySci.has(sp.name) && !byCommon.has(sp.name));
const candidates3 = new Map();
for (const sp of still2) addCand(String(sp.name).trim(), sp);
const byRaw = still2.length ? await lookupAll(candidates3) : new Map();

// Pass 4: Wikipedia articles that exist but have no page image — search
// Wikimedia Commons' File namespace for the species name instead.
const byCommons = new Map();
{
  const still3 = needLookup.filter((sp) => !bySci.has(sp.name) && !byCommon.has(sp.name) && !byRaw.has(sp.name));
  const titles = still3.map((sp) => stripParens(sp.name));
  const owner = new Map(still3.map((sp) => [stripParens(sp.name), sp]));
  let commonsDone = 0;
  for (let i = 0; i < titles.length; i += BATCH) {
    const batch = titles.slice(i, i + BATCH);
    for (let j = 0; j < batch.length; j += 10) {
      const sub = batch.slice(j, j + 10);
      try {
        const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json'
          + '&generator=search&gsrnamespace=6&gsrlimit=3&prop=imageinfo&iiprop=url&iiurlwidth=1200'
          + '&gsrsearch=' + encodeURIComponent(sub.map((t) => `${t} fish`).join(' OR '));
        const json = await (await fetch(url, { headers: { 'User-Agent': UA } })).json();
        const pages = Object.values(json?.query?.pages || {});
        // generator=search returns ranked pages for the whole OR query; match
        // each requested title to the first result containing it.
        for (const t of sub) {
          const tl = t.toLowerCase();
          const hit = pages.find((p) => String(p.title || '').toLowerCase().includes(tl)
            && /\.(jpe?g|png|webp)$/i.test(p.title || ''));
          const u = hit?.imageinfo?.[0]?.thumburl || hit?.imageinfo?.[0]?.url;
          if (u && owner.has(t) && !byCommons.has(owner.get(t).name)) byCommons.set(owner.get(t).name, u);
        }
      } catch (e) { console.warn(`  ! commons batch failed: ${e.message}`); }
      await new Promise((r) => setTimeout(r, 1000));
    }
    commonsDone += batch.length;
    process.stdout.write(`  commons ${commonsDone}/${titles.length}\r`);
  }
  process.stdout.write('\n');
}

// Pass 5: last resort for the rest — one focused search per species.
{
  const still4 = needLookup.filter((sp) => !bySci.has(sp.name) && !byCommon.has(sp.name)
    && !byRaw.has(sp.name) && !byCommons.has(sp.name));
  for (const sp of still4) {
    try {
      const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json'
        + '&generator=search&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=1200'
        + '&gsrsearch=' + encodeURIComponent(`"${stripParens(sp.name)}"`);
      const json = await (await fetch(url, { headers: { 'User-Agent': UA } })).json();
      const pages = Object.values(json?.query?.pages || {})
        .filter((p) => /\.(jpe?g|png|webp)$/i.test(p.title || ''));
      const u = pages[0]?.imageinfo?.[0]?.thumburl || pages[0]?.imageinfo?.[0]?.url;
      if (u) byCommons.set(sp.name, u);
    } catch (e) { console.warn(`  ! commons solo failed for ${sp.name}: ${e.message}`); }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

const rows = [];
for (const sp of species) {
  const nameLower = String(sp.name).toLowerCase();
  const slug = toSlug(sp.name);
  const prior = existingRows.get(nameLower);
  let img = (prior && prior !== 'wiki-pending') ? prior : '';
  const local = localFor(slug);
  const hit = bySci.get(sp.name) || byCommon.get(sp.name) || byRaw.get(sp.name) || byCommons.get(sp.name) || '';
  if (!local && hit) {
    const ext = (extname(new URL(hit).pathname) || '.jpg').toLowerCase().replace(/[^.a-z0-9]/g, '') || '.jpg';
    const dest = join(OUT_DIR, `${slug}${ext}`);
    try {
      const size = await download(hit, dest);
      console.log(`  ✓ ${sp.name} ← ${slug}${ext} (${Math.round(size / 1024)}KB)`);
      haveFiles.add(`${slug}${ext}`.toLowerCase());
    } catch (e) {
      console.warn(`  ✗ download failed ${sp.name}: ${e.message}`);
    }
  }
  const finalLocal = localFor(slug);
  if (finalLocal) img = finalLocal;
  else if (hit) img = hit; // hotlink fallback if the download failed
  else if (prior) img = prior;
  rows.push({ name: sp.name, img });
}

const withImg = rows.filter((r) => r.img).length;
const misses = rows.filter((r) => !r.img).map((r) => r.name);

const pack = `// species-db.images.js — image pack (auto-generated by tools/fetch-species-images.mjs)
// img is a local /images/species/ path (preferred) or a Wikimedia URL fallback.
// Self-merging: fills missing img into window.SPECIES_DB (fill-or-add, idempotent).
(function () {
  if (typeof window === 'undefined') return;
  var ROWS = [
${rows.map((r) => `  { name: ${JSON.stringify(r.name)}, img: ${JSON.stringify(r.img)} },`).join('\n')}
  ];
  function merge() {
    if (!Array.isArray(window.SPECIES_DB)) return;
    var norm = function (x) { return String(x || '').toLowerCase().trim(); };
    var isEmpty = function (v) { return v == null || (typeof v === 'string' && !v.trim()); };
    ROWS.forEach(function (rec) {
      var m = window.SPECIES_DB.find(function (s) { return norm(s.name || s.species) === norm(rec.name); });
      if (m) { if (isEmpty(m.img) && rec.img) m.img = rec.img; }
    });
  }
  if (Array.isArray(window.SPECIES_DB)) merge();
  else { var tries = 0; (function wait() { if (Array.isArray(window.SPECIES_DB)) merge(); else if (tries++ < 60) setTimeout(wait, 100); })(); }
  window.SPECIES_DB_IMAGE_ROWS = ROWS;
  try { document.dispatchEvent(new Event('bsf-db-enriched')); } catch (e) {}
})();
`;
writeFileSync(PACK, pack);
writeFileSync(join(ROOT, '.image-misses.txt'), misses.join('\n') + (misses.length ? '\n' : ''));

console.log(`\nDone: ${withImg}/${rows.length} species have images; ${misses.length} misses (see .image-misses.txt)`);
if (misses.length) console.log('Sample misses: ' + misses.slice(0, 12).join(', '));
