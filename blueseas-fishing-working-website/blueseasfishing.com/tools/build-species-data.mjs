#!/usr/bin/env node
/* build-species-data.mjs — one shared JSON dataset for the trip planner,
 * the members-area species intel and the weekly bite brief (site + PHP cron).
 *
 * Inputs : species-db*.js packs (merged in browser load order) + the live
 *          destination pages (names) + .destinations-map.json (region -> url)
 * Outputs: assets/data/species.json      [{name,sci,env,habitat,baits,season,regions}]
 *          assets/data/destinations.json [{name,url}]
 *
 * Run: node tools/build-species-data.mjs   (idempotent; skips unchanged files)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'assets', 'data');
mkdirSync(OUT_DIR, { recursive: true });

/* ---- 1. merge the species packs exactly like the browser does ---- */
const sandbox = { window: {} };
sandbox.window.SPECIES_DB = [];
for (const file of ['species-db.js', 'species-db.enriched.js', 'species-db.enriched.world.js',
                    'species-db.expanded.js', 'species-db.expanded.worldwide.js', 'species-db.regions.js']) {
  const p = join(ROOT, file);
  if (!existsSync(p)) continue;
  try { vm.runInContext(readFileSync(p, 'utf8'), vm.createContext(sandbox)); }
  catch (e) { console.warn('  pack failed (kept going):', file, e.message); }
}
const merged = Array.isArray(sandbox.window.SPECIES_DB) ? sandbox.window.SPECIES_DB : [];
if (!merged.length) { console.error('FATAL: no species rows merged'); process.exit(1); }

const clean = (s, max) => {
  const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  return max && t.length > max ? t.slice(0, max - 1) + '…' : t;
};

const species = merged
  .map(s => ({
    name: clean(s.name, 80),
    sci: clean(s.sci || s.scientific || '', 120),
    env: clean(s.env || '', 40),                       // Freshwater / Saltwater / Brackish
    habitat: clean(s.habitat, 400),
    baits: clean(s.baits || s.lures || '', 300),
    season: clean(s.season, 200),
    regions: (Array.isArray(s.regions) ? s.regions : String(s.regions || '').split(','))
      .map(r => clean(r, 90)).filter(Boolean).slice(0, 6),
  }))
  .filter(s => s.name && (s.regions.length || s.season || s.habitat));

/* dedupe by lowercase name, keep the longest record */
const byName = new Map();
for (const s of species) {
  const k = s.name.toLowerCase();
  const prev = byName.get(k);
  if (!prev || (s.regions.length + s.habitat.length) > (prev.regions.length + prev.habitat.length)) byName.set(k, s);
}
const rows = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
writeIfChanged(join(OUT_DIR, 'species.json'), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), count: rows.length, species: rows }));
console.log(`species.json: ${rows.length} species`);

/* ---- 2. destinations: one entry per live destination page ---- */
const destDir = join(ROOT, 'destinations');
const destinations = readdirSync(destDir)
  .filter(f => f.endsWith('.html') && f !== 'index.html')
  .map(f => {
    const html = readFileSync(join(destDir, f), 'utf8');
    const m = html.match(/<h1>(?:Fishing in )?(.+?)(?: — .*)?<\/h1>/) || html.match(/<title>(.+?)(?: \|[^|]*)?<\/title>/);
    const name = clean(m ? m[1] : f.replace(/\.html$/, '').replace(/-/g, ' '), 90)
      .replace(/\s*Fishing Guide$/i, '').replace(/^How to fish\s*/i, '');
    return { name: name || f.replace(/\.html$/, '').replace(/-/g, ' '), url: '/destinations/' + f };
  });
writeIfChanged(join(OUT_DIR, 'destinations.json'), JSON.stringify({ count: destinations.length, destinations }));
console.log(`destinations.json: ${destinations.length} destinations`);

function writeIfChanged(path, content) {
  if (existsSync(path) && readFileSync(path, 'utf8') === content) { console.log('  unchanged:', path.split(/[\\/]/).slice(-2).join('/')); return; }
  writeFileSync(path, content);
  console.log('  wrote:', path.split(/[\\/]/).slice(-2).join('/'));
}
