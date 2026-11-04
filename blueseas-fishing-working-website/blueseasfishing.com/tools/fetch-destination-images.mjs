#!/usr/bin/env node
/**
 * fetch-destination-images.mjs
 *
 * Bakes one representative landscape photo per destination page so the
 * destination hub and pages carry a hero image + og:image (same approach as
 * the species images: local file preferred, Wikimedia URL fallback).
 *
 * Lookup per destination: Wikipedia pageimage for the destination name
 * (parentheticals stripped first, then raw). Landscape photos are chosen by
 * downloading and checking aspect ratio where possible.
 *
 * Run:  node tools/fetch-destination-images.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'images', 'destinations');
const UA = 'BlueSeasFishingSiteBot/1.0 (https://www.blueseasfishing.com; contact: admin@blueseasfishing.com)';
const BATCH = 20;

const toSlug = (str) => String(str || '').toLowerCase()
  .replace(/[()[\]]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const stripParens = (s) => String(s || '').replace(/\s*[([].*?[)\]]\s*/g, ' ').replace(/\s+/g, ' ').trim();

// Names come from the destinations map (only qualifying destinations get pages).
const map = JSON.parse(readFileSync(join(ROOT, '.destinations-map.json'), 'utf8'));
const names = Object.keys(map);

/** Destinations whose names don't resolve to a Wikipedia article get a
 *  curated representative article title instead. */
const CURATED = {
  'IWP reefs': 'Indo-Pacific',
  'Hawaii': 'Nā Pali Coast State Park',
  'Iceland': 'Seljalandsfoss',
  'California banks (CA)': 'Channel Islands (California)',
  'Southern US rivers': 'Mississippi River',
  'California offshore': 'Santa Catalina Island (California)',
  'Florida coasts': 'Florida Keys',
  'California/Baja': 'Cabo San Lucas',
  'UK coasts (where legal)': 'Cornwall',
  'Mississippi system rivers': 'Mississippi River',
  'Great Lakes bays': 'Green Bay (Lake Michigan)',
  'Southern reservoirs': 'Lake Texoma',
  'European stillwaters': 'Grafham Water',
  'Chesapeake (MD/VA)': 'Chesapeake Bay',
  'Australian estuaries': 'Port Jackson',
  'UK south coast': 'Jurassic Coast',
  'Mediterranean estuaries': 'Ebro Delta',
  'UK canals': 'Kennet and Avon Canal',
  'Amazon (BR)': 'Amazon rainforest',
  'Norwegian coast': 'Lofoten',
  'Fraser (BC)': 'Fraser River',
  'BC coast': 'Vancouver Island',
  'Santee Cooper (SC)': 'Lake Marion (South Carolina)',
  'Susquehanna (PA)': 'Susquehanna River',
  'Trinity River (TX)': 'Trinity River (Texas)',
  'Louisiana marshes': 'Jean Lafitte National Historical Park and Preserve',
  'Carolina sounds': 'Outer Banks',
  'Florida beaches': 'Daytona Beach, Florida',
  'Flaming Gorge (UT/WY)': 'Flaming Gorge Reservoir',
  'Great Lakes tributaries': 'Salmon River (New York)',
  'Chesapeake tributaries': 'Choptank River',
  'Gulf coast surf & bays': 'Galveston Bay',
  'Florida Keys / Bahamas': 'Florida Keys',
  'Chesapeake (MD)': 'Chesapeake Bay',
  'Chesapeake (VA/MD)': 'Chesapeake Bay',
  'Atlantic coast (US/CA)': 'Cape Cod',
  'Atlantic coast runs (US)': 'Housatonic River',
  'Northeast US offshore (MA/NJ)': 'Stellwagen Bank National Marine Sanctuary',
  'European stocked ponds': 'Carp fishing',
  'Mississippi system': 'Mississippi River',
  'US farm ponds and reservoirs': 'Reservoir',
  'Introduced EU waters': 'European perch',
  'IWP reefs (AUS/PAC)': 'Indo-Pacific',
  'IWP reefs (AUS/PAC/IND)': 'Indo-Pacific',
  'IWP': 'Indo-Pacific',
  'IWP offshore': 'Indo-Pacific',
  'Atlantic beaches (EU)': 'Beach',
  'Open ocean / drift lines': 'Ocean',
  'Pacific Northwest beaches (WA/OR)': 'Ocean Shores, Washington',
  'Offshore wrecks & reefs': 'Shipwreck',
  'Tropical/subtropical coasts': 'Tropics',
  'TH stocked lakes': 'Bangkok',
  'Middle Grounds (GOM)': 'Florida Middle Grounds',
  'FL lakes (introduced)': 'Lake Okeechobee',
  'Florida canals (introduced)': 'Lake Okeechobee',
  'Pacific Northwest deepwater': 'Oregon Coast',
  'Bays and nearshore structure': 'Estuary',
  'North Atlantic coasts': 'Faroe Islands',
  'South Atlantic reefs (FL–NC)': "Gray's Reef National Marine Sanctuary",
};

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
const haveFiles = new Set(readdirSync(OUT_DIR).map((f) => f.toLowerCase()));
const localFor = (slug) => {
  for (const ext of ['webp', 'jpg', 'jpeg', 'png']) {
    if (haveFiles.has(`${slug}.${ext}`)) return `/images/destinations/${slug}.${ext}`;
  }
  return '';
};

