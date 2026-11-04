import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { join } from 'node:path';
const ROOT = 'C:/Projects/BlueSeasFishing-Website/blueseasfishing/blueseas-fishing-working-website/blueseasfishing.com';
const OUT = ROOT + '/.idxwork/regions.json';
const sandbox = { window:{}, document:{dispatchEvent(){},addEventListener(){},readyState:'complete'},
  setTimeout(){}, setInterval(){}, clearInterval(){}, clearTimeout(){}, console:{log(){},warn(){}} };
vm.createContext(sandbox);
for (const f of ['species-db.js','species-db.enriched.js','species-db.enriched.world.js',
  'species-db.expanded.js','species-db.expanded.worldwide.js']) {
  try { vm.runInContext(readFileSync(join(ROOT,f),'utf8'), sandbox); } catch(e){}
}
const CORRECTIONS = JSON.parse(readFileSync(join(ROOT,'tools','region-corrections.json'),'utf8'));
const norm = x => String(x||'').toLowerCase().trim();
for (const s of (sandbox.window.SPECIES_DB||[])) { const c = CORRECTIONS[String(s.name||'').trim()]; if (c) s.regions = c.slice(); }
try { vm.runInContext(readFileSync(join(ROOT,'species-db.regions.js'),'utf8'), sandbox); } catch(e){}
const seen = new Map();
for (const s of (sandbox.window.SPECIES_DB||[])) { const k = norm(s.name); if (k && !seen.has(k)) seen.set(k, s); }
const species = [...seen.values()];
const MIN = 3;
const byRegion = new Map();
for (const sp of species) {
  const regs = Array.isArray(sp.regions) ? sp.regions : String(sp.regions||'').split(/[,;\u2022]/).map(x=>x.trim()).filter(Boolean);
  for (const r of regs) {
    const k = String(r).trim(); if (!k) continue;
    if (!byRegion.has(k)) byRegion.set(k, new Set());
    byRegion.get(k).add(sp.name);
  }
}
const out = {};
for (const [k,v] of byRegion) if (v.size >= MIN) out[k] = [...v];
writeFileSync(OUT, JSON.stringify(out));
console.log('qualifying regions: ' + Object.keys(out).length);
