#!/usr/bin/env node
/**
 * fix-affiliate-links.mjs
 *
 * Repairs dead Awin deep links in NewGiftsAndGadgets `src/lib/data/products.json`.
 *
 * Policy (each decision below was verified with curl/browser on 2026-10-31):
 *   - Product page 404 but merchant store alive  -> repoint to a live page on the
 *     SAME merchant, keeping awinmid/awinaffid. The commission still works.
 *   - Merchant store itself dead/unreliable      -> remove that vendor entry.
 *
 * Every replacement URL returned HTTP 200 when this was written. A replacement is
 * never invented: it is in LIVE_REPLACEMENTS below, mapped by the exact dead URL.
 *
 * Run:  node tools/fix-affiliate-links.mjs --dry-run
 *       node tools/fix-affiliate-links.mjs
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';

const FILE = 'C:/Projects/NewGiftsAndGadgets-Website/newgiftsandgadgets.com/src/lib/data/products.json';
const DRY = process.argv.includes('--dry-run');

/** dead destination -> verified live replacement on the same merchant */
const LIVE_REPLACEMENTS = {
  'https://www.dealgenius.com/products/handheld-electric-milk-frother-drink-mixer': 'https://www.dealgenius.com/collections/all',
  'https://dealgenius.com/products/handheld-electric-milk-frother-drink-mixer': 'https://www.dealgenius.com/collections/all',
  'https://www.sunaofe.com/collections/accessories': 'https://www.sunaofe.com/collections/all',
  'https://www.sunaofe.com/collections/ergonomic-chairs': 'https://www.sunaofe.com/collections/all',
  'https://www.sunaofe.com/products/lunar-dual-motor-standing-desk': 'https://www.sunaofe.com/collections/all',
  'https://www.kingbullbike.com/products/hunter-2-0s-all-terrain-fat-tire-electric-bike': 'https://www.kingbullbike.com/',
  'https://www.nexbie.com/customOilPainting': 'https://www.nexbie.com/',
  'https://www.dimaeyewear.com/collections/blue-light-glasses': 'https://www.dimaeyewear.com/',
  'https://www.everblog.com/products/homecal': 'https://www.everblog.com/',
  'https://brkox.com/products/led-light-kit-for-star-wars-millennium-falcon': 'https://brkox.com/',
  'https://fntcase.com/collections/magsafe': 'https://fntcase.com/collections/all',
  'https://fntcase.com/collections/ma': 'https://fntcase.com/collections/all',
  'https://moosehill.com/collections/travel-outdoor': 'https://moosehill.com/',
  'https://www.loveisarose.com/products/24k-gold-rose': 'https://www.loveisarose.com/',
  'https://www.giftlab.com/collections/custom-night-light': 'https://www.giftlab.com/collections/all',
  'https://www.giftlab.com/collections/home-decor': 'https://www.giftlab.com/collections/all',
  'https://www.inspireuplift.com/Dog-Grooming-Vacuum-Pet-Grooming-Kit-With-2-3L-Dust-Cup-Vacuum-Suction-Pet-Hair-Cleaner-With-5-Grooming-Tools-For-Dogs-Cats-And-Other-Animals/iu/7813297': 'https://www.inspireuplift.com/',
};

if (!existsSync(FILE)) {
  console.error(`not found: ${FILE}`);
  process.exit(1);
}

const products = JSON.parse(readFileSync(FILE, 'utf8'));
const changes = [];
const removals = [];

/** Rebuild an Awin cread URL around a new destination, preserving every other param. */
function repoint(awinUrl, newDest) {
  const hashSplit = awinUrl.split('#');
  const base = hashSplit[0];
  const idx = base.indexOf('?');
  if (idx === -1) return awinUrl;
  const params = new URLSearchParams(base.slice(idx + 1));
  params.set('ued', newDest);
  return `${base.slice(0, idx)}?${params.toString()}${hashSplit[1] ? `#${hashSplit[1]}` : ''}`;
}

function destOf(awinUrl) {
  const i = awinUrl.indexOf('?');
  if (i === -1) return '';
  const ued = new URLSearchParams(awinUrl.slice(i + 1)).get('ued') || '';
  return ued.replace(/\\+$/, '').trim(); // strip the stray trailing backslash some entries carry
}

for (const p of products) {
  if (!Array.isArray(p.vendors)) continue;
  for (let i = 0; i < p.vendors.length; i++) {
    const v = p.vendors[i];
    if (!v.url || !v.url.includes('awin1.com')) continue;
    const dest = destOf(v.url);
    if (!dest) continue;
    const fix = LIVE_REPLACEMENTS[dest];
    if (!fix) continue;
    const before = v.url;
    v.url = repoint(v.url, fix);
    changes.push({ slug: p.slug, vendor: v.name, from: dest, to: fix, before, after: v.url });
  }
}

// Drop any vendor row whose Awin link still points at a host confirmed dead.
for (const p of products) {
  if (!Array.isArray(p.vendors)) continue;
  const before = p.vendors.length;
  p.vendors = p.vendors.filter((v) => !/awinmid=(129285|126831)\b/.test(v.url || ''));
  if (p.vendors.length !== before) removals.push({ slug: p.slug, removed: before - p.vendors.length });
}

console.log(`links repointed: ${changes.length}`);
for (const c of changes) console.log(`  ${c.slug.padEnd(34)} ${c.vendor.slice(0, 26).padEnd(27)} ${c.from.replace(/^https?:\/\//, '').slice(0, 60)}`);

if (removals.length) {
  console.log(`\nvendors removed (dead merchant): ${removals.length}`);
  for (const r of removals) console.log(`  ${r.slug}  -${r.removed}`);
}

if (DRY) {
  console.log('\n--dry-run: nothing written');
} else if (changes.length || removals.length) {
  copyFileSync(FILE, `${FILE}.bak-affiliate-${new Date().toISOString().slice(0, 10)}`);
  writeFileSync(FILE, JSON.stringify(products, null, 2) + '\n');
  console.log(`\nwrote ${FILE} (backup alongside)`);
} else {
  console.log('\nnothing to change');
}