/* ------------------------------------------------------------- wikipedia */
async function apiBatch(titles) {
  const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages'
    + '&piprop=thumbnail%7Coriginal&pithumbsize=1600&redirects=1&titles='
    + encodeURIComponent(titles.join('|'));
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function extract(json, requested) {
  const out = new Map();
  const q = json?.query;
  if (!q?.pages) return out;
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
  const found = new Map();
  const titles = [...candidates.keys()];
  for (let i = 0; i < titles.length; i += BATCH) {
    const batch = titles.slice(i, i + BATCH);
    try {
      const m = extract(await apiBatch(batch), batch);
      for (const [t, url] of m) for (const name of candidates.get(t)) if (!found.has(name)) found.set(name, url);
    } catch (e) { console.warn(`  ! batch failed: ${e.message}`); }
    process.stdout.write(`  queried ${Math.min(i + BATCH, titles.length)}/${titles.length}\r`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  process.stdout.write('\n');
  return found;
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 3000) throw new Error(`suspiciously small (${buf.length}b)`);
  writeFileSync(dest, buf);
  return buf.length;
}

/* ------------------------------------------------------------------ main */
const need = names.filter((n) => !localFor(toSlug(n)));
console.log(`${names.length} destinations; need photos for ${need.length}`);

const candidates = new Map();
const addCand = (t, n) => { if (t) { if (!candidates.has(t)) candidates.set(t, []); candidates.get(t).push(n); } };
for (const n of need) addCand(CURATED[n] || stripParens(n), n);
const byClean = await lookupAll(candidates);

const still = need.filter((n) => !byClean.has(n) && !CURATED[n]);
const candidates2 = new Map();
for (const n of still) addCand(String(n).trim(), n);
const byRaw = still.length ? await lookupAll(candidates2) : new Map();

const result = {};
let ok = 0;
for (const n of names) {
  const slug = toSlug(n);
  const local = localFor(slug);
  if (local) { result[n] = local; ok++; continue; }
  const hit = byClean.get(n) || byRaw.get(n) || '';
  if (hit) {
    let ext = '.jpg';
    try { ext = (hit.match(/\.(jpe?g|png|webp)(?:$|\?)/i) || ['', '.jpg'])[1].toLowerCase(); if (ext === 'jpeg') ext = 'jpg'; if (!ext.startsWith('.')) ext = '.' + ext; } catch {}
    const dest = join(OUT_DIR, `${slug}${ext}`);
    try {
      const size = await download(hit, dest);
      console.log(`  ✓ ${n} ← ${slug}${ext} (${Math.round(size / 1024)}KB)`);
      haveFiles.add(`${slug}${ext}`.toLowerCase());
      result[n] = `/images/destinations/${slug}${ext}`;
      ok++;
    } catch (e) { console.warn(`  ✗ ${n}: ${e.message}`); }
  }
}

writeFileSync(join(ROOT, '.destination-images.json'), JSON.stringify(result, null, 1));
console.log(`\nDone: ${ok}/${names.length} destinations have images -> .destination-images.json`);
if (ok < names.length) {
  console.log('misses: ' + names.filter((n) => !result[n]).join(', '));
}
