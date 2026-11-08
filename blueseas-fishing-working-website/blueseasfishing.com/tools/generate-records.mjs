#!/usr/bin/env node
/**
 * generate-records.mjs
 *
 * Builds the "World Record vs Average Size" charts — Phase 2's third linkable
 * data asset. One page per species family (5 pages + hub). Data comes from a
 * hand-curated file (tools/record-data.json) of widely reported all-tackle
 * world records; the IGFA is cited as the authoritative source on every page.
 *
 * Species rows join to species-db.js by exact (lowercased) name so every chart
 * row links to the live species profile and uses the real species photo. A
 * build fails loudly if a name doesn't match the DB — no silent data loss.
 *
 * Outputs:
 *   fish-size-charts/index.html           hub over the 5 family pages
 *   fish-size-charts/<family-slug>.html   one chart page per family
 *
 * Run: node tools/generate-records.mjs  (then sitemap + verify-seo)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { fitTitle } from './lib/title-fit.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.blueseasfishing.com';
const OUT_DIR = join(ROOT, 'fish-size-charts');

/* ------------------------------------------------------------ load DB -- */
const sandbox = {
  window: {},
  document: { dispatchEvent() {}, addEventListener() {}, readyState: 'complete' },
  setTimeout() {}, setInterval() {}, clearInterval() {}, clearTimeout() {},
  console: { log() {}, warn() {} },
};
vm.createContext(sandbox);
for (const f of ['species-db.js', 'species-db.enriched.js', 'species-db.enriched.world.js',
  'species-db.expanded.js', 'species-db.expanded.worldwide.js']) {
  try { vm.runInContext(readFileSync(join(ROOT, f), 'utf8'), sandbox); } catch (e) { /* keep going */ }
}
const seen = new Map();
for (const s of sandbox.window.SPECIES_DB || []) {
  const k = String(s.name || '').toLowerCase();
  if (k && !seen.has(k)) seen.set(k, s);
}

const DATA = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'record-data.json'), 'utf8'));

/* Join record rows to the DB. Fail loudly on any name mismatch: a typo in the
 * curated file must stop the build, not silently drop a row. */
const unmatched = [];
for (const fam of DATA.families) {
  for (const row of fam.rows) {
    row.db = seen.get(String(row.species).toLowerCase()) || null;
    if (!row.db) unmatched.push(`${fam.name}: ${row.species}`);
  }
}
if (unmatched.length) {
  console.error('record-data.json species not found in species-db.js:\n  ' + unmatched.join('\n  '));
  process.exit(1);
}

