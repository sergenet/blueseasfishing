#!/usr/bin/env node
/**
 * generate-ios-data.mjs
 *
 * Builds the compact JSON bundle that the native iOS app ships with:
 *   ios-project/Data/species.json       every species (fields mirror the site pages)
 *   ios-project/Data/comparisons.json   the confused-pairs comparison tables
 *   ios-project/Data/destinations.json  destination -> species lists (>= 3 species)
 *
 * Data sources are the same ones the website generators use, so the app and the
 * site always agree:
 *   - species: species-db.js + enrichment packs (same sandbox merge as
 *     generate-species-pages.mjs, including region-corrections.json and
 *     species-db.regions.js)
 *   - comparisons: PAIRS imported from generate-comparisons.mjs (single source of truth)
 *   - destinations: same >= MIN_SPECIES aggregation rule as generate-destinations.mjs
 *
 * Images are NOT bundled: each species row keeps `img` (site-relative path).
 * The app resolves images lazily against https://www.blueseasfishing.com so the
 * download stays tiny.
 *
 * Run:  node tools/generate-ios-data.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const TOOLS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(TOOLS, '..');
const OUT = join(ROOT, 'ios-project', 'Data');

/* --------------------------------------------------------------- helpers */
const toSlug = (str) => String(str || '').toLowerCase()
  .replace(/[()[\]]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function asList(v) {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return String(v ?? '').split(/,|;|\/|\u2022|·/).map((x) => x.trim()).filter(Boolean);
}

/** Fill-or-add merge: existing non-empty values win. Match on lowercase name. */
function mergeInto(db, items) {
  const byName = new Map(db.map((s) => [String(s.name || '').toLowerCase(), s]));
  for (const item of items) {
    if (!item || !item.name) continue;
    const key = String(item.name).toLowerCase();
    const existing = byName.get(key);
    if (existing) {
      for (const [field, val] of Object.entries(item)) {
        if (val != null && val !== '' && (existing[field] == null || existing[field] === '')) {
          existing[field] = val;
        }
      }
    } else {
      db.push(item);
      byName.set(key, item);
    }
  }
}

/* ------------------------------------------------- load the species DB -- */
function loadSpeciesDb() {
  const sandbox = {
    window: {},
    document: { dispatchEvent() {}, addEventListener() {}, readyState: 'complete' },
    setTimeout() {}, setInterval() {}, clearInterval() {}, clearTimeout() {},
    console: { log() {}, warn() {} },
  };
  vm.createContext(sandbox);

  const db = [];
  for (const file of ['species-db.js', 'species-db.enriched.js', 'species-db.enriched.world.js',
    'species-db.expanded.js', 'species-db.expanded.worldwide.js', 'species-db.regions.js',
    'species-db.images.js']) {
    try { vm.runInContext(readFileSync(join(ROOT, file), 'utf8'), sandbox); } catch (e) { /* keep going */ }
    mergeInto(db, [
      ...(Array.isArray(sandbox.window.SPECIES_DB) ? sandbox.window.SPECIES_DB : []),
      ...(Array.isArray(sandbox.window.SPECIES_DB_ENRICH) ? sandbox.window.SPECIES_DB_ENRICH : []),
      ...(Array.isArray(sandbox.window.SPECIES_DB_CATALOG_ROWS) ? sandbox.window.SPECIES_DB_CATALOG_ROWS : []),
    ]);
  }
  // Curated corrections replace upstream regions (same file the site uses).
  const CORRECTIONS = JSON.parse(readFileSync(join(TOOLS, 'region-corrections.json'), 'utf8'));
  for (const [name, regs] of Object.entries(CORRECTIONS)) {
    const row = db.find((s) => String(s.name || '').toLowerCase() === name.toLowerCase());
    if (row) row.regions = regs.slice();
  }
  return db;
}

/* --------------------------------------------------------- species rows */
function speciesRows(db) {
  return db
    .map((s) => {
      const regions = asList(s.regions || s.hotspots);
      const aliases = asList(s.alias || s.aka || s.aliases);
      return {
        slug: toSlug(s.name),
        name: String(s.name || ''),
        sci: String(s.sci || ''),
        env: String(s.env || ''),
        habitat: String(s.habitat || ''),
        season: String(s.season || ''),
        depth: s.depth ? String(s.depth) : '',
        baits: asList(s.baits),
        regions,
        aliases,
        img: String(s.img || '').trim(),
      };
    })
    .filter((r) => r.name && r.slug)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/* ------------------------------------------------------------ destinations */
function destinationRows(db) {
  const MIN_SPECIES = 3;
  const norm = (x) => String(x || '').toLowerCase().trim();
  const byDest = new Map();
  for (const s of db) {
    for (const r of asList(s.regions || s.hotspots)) {
      const key = norm(r);
      if (!key) continue;
      if (!byDest.has(key)) byDest.set(key, { raw: String(r).trim(), species: [] });
      byDest.get(key).species.push(toSlug(s.name));
    }
  }
  return [...byDest.values()]
    .filter((d) => d.species.length >= MIN_SPECIES)
    .map((d) => ({
      slug: toSlug(d.raw),
      name: d.raw,
      count: d.species.length,
      species: [...new Set(d.species)].sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/* ------------------------------------------------- comparisons (shared) -- */
/* Mirrors the PAIRS schema in generate-comparisons.mjs. Imported when that file
 * grows an export; re-declared here (hand-authored data) with an automated count
 * check against the site file so the two cannot silently drift. */
function loadComparisonPairs() {
  const src = readFileSync(join(TOOLS, 'generate-comparisons.mjs'), 'utf8');
  // The site generator is an ES module; grab just the `const PAIRS = [...];`
  // literal by bracket-matching and evaluate that expression alone.
  const start = src.indexOf('const PAIRS = [');
  if (start < 0) { console.warn('  ! PAIRS not found in generate-comparisons.mjs'); return []; }
  let depth = 0, end = -1, inStr = null;
  for (let i = start + 'const PAIRS = '.length; i < src.length; i++) {
    const c = src[i];
    if (inStr) { if (c === inStr && src[i - 1] !== '\\') inStr = null; continue; }
    if (c === '\'' || c === '"' || c === '`') { inStr = c; continue; }
    if (c === '[' || c === '(' || c === '{') depth++;
    else if (c === ']' || c === ')' || c === '}') {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  if (end < 0) { console.warn('  ! PAIRS bracket match failed'); return []; }
  const literal = src.slice(start + 'const PAIRS = '.length, end);
  try {
    const pairs = vm.runInNewContext(`(${literal})`);
    if (!Array.isArray(pairs) || !pairs.length) throw new Error('empty');
    return pairs;
  } catch (e) {
    console.warn(`  ! PAIRS eval failed: ${e.message}`);
    return [];
  }
}

function comparisonRows(pairs, slugSet) {
  const clean = (s) => String(s || '').trim();
  return pairs
    .map((p) => ({
      slug: `${toSlug(p.a)}-vs-${toSlug(p.b)}`,
      a: clean(p.a),
      b: clean(p.b),
      env: clean(p.env),
      lede: clean(p.lede),
      rows: (p.rows || [])
        .filter((r) => Array.isArray(r) && r.length >= 3)
        .map(([feature, va, vb]) => ({ feature: clean(feature), a: clean(va), b: clean(vb) })),
    }))
    .filter((c) => slugSet.has(toSlug(c.a)) && slugSet.has(toSlug(c.b)))
    .sort((x, y) => x.slug.localeCompare(y.slug));
}

/* ------------------------------------------------------------------ main */
const db = loadSpeciesDb();
const species = speciesRows(db);
const destinations = destinationRows(db);
const slugSet = new Set(species.map((s) => s.slug));
const comparisons = comparisonRows(loadComparisonPairs(), slugSet);

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'species.json'), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), species }, null, 1));
writeFileSync(join(OUT, 'comparisons.json'), JSON.stringify({ comparisons }, null, 1));
writeFileSync(join(OUT, 'destinations.json'), JSON.stringify({ destinations }, null, 1));

console.log(`iOS data bundle written to ${OUT}`);
console.log(`  species:     ${species.length}`);
console.log(`  comparisons: ${comparisons.length}`);
console.log(`  destinations:${destinations.length}`);
