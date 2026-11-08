#!/usr/bin/env node
/**
 * generate-destinations.mjs
 *
 * Aggregates the Regions/Hotspots data across the species database into
 * destination pages: one page per location string listed by at least
 * MIN_SPECIES species. Turns entries like "Chesapeake (MD/VA)" into real
 * landing pages targeting location searches, interlinked with species pages.
 *
 * Outputs:
 *   destinations/index.html      A–Z index of destination pages
 *   destinations/<slug>.html     one page per qualifying destination
 *   .destinations-map.json       region name -> URL (consumed by
 *                                generate-species-pages.mjs to linkify the
 *                                "Where to catch" lists on species pages)
 *
 * Run BEFORE generate-species-pages.mjs, then generate-sitemap.mjs.
 *   node tools/generate-destinations.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { fitTitle } from './lib/title-fit.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.blueseasfishing.com';
const OUT_DIR = join(ROOT, 'destinations');
const MAP_OUT = join(ROOT, '.destinations-map.json');
const MIN_SPECIES = 3;

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const toSlug = (str) => String(str || '').toLowerCase()
  .replace(/[()[\]]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const stripParens = (s) => String(s || '').replace(/\s*[([].*?[)\]]\s*/g, ' ').replace(/\s+/g, ' ').trim();

/* --------------------------------------------------------- load the DB -- */
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
// Curated corrections replace upstream region data (same file as regions gen).
const CORRECTIONS = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'region-corrections.json'), 'utf8'));
const norm = (x) => String(x || '').toLowerCase().trim();
for (const s of sandbox.window.SPECIES_DB || []) {
  const c = CORRECTIONS[String(s.name || '').trim()];
  if (c) s.regions = c.slice();
}
// Then the generated regions pack (fill-or-add, replace honored).
try { vm.runInContext(readFileSync(join(ROOT, 'species-db.regions.js'), 'utf8'), sandbox); } catch (e) { /* keep going */ }

/** Unique intros + licence boxes (tools/destination-extras.json). */
const EXTRAS = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'destination-extras.json'), 'utf8'));
const INTROS = EXTRAS.intros || {};
const LICENCES = EXTRAS.licences || {};

/** Destination hero images (tools/fetch-destination-images.mjs output). */
const IMG_MAP_PATH = join(ROOT, '.destination-images.json');
const IMAGES = existsSync(IMG_MAP_PATH) ? JSON.parse(readFileSync(IMG_MAP_PATH, 'utf8')) : {};

const db = sandbox.window.SPECIES_DB || [];
const seen = new Map();
for (const s of db) { const k = norm(s.name); if (k && !seen.has(k)) seen.set(k, s); }
const species = [...seen.values()];