/* ------------------------------------------------------------ helpers -- */
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function toSlug(str) {
  return String(str || '').toLowerCase()
    .replace(/[()[\]]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const shortName = (n) => String(n || '').replace(/\s*\([^)]*\)\s*/g, '').trim();

function imgFor(name) {
  for (const ext of ['webp', 'jpg', 'png']) {
    if (existsSync(join(ROOT, 'images', 'species', `${toSlug(name)}.${ext}`))) return `/images/species/${toSlug(name)}.${ext}`;
  }
  return '';
}

const fmtLb = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** Record-to-average ratio; colour escalates with the gap. */
function ratioStats(row) {
  const ratio = row.avgLb > 0 ? row.recordLb / row.avgLb : 0;
  const style = ratio >= 200 ? 'color:#a4262c;font-weight:700' : ratio >= 100 ? 'color:#9a6a00;font-weight:600' : 'color:#2e6b34';
  return { ratio, style, label: `${ratio.toFixed(0)}×` };
}

/** Bar: full width = record; blue fill = average share; red notch = trophy. */
function ratioBar(row) {
  const avgPct = Math.max(1.5, Math.round((row.avgLb / row.recordLb) * 1000) / 10);
  const trophyPct = Math.min(99, Math.max(avgPct + 2, Math.round((row.trophyLb / row.recordLb) * 1000) / 10));
  return `<div class="r-bar" aria-hidden="true"><span class="r-fill" style="width:${avgPct}%"></span><span class="r-trophy" style="left:${trophyPct}%"></span></div>`;
}

const METHOD = `<div class="r-method"><strong>How to read these charts:</strong> each bar's full width is the all-tackle world record. The <span class="r-key r-key-avg">blue fill</span> is a typical catch; the <span class="r-key r-key-trophy">red notch</span> is a trophy benchmark — a fish most anglers remember for years. The record figures are widely reported all-tackle marks; the <a href="https://igfa.org/world-records/" rel="nofollow">IGFA record database</a> is the authoritative source — verify current records there before planning a record attempt. Average and trophy figures are working benchmarks from charter and tournament norms, not official statistics.</div>`;

const NAV = `<nav class="guide-nav"><div class="guide-nav-inner"><a class="guide-brand" href="/">Blue Seas Fishing</a><a href="/fish-id.html">Identify a Fish</a><a href="/whats-biting/">Seasonal Calendar</a><a href="/states/">Fishing by State</a><a href="/gallery.html">Species Database</a><a href="/destinations/">Destinations</a><a href="/forum.html">Forum</a><a href="/subscribe.html">Subscribe</a></div></nav>`;

/* ---------------------------------------------------------- row builder -- */
function recordRow(row) {
  const s = row.db;
  const img = imgFor(s.name);
  const r = ratioStats(row);
  return `<tr>
      <td class="r-species">${img ? `<img src="${img}" alt="" width="44" height="30" loading="lazy"> ` : ''}<a href="/species/${toSlug(s.name)}.html">${esc(shortName(s.name))}</a><span class="r-sci">${esc(s.sci || '')}</span></td>
      <td class="r-rec"><strong>${esc(fmtLb(row.recordLb))} lb</strong><span class="r-where">${esc(row.recordWhere)}</span></td>
      <td class="r-avg">${esc(fmtLb(row.avgLb))} lb</td>
      <td class="r-troph">${esc(fmtLb(row.trophyLb))} lb</td>
      <td class="r-ratio" style="${r.style}">${r.label}</td>
      <td class="r-barcell">${ratioBar(row)}</td>
    </tr>`;
}

/* ------------------------------------------------------- family pages -- */
function familyPage(fam) {
  const slug = fam.slug;
  const url = `${SITE}/fish-size-charts/${slug}.html`;
  const title = fitTitle([
    `${fam.name}: World Record vs Average Size | Blue Seas Fishing`,
    `${fam.name}: Record vs Average Size | Blue Seas`,
    `${fam.name}: Size Chart — Record vs Average`,
  ]);
  // Kept under 160 rendered chars: Google cuts a snippet at about that point,
  // and tools/verify-seo.mjs now fails the build on a longer description.
  const desc = `World-record vs typical-catch sizes for ${fam.rows.length} ${fam.name.toLowerCase()} species, with trophy benchmarks and links to full profiles.`;
  const speciesList = fam.rows.map((r) => shortName(r.db.name)).join(', ');

  const ld = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Record vs Average Size', item: `${SITE}/fish-size-charts/` },
        { '@type': 'ListItem', position: 3, name: fam.name, item: url },
      ] },
      { '@type': 'Article', headline: title, description: desc, mainEntityOfPage: url,
        about: { '@type': 'Thing', name: `${fam.name} size records` },
        publisher: { '@type': 'Organization', name: 'Blue Seas Fishing', url: `${SITE}/` } },
    ],
  };

  const rows = fam.rows.map(recordRow).join('\n');
  const ratios = fam.rows.map(ratioStats);
  // Sibling charts (Phase 1 interlinking): every family page links the other
  // four, so no chart leans on the hub alone for inbound links.
  const siblings = DATA.families.filter((f) => f.slug !== slug)
    .map((f) => `<a href="/fish-size-charts/${f.slug}.html">${esc(f.name)}</a>`).join(' · ');
  const badges = [
    ['≥200×', ratios.filter((r) => r.ratio >= 200).length, '#a4262c'],
    ['100–199×', ratios.filter((r) => r.ratio >= 100 && r.ratio < 200).length, '#9a6a00'],
    ['<100×', ratios.filter((r) => r.ratio < 100).length, '#2e6b34'],
  ].filter(([, n]) => n > 0)
    .map(([label, n, color]) => `<span class="r-badge" style="border-color:${color};color:${color}">${n} species ${label}</span>`)
    .join(' ');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Blue Seas Fishing">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <link rel="stylesheet" href="/assets/css/species-guides.css">
  <style>
    .r-table{width:100%;border-collapse:collapse;margin:14px 0 8px}
    .r-table th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#5a7184;border-bottom:2px solid #0b3d5c;padding:6px 8px;text-align:left}
    .r-table td{border-bottom:1px solid #dde6ec;padding:8px;vertical-align:middle}
    .r-species img{border-radius:4px;vertical-align:middle;margin-right:8px}
    .r-species a{font-weight:600}
    .r-sci{display:block;font-style:italic;color:#5a7184;font-size:12px;margin-top:2px}
    .r-where{display:block;color:#5a7184;font-size:12px;margin-top:2px;max-width:220px}
    .r-bar{position:relative;height:14px;background:#e8eff4;border-radius:7px;min-width:120px}
    .r-fill{position:absolute;top:0;bottom:0;left:0;background:#7fa8c9;border-radius:7px}
    .r-trophy{position:absolute;top:-2px;bottom:-2px;width:3px;background:#a4262c;border-radius:2px}
    .r-badges{margin:4px 0 14px}
    .r-badge{display:inline-block;border:1px solid;border-radius:999px;padding:2px 10px;font-size:12px;margin-right:8px}
    .r-method{border:1px solid #d8e2ea;border-radius:10px;background:#f7fafc;padding:12px 14px;margin:18px 0;font-size:14px;color:#41586b}
    .r-key{font-weight:700}
    .r-key-avg{color:#4d7fa3}.r-key-trophy{color:#a4262c}
    @media(max-width:720px){.r-barcell{min-width:130px}}
  </style>
  <script src="/analytics-consent.js?v=5" defer></script>
</head>
<body>
${NAV}
<main class="guide-wrap">
  <div class="breadcrumbs"><a href="/">Home</a> / <a href="/fish-size-charts/">Record vs average size</a> / ${esc(fam.name)}</div>
  <h1>${esc(fam.name)}: world record vs average size</h1>
  <p class="lede">${esc(fam.blurb)}</p>
  <div class="r-badges">${badges}</div>
  <table class="r-table">
    <thead><tr><th>Species</th><th>All-tackle world record</th><th>Typical catch</th><th>Trophy size</th><th>Record ÷ average</th><th>Scale</th></tr></thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  ${METHOD}
  <div class="action"><h2>Think you beat the average?</h2><p>Photograph your catch and the AI fish identifier will help you confirm the species — then check it against the records above.</p><a class="button" href="/fish-id.html">Identify my fish</a></div>
  <footer class="guide-footer"><a href="/fish-size-charts/">All size charts</a> · ${siblings} · <a href="/states/">Fishing by state</a> · <a href="/species/">Species A–Z</a> · <a href="/">Blue Seas Fishing</a></footer>
</main>
<script src="/assets/js/nav-back.js?v=3" defer></script>
</body>
</html>
`;
}

/* -------------------------------------------------------------- hub -- */
function buildHub() {
  const title = 'World Record vs Average Fish Size — Charts by Family';
  const desc = 'World-record vs typical-catch size charts for bass, trout, pike, inshore and offshore species, with trophy benchmarks and full profiles.';
  const url = `${SITE}/fish-size-charts/`;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Record vs Average Size', item: url }] },
    { '@type': 'CollectionPage', name: 'World Record vs Average Fish Size', url, description: desc,
      publisher: { '@type': 'Organization', name: 'Blue Seas Fishing', url: `${SITE}/` } },
  ] };
  const cards = DATA.families.map((fam) => {
    const top = fam.rows.slice(0, 4).map((r) => `<li><a href="/species/${toSlug(r.db.name)}.html">${esc(shortName(r.db.name))}</a> — ${esc(fmtLb(r.recordLb))} lb record</li>`).join('');
    const head = fam.rows[0];
    return `<section class="r-fam"><h2><a href="/fish-size-charts/${fam.slug}.html">${esc(fam.name)}</a></h2><p>${esc(fam.blurb)}</p><ul>${top}</ul><p class="r-more"><a href="/fish-size-charts/${fam.slug}.html">Full ${esc(fam.name.toLowerCase())} chart →</a></p></section>`;
  }).join('\n  ');
  const total = DATA.families.reduce((a, f) => a + f.rows.length, 0);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Blue Seas Fishing">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <link rel="stylesheet" href="/assets/css/species-guides.css">
  <style>
    .r-fam{border:1px solid #d8e2ea;border-radius:12px;padding:14px 18px;margin:14px 0;background:#fbfdfe}
    .r-fam h2{margin:0 0 6px;font-size:19px}
    .r-fam h2 a{text-decoration:none;color:#134e6f}
    .r-fam ul{margin:8px 0;padding-left:18px;font-size:14px}
    .r-fam li{margin:3px 0}
    .r-more{margin:8px 0 0;font-size:14px}
    .r-method{border:1px solid #d8e2ea;border-radius:10px;background:#f7fafc;padding:12px 14px;margin:18px 0;font-size:14px;color:#41586b}
  </style>
  <script src="/analytics-consent.js?v=5" defer></script>
</head>
<body>
${NAV}
<main class="guide-wrap">
  <div class="breadcrumbs"><a href="/">Home</a> / Record vs average size</div>
  <h1>World record vs average fish size</h1>
  <p class="lede">${total} species across ${DATA.families.length} families, each charted from the all-tackle world record down to the fish you actually catch. Some records are a lifetime away; others are closer than you think.</p>
  ${cards}
  <div class="r-method"><strong>Where the numbers come from:</strong> record weights are widely reported all-tackle marks — the <a href="https://igfa.org/world-records/" rel="nofollow">IGFA</a> is the authoritative source and the final word. "Typical catch" and "trophy size" are working benchmarks from charter, tournament and fishery-survey norms, rounded honestly. Verify records before planning an attempt.</div>
  <div class="action"><h2>Caught something outsized?</h2><p>Upload a photo for an AI-assisted species identification, then see how your fish stacks up against the record.</p><a class="button" href="/fish-id.html">Identify my fish</a></div>
  <footer class="guide-footer"><a href="/whats-biting/">Monthly calendar</a> · <a href="/states/">Fishing by state</a> · <a href="/species/">Species A–Z</a> · <a href="/">Blue Seas Fishing</a></footer>
</main>
<script src="/assets/js/nav-back.js?v=3" defer></script>
</body>
</html>
`;
}

/* ---------------------------------------------------------------- main -- */
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });
for (const fam of DATA.families) {
  writeFileSync(join(OUT_DIR, `${fam.slug}.html`), familyPage(fam));
}
writeFileSync(join(OUT_DIR, 'index.html'), buildHub());
const total = DATA.families.reduce((a, f) => a + f.rows.length, 0);
console.log(`Done: ${DATA.families.length} family charts + hub -> fish-size-charts/ (${total} species rows, all joined to live profiles)`);