/** Season-string -> month-index Set (shared logic with generate-monthly.mjs). */
const MONTH_ABBR = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
const SEASON_SPANS = { spring: [2, 4], summer: [5, 7], fall: [8, 10], autumn: [8, 10], winter: [11, 1] };
function seasonMonths(season) {
  const s = String(season || '').toLowerCase();
  if (!s || /varies|check |check\b|run-dependent|depends|region|weather|regulation/i.test(s)) return null;
  const out = new Set();
  const addSpan = ([a, b]) => {
    if (a <= b) for (let i = a; i <= b; i++) out.add(i);
    else { for (let i = a; i < 12; i++) out.add(i); for (let i = 0; i <= b; i++) out.add(i); }
  };
  // "Year-round" (optionally with a peak window: "year-round ... spring–fall peaks")
  if (/year-?round|all year/i.test(s)) {
    const peak = s.match(/(spring|summer|fall|autumn|winter)\s*(?:\u2013|\u2014|-|to|through)\s*(?:early\s*|late\s*)?(spring|summer|fall|autumn|winter)/);
    if (peak && /peak/i.test(s)) { addSpan([SEASON_SPANS[peak[1]][0], SEASON_SPANS[peak[2]][1]]); return out; }
    for (let i = 0; i < 12; i++) out.add(i);
    return out;
  }
  // Season-word range: "Spring–Fall", "Late Spring–Early Fall" -> inclusive span
  const range = s.match(/(spring|summer|fall|autumn|winter)\s*(?:\u2013|\u2014|-|to|through)\s*(?:early\s*|late\s*)?(spring|summer|fall|autumn|winter)/);
  if (range) { addSpan([SEASON_SPANS[range[1]][0], SEASON_SPANS[range[2]][1]]); return out; }
  // Individual season words: "spring & fall peaks"
  let matched = false;
  for (const [word, span] of Object.entries(SEASON_SPANS)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(s)) { addSpan(span); matched = true; }
  }
  if (matched) return out;
  // Month tokens with optional range: "June–August", "Sep - Nov"
  const tokens = [...s.matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)[a-z]*\b/gi)]
    .map((m) => MONTH_ABBR[m[1].toLowerCase()]);
  if (tokens.length >= 2) {
    const [a, b] = [tokens[0], tokens[tokens.length - 1]];
    if (a <= b) for (let i = a; i <= b; i++) out.add(i);
    else { for (let i = a; i < 12; i++) out.add(i); for (let i = 0; i <= b; i++) out.add(i); }
    return out;
  }
  if (tokens.length === 1) out.add(tokens[0]);
  return out.size ? out : null;
}
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
/** Months where at least MIN_SPECIES of this destination's species are in season. */
function bestMonths(list) {
  const counts = new Array(12).fill(0);
  for (const x of list) {
    const row = species.find((s) => norm(s.name) === norm(x.name));
    const months = row ? seasonMonths(row.season) : null;
    if (months) months.forEach((m) => { counts[m] += 1; });
  }
  const max = Math.max(...counts);
  if (max < MIN_SPECIES) return []; // not enough seasonal signal — omit block
  const cutoff = Math.max(MIN_SPECIES, Math.ceil(max * 0.6));
  return counts.map((c, i) => ({ i, c })).filter((x) => x.c >= cutoff);
}

/* ------------------------------------------------------- aggregate ------ */
const byRegion = new Map(); // region string -> [{name, env}]
for (const sp of species) {
  const regs = Array.isArray(sp.regions) ? sp.regions : String(sp.regions || '').split(/[,;]|\u2022/).map((x) => x.trim()).filter(Boolean);
  for (const r of regs) {
    const k = String(r).trim();
    if (!k) continue;
    if (!byRegion.has(k)) byRegion.set(k, []);
    byRegion.get(k).push({ name: sp.name, env: String(sp.env || '') });
  }
}

/* ---- Merge near-synonym regions onto one canonical page ------------- */
// tools/region-merges.json maps near-synonym region strings ("Georges Bank",
// "Georges Bank (US)", "Georges Bank (MA)") onto one canonical name so each
// fishery gets a single, species-rich page instead of 2-4 near-duplicates
// splitting crawl budget. Source of truth for this map AND the .htaccess 301s.
const MERGES_PATH = join(dirname(fileURLToPath(import.meta.url)), 'region-merges.json');
const MERGES = existsSync(MERGES_PATH) ? JSON.parse(readFileSync(MERGES_PATH, 'utf8')) : {};
let mergedSpecies = 0;
for (const [from, to] of Object.entries(MERGES)) {
  if (!byRegion.has(from)) { console.warn(`  region-merges: source not in DB, skipped: ${from}`); continue; }
  if (!byRegion.has(to)) byRegion.set(to, []);
  const target = byRegion.get(to);
  const have = new Set(target.map((x) => norm(x.name)));
  for (const x of byRegion.get(from)) {
    if (!have.has(norm(x.name))) { target.push(x); have.add(norm(x.name)); mergedSpecies += 1; }
  }
  byRegion.delete(from);
}
if (Object.keys(MERGES).length) {
  console.log(`merges: ${Object.keys(MERGES).length} synonyms folded into ${new Set(Object.values(MERGES)).size} canonical regions (+${mergedSpecies} species rows)`);
}

const qualifying = [...byRegion.entries()]
  .filter(([, list]) => list.length >= MIN_SPECIES)
  .sort((a, b) => b[1].length - a[1].length);

console.log(`regions: ${byRegion.size} distinct, ${qualifying.length} qualify (>= ${MIN_SPECIES} species)`);

/* ------------------------------------------------------- page templates - */
function destinationPage(name, list) {
  const slug = toSlug(name);
  const url = `${SITE}/destinations/${slug}.html`;
  const fw = list.filter((x) => /freshwater/i.test(x.env)).sort((a, b) => a.name.localeCompare(b.name));
  const sw = list.filter((x) => !/freshwater/i.test(x.env)).sort((a, b) => a.name.localeCompare(b.name));
  const sample = list.slice(0, 5).map((x) => x.name).join(', ');
  // Richest to barest — see tools/lib/title-fit.mjs for why the ladder exists.
  const title = fitTitle([
    `${name} Fishing: Species, Hotspots & Seasons | Blue Seas Fishing`,
    `${name} Fishing: Species & Hotspots | Blue Seas Fishing`,
    `${name} Fishing: Species & Hotspots | Blue Seas`,
    `${name} Fishing: Species & Hotspots`,
    `${name} Fishing Guide`,
  ]);
  const desc = `${list.length} fish species profiles list ${name} as a fishery — including ${sample}. See which species to target and link through to full identification profiles.`
    .replace(/\s+/g, ' ').slice(0, 158);
  const h1 = `${name} Fishing Guide`;
  const img = String(IMAGES[name] || '').trim();
  const imgAbs = img.startsWith('http') ? img : img ? SITE + img : '';
  const intro = INTROS[name];
  const lic = LICENCES[name];
  const commonsSearch = `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(stripParens(name))}`;

  const licenceBox = !lic ? '' : `
  <div class="licence-box">
    <h2>Licences &amp; regulations — ${esc(lic.region)}</h2>
    <ul>${lic.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
    ${lic.sources && lic.sources.length ? `<p class="licence-sources">Official sources: ${lic.sources.map((s) => `<a href="${esc(s)}" rel="nofollow">${esc(s.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>`).join(' · ')}</p>` : ''}
  </div>`;

  const listBlock = (label, arr) => !arr.length ? '' : `
  <h2>${label} species</h2>
  <ul class="dest-species">
    ${arr.map((x) => `<li><a href="/species/${toSlug(x.name)}.html">${esc(x.name)}</a></li>`).join('\n    ')}
  </ul>`;

  /** Calendar links computed from this destination's own species season windows. */
  const bestMonthsBlock = (arr) => {
    const months = bestMonths(arr);
    if (!months.length) return '';
    const links = months.map(({ i }) => `<a href="/whats-biting/${MONTH_NAMES[i].toLowerCase()}.html">${MONTH_NAMES[i]}</a>`).join(' · ');
    return `\n  <h2>Best months to fish ${esc(name)}</h2>\n  <p>${links}</p>\n  <p class="muted" style="font-size:13px">Months where the most of this fishery's species are in season, from our database. Full calendar: <a href="/whats-biting/">What's Biting</a>.</p>`;
  };

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Fishing Destinations', item: `${SITE}/destinations/` },
          { '@type': 'ListItem', position: 3, name, item: url },
        ],
      },
      {
        '@type': 'Article',
        headline: h1,
        description: desc,
        mainEntityOfPage: url,
        about: { '@type': 'Place', name },
        publisher: { '@type': 'Organization', name: 'Blue Seas Fishing', url: `${SITE}/` },
      },
    ],
  };

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
  ${imgAbs ? `<meta property="og:image" content="${esc(imgAbs)}">\n  <meta property="og:image:alt" content="${esc(name)}">` : ''}
  <meta name="twitter:card" content="${imgAbs ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  ${imgAbs ? `<meta name="twitter:image" content="${esc(imgAbs)}">` : ''}
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <link rel="stylesheet" href="/assets/css/species-guides.css">
  <style>
    .dest-cols{columns:2;column-gap:36px;padding-left:18px}
    @media(max-width:640px){.dest-cols{columns:1}}
    .dest-note{border:1px solid #d8e2ea;border-radius:10px;background:#f7fafc;padding:12px 14px;margin:16px 0;font-size:15px}
    .dest-hero{margin:18px 0}.dest-hero img{width:100%;max-width:860px;height:auto;border-radius:12px;border:1px solid #d8e2ea;display:block;margin:0 auto}
    .dest-hero figcaption{text-align:center;font-size:12px;color:#5a7184;margin-top:4px}
    .licence-box{border:1px solid #b8cfe0;border-left:4px solid #0b3d5c;border-radius:8px;background:#f2f7fb;padding:14px 16px;margin:22px 0}
    .licence-box h2{margin-top:0;font-size:17px}
    .licence-box ul{padding-left:18px;margin:8px 0}
    .licence-box li{margin:4px 0}
    .licence-sources{font-size:13px;color:#5a7184;margin-bottom:0}
  </style>
  <script src="/analytics-consent.js?v=5" defer></script>
</head>
<body>
<nav class="guide-nav"><div class="guide-nav-inner"><a class="guide-brand" href="/">Blue Seas Fishing</a><a href="/fish-id.html">Identify a Fish</a><a href="/gallery.html">Species Database</a><a href="/species/">Species A–Z</a><a href="/destinations/">Destinations</a><a href="/blog.html">Fishing Guides</a><a href="/forum.html">Forum</a><a href="/subscribe.html">Subscribe</a><a href="/premium.html" class="guide-cta">Go Premium</a></div></nav>
<main class="guide-wrap">
  <div class="breadcrumbs"><a href="/">Home</a> / <a href="/destinations/">Destinations</a> / ${esc(name)}</div>
  <h1>${esc(h1)}</h1>
  ${img ? `<figure class="dest-hero"><img src="${esc(img)}" alt="${esc(name)}" width="1600" height="900" loading="lazy"><figcaption>Photo: <a href="${commonsSearch}" rel="nofollow">Wikimedia Commons</a> contributors</figcaption></figure>` : ''}
  ${intro ? `<p class="lede">${esc(intro)}</p>` : ''}
  <p class="lede">${esc(`${list.length} species in our database list ${name} among their fisheries. Use the species list below to plan what to target, then open any profile for identification features, bait, and season.`)}</p>
  <div class="dest-note"><strong>How to use this page:</strong> pick a species, check its habitat and seasonal notes, and match your gear to the environment. Local regulations always apply — verify current rules with the responsible agency before fishing.</div>
  ${listBlock('Saltwater', sw)}
  ${listBlock('Freshwater', fw)}
  ${bestMonthsBlock(list)}
  ${licenceBox}
  ${gearBox(name, sw, fw)}
  <h2>Plan your trip</h2>
  <ul>
    <li><a href="/trip-planner.html?dest=${encodeURIComponent(esc(name))}">Get a custom ${esc(name)} trip plan (Premium)</a></li>
    <li><a href="/species/">Browse all species A–Z</a></li>
    <li><a href="/gallery.html">Species database with photos</a></li>
    <li><a href="/fish-id.html">Identify a fish from a photo</a></li>
    <li><a href="/tips-seasonal-guide.html">Seasonal fishing guide</a></li>
  </ul>
  <footer class="guide-footer"><a href="/destinations/">All destinations</a> · <a href="/states/">Fishing by state</a> · <a href="/species/">Species A–Z</a> · <a href="/">Blue Seas Fishing</a></footer>
</main>
<script src="/assets/js/nav-back.js?v=3" defer></script>
</body>
</html>
`;
}

/* ---- Affiliate links for gear boxes (build-time, from money-config.js) ---- */
let MONEY = null;
try {
  const fakeWindow = {};
  new Function('window', readFileSync(join(ROOT, 'money-config.js'), 'utf8'))(fakeWindow);
  MONEY = fakeWindow.BSF_MONEY_CONFIG || null;
} catch { MONEY = null; }

const GEAR_QUERIES = {
  freshwater: [['Spinning rod & reel combo', 'spinning rod reel combo'], ['Bass jig kit', 'bass jig kit'], ['Inline spinners', 'inline spinner fishing lures']],
  saltwater: [['Saltwater jig set', 'saltwater jig lures set'], ['Fluorocarbon leader', 'fluorocarbon leader saltwater'], ['Paddle tail lures', 'paddle tail swimbait saltwater']],
  general: [['Fishing pliers & grip', 'fishing pliers lip gripper'], ['Landing net', 'fishing landing net'], ['Tackle bag', 'fishing tackle bag storage']]
};

function gearLinks(variant) {
  if (!MONEY || !MONEY.awinLink) return [];
  const vendor = ((MONEY.AWIN && MONEY.AWIN.VENDORS) || []).find((v) => v.mid);
  if (!vendor) return [];
  return (GEAR_QUERIES[variant] || []).map(([label, q]) => ({
    label,
    href: MONEY.awinLink(vendor.id, vendor.base + (vendor.search || '') + encodeURIComponent(q))
  })).filter((l) => l.href);
}

function gearBox(name, sw, fw) {
  if (!sw.length && !fw.length) return '';
  const variant = (fw.length && (!sw.length || fw.length > sw.length)) ? 'freshwater'
    : (sw.length && (!fw.length || sw.length >= fw.length)) ? 'saltwater' : 'general';
  const boxes = {
    freshwater: { title: 'Freshwater starter kit', body: 'Inline spinners, soft-plastic kits, bass jigs and terminal tackle that covers most freshwater fisheries like ' + name + '.' },
    saltwater: { title: 'Saltwater starter kit', body: 'Metal jigs, paddle-tail combos, fluorocarbon leaders and saltwater-safe reels for inshore waters like ' + name + '.' },
    general: { title: 'Shore & boat essentials', body: 'Pliers, lip grips, landing nets, headlamps and tackle storage that work for nearly every fishery like ' + name + '.' }
  };
  const b = boxes[variant];
  const links = gearLinks(variant);
  const linksRow = links.length
    ? `<p style="margin:8px 0 0"><strong>Shop picks:</strong> ${links.map((l) => `<a href="${esc(l.href)}" target="_blank" rel="sponsored noopener">${esc(l.label)}</a>`).join(' · ')}</p>`
    : '';
  return `<aside class="dest-gearbox" style="margin:18px 0;padding:16px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc">
    <h2 style="margin:0 0 6px;font-size:18px">${b.title} for ${esc(name)}</h2>
    <p style="margin:0 0 8px">${esc(b.body)}</p>
    ${linksRow}
    <p class="muted" style="margin:8px 0 0;font-size:13px">Gear suggestions matched to the species on this page${links.length ? ' · partner links — commissions support this site' : ' · partner offers keep this site free for everyone'}.</p>
  </aside>`;
}

function destinationIndex(entries) {
  const groups = new Map();
  for (const [name, list, slug] of entries) {
    const letter = name[0].toUpperCase();
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push([name, list, slug]);
  }
  const letters = [...groups.keys()].sort();
  const nav = letters.map((l) => `<a href="#d-${l}">${l}</a>`).join(' ');
  const sections = letters.map((l) => {
    const items = groups.get(l)
      .map(([name, list, slug]) => `<li><a href="/destinations/${slug}.html">${esc(name)}</a> <span class="env">(${list.length} species)</span></li>`)
      .join('\n      ');
    return `<section class="letter-block" id="d-${l}">\n    <h2>${l}</h2>\n    <ul>\n      ${items}\n    </ul>\n  </section>`;
  }).join('\n');
  const total = entries.length;
  // <= 160 rendered chars (tools/verify-seo.mjs fails the build above that).
  const desc = `Browse ${total} fishing destinations A–Z. Each page lists the fish species our database ties to that fishery, with links to full profiles.`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Fishing Destinations A–Z | Blue Seas Fishing</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${SITE}/destinations/">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Blue Seas Fishing">
  <meta property="og:title" content="Fishing Destinations A–Z | Blue Seas Fishing">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${SITE}/destinations/">
  <meta name="twitter:card" content="summary">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Fishing Destinations A–Z","url":"${SITE}/destinations/","description":${JSON.stringify(desc)},"publisher":{"@type":"Organization","name":"Blue Seas Fishing","url":"${SITE}/"}}</script>
  <link rel="stylesheet" href="/assets/css/species-guides.css">
  <style>
    body{font-family:Lato,Arial,sans-serif;color:#1d3446;margin:0}
    .wrap{max-width:860px;margin:0 auto;padding:0 18px 60px}
    h1{font-family:Poppins,Arial,sans-serif;margin:24px 0 6px}
    .aznav{line-height:2;margin:14px 0}
    .aznav a{margin-right:8px;font-weight:700}
    .letter-block h2{border-bottom:2px solid #0b3d5c;padding-bottom:4px;margin-top:28px}
    .letter-block ul{columns:2;column-gap:36px;padding-left:18px}
    @media(max-width:640px){.letter-block ul{columns:1}}
    .env{color:#5a7184;font-size:13px}
    footer{margin-top:40px;padding-top:14px;border-top:1px solid #d8e2ea;color:#5a7184;font-size:14px}
  </style>
  <script src="/analytics-consent.js?v=5" defer></script>
</head>
<body>
<nav class="guide-nav"><div class="guide-nav-inner"><a class="guide-brand" href="/">Blue Seas Fishing</a><a href="/fish-id.html">Identify a Fish</a><a href="/gallery.html">Species Database</a><a href="/species/">Species A–Z</a><a href="/destinations/">Destinations</a><a href="/blog.html">Fishing Guides</a><a href="/forum.html">Forum</a><a href="/subscribe.html">Subscribe</a><a href="/premium.html" class="guide-cta">Go Premium</a></div></nav>
<main class="wrap">
  <div class="breadcrumbs"><a href="/">Home</a> / Destinations</div>
  <h1>Fishing Destinations A–Z</h1>
  <p>${total} destinations drawn from the fisheries named across our ${'species database'} — bays, rivers, reefs, and regions with the species that make them famous. Every destination links to full species profiles.</p>
  <nav class="aznav" aria-label="Destination letters">${nav}</nav>
  ${sections}
  <footer>Destination entries reflect the fisheries named in our species profiles — always check current local regulations before fishing.</footer>
</main>
<script src="/assets/js/nav-back.js?v=3" defer></script>
</body>
</html>
`;
}

/* ---------------------------------------------------------------- main -- */
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const usedSlugs = new Set();
const entries = [];
const urlMap = {};
for (const [name, list] of qualifying) {
  let slug = toSlug(name) || 'destination';
  let base = slug, i = 2;
  while (usedSlugs.has(slug)) slug = `${base}-${i++}`;
  usedSlugs.add(slug);
  entries.push([name, list, slug]);
  urlMap[name] = `/destinations/${slug}.html`;
}
// Retired synonym names keep a map entry pointing at the canonical page, so
// species pages' "Where to catch" links go straight to the surviving URL
// instead of relying on the .htaccess 301.
for (const [from, to] of Object.entries(MERGES)) {
  if (urlMap[to] && !urlMap[from]) urlMap[from] = urlMap[to];
}

for (const [name, list, slug] of entries) {
  writeFileSync(join(OUT_DIR, `${slug}.html`), destinationPage(name, list));
}
writeFileSync(join(OUT_DIR, 'index.html'), destinationIndex(entries));
writeFileSync(MAP_OUT, JSON.stringify(urlMap, null, 1));

console.log(`wrote ${entries.length} destination pages + index -> ${OUT_DIR}`);
console.log(`region map -> ${MAP_OUT}`);
console.log('top destinations:', entries.slice(0, 5).map(([n, l]) => `${n} (${l.length})`).join(', '));
