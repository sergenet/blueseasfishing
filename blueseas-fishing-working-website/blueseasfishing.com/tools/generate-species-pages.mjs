#!/usr/bin/env node
/**
 * generate-species-pages.mjs
 *
 * Turns the JS species database (species-db.js + enrichment packs) into static,
 * crawlable HTML so search engines can index the "400+ species database" that
 * is currently only reachable through client-side JavaScript.
 *
 * Outputs:
 *   species/index.html     A–Z index of every species
 *   species/<slug>.html    one lightweight page per species
 *
 * Also patches gallery.html (idempotently):
 *   - static A–Z links block in the header
 *   - species card <a> elements point at /species/<slug>.html (JS still opens
 *     the modal on click, but crawlers now get real hrefs)
 *   - reads ?q= into the search box so the homepage SearchAction target works
 *
 * Run:  node tools/generate-species-pages.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { fitTitle } from './lib/title-fit.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.blueseasfishing.com';

/** Curated region corrections (replace semantics) — kept in sync with generate-regions.mjs. */
const CORRECTIONS = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'region-corrections.json'), 'utf8'));

/** Region string -> destination page URL (from tools/generate-destinations.mjs). */
const DEST_MAP = existsSync(join(ROOT, '.destinations-map.json'))
  ? JSON.parse(readFileSync(join(ROOT, '.destinations-map.json'), 'utf8'))
  : {};

/** Species -> state cross-links (Phase 1 interlinking, added 2026-10-17).
 *  generate-states.mjs writes .state-species.json (state slug -> species slugs,
 *  its single source of truth for state/species matching). Invert it here so
 *  every species page links back to the state calendars that list it — the
 *  reverse edge of the state page's own species tables. Before this, state
 *  pages pointed at species pages but nothing linked state-ward, so the state
 *  hub only ever received links from the hub itself. */
const STATE_SPECIES = existsSync(join(ROOT, '.state-species.json'))
  ? JSON.parse(readFileSync(join(ROOT, '.state-species.json'), 'utf8'))
  : {};
const STATE_NAMES = new Map(
  (existsSync(join(ROOT, 'assets', 'data', 'states-list.json'))
    ? JSON.parse(readFileSync(join(ROOT, 'assets', 'data', 'states-list.json'), 'utf8'))
    : []).map((s) => [s.slug, s.name]),
);
const statesForSpecies = new Map();
for (const [stateSlug, slugs] of Object.entries(STATE_SPECIES)) {
  for (const s of slugs) {
    if (!statesForSpecies.has(s)) statesForSpecies.set(s, []);
    statesForSpecies.get(s).push(stateSlug);
  }
}
for (const list of statesForSpecies.values()) list.sort();

/* ---------------------------------------------------------------- helpers */
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function toSlug(str) {
  return String(str || '').toLowerCase()
    .replace(/[()[\]]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function asList(v) {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return String(v ?? '').split(/,|;|\/|\u2022|·/).map((x) => x.trim()).filter(Boolean);
}

/** Fill-or-add merge: existing non-empty values win. Match on lowercase name. */
function mergeInto(db, items) {
  const byName = new Map(db.map((s) => [String(s.name || '').toLowerCase(), s]));
  let added = 0, filled = 0;
  for (const item of items) {
    if (!item || !item.name) continue;
    const key = String(item.name).toLowerCase();
    const existing = byName.get(key);
    if (existing) {
      for (const [field, val] of Object.entries(item)) {
        if (val != null && val !== '' && (existing[field] == null || existing[field] === '')) {
          existing[field] = val;
          filled++;
        }
      }
    } else {
      db.push(item);
      byName.set(key, item);
      added++;
    }
  }
  return { added, filled };
}

/* -------------------------------------------------- load + merge the DBs */
function loadSpeciesDb() {
  const sandbox = {
    window: {},
    document: { dispatchEvent() {}, addEventListener() {}, readyState: 'complete' },
    setTimeout() {}, setInterval() {}, clearInterval() {}, clearTimeout() {},
    console,
  };
  vm.createContext(sandbox);

  // Union of every row seen at any stage, keyed by lowercase name.
  // Fill-or-add: first non-empty value for a field wins.
  const db = [];
  const snapshot = (label) => {
    const sources = [
      ...(Array.isArray(sandbox.window.SPECIES_DB) ? sandbox.window.SPECIES_DB : []),
      ...(Array.isArray(sandbox.window.SPECIES_DB_ENRICH) ? sandbox.window.SPECIES_DB_ENRICH : []),
      ...(Array.isArray(sandbox.window.SPECIES_DB_CATALOG_ROWS) ? sandbox.window.SPECIES_DB_CATALOG_ROWS : []),
    ];
    const { added } = mergeInto(db, sources);
    console.log(`  ${label}: db now ${db.length} (+${added} new)`);
  };

  // Browser load order: base, world enrichment, expanded catalogue, regions,
  // images (regions/images packs fill-or-add and are order-safe).
  for (const file of ['species-db.js', 'species-db.enriched.js', 'species-db.enriched.world.js', 'species-db.expanded.js', 'species-db.expanded.worldwide.js', 'species-db.regions.js', 'species-db.images.js']) {
    try {
      vm.runInContext(readFileSync(join(ROOT, file), 'utf8'), sandbox);
    } catch (e) {
      console.warn(`  ! ${file}: ${e.message}`);
    }
    snapshot(file);
  }
  // Curated corrections replace wrong/generic regions from upstream packs.
  let corrected = 0;
  for (const [name, regs] of Object.entries(CORRECTIONS)) {
    const row = db.find((s) => String(s.name || '').toLowerCase() === name.toLowerCase());
    if (row) { row.regions = regs.slice(); corrected++; }
  }
  if (corrected) console.log(`  corrections applied: ${corrected} rows`);
  return db;
}

/* --------------------------------------------------------- detailed guides */
const GUIDE_LINKS = [
  ['rainbow-trout-identification.html', 'Rainbow Trout Identification', ['rainbow trout', 'steelhead']],
  ['chinook-salmon-identification.html', 'Chinook Salmon Identification', ['chinook', 'king salmon']],
  ['california-halibut-identification.html', 'California Halibut Identification', ['california halibut']],
  ['salmon-vs-trout-identification.html', 'Salmon vs. Trout', ['salmon', 'trout']],
  ['bluegill-vs-green-sunfish-identification.html', 'Bluegill vs. Green Sunfish', ['bluegill', 'green sunfish']],
  ['walleye-vs-sauger-identification.html', 'Walleye vs. Sauger', ['walleye', 'sauger']],
  ['striped-bass-vs-white-bass-identification.html', 'Striped Bass vs. White Bass', ['striped bass', 'white bass', 'white bass']],
  // Auto-generated comparison pages (tools/generate-comparisons.mjs) — terms
  // match a species when the name appears as a whole word in the species name.
  ['largemouth-bass-vs-smallmouth-bass-identification.html', 'Largemouth vs. Smallmouth Bass', ['largemouth', 'smallmouth']],
  ['largemouth-bass-vs-spotted-bass-identification.html', 'Largemouth vs. Spotted Bass', ['largemouth', 'spotted bass']],
  ['blue-catfish-vs-channel-catfish-identification.html', 'Blue vs. Channel Catfish', ['blue catfish', 'channel catfish']],
  ['channel-catfish-vs-flathead-catfish-identification.html', 'Channel vs. Flathead Catfish', ['channel catfish', 'flathead catfish']],
  ['black-crappie-vs-white-crappie-identification.html', 'Black vs. White Crappie', ['crappie']],
  ['bluegill-vs-redear-sunfish-identification.html', 'Bluegill vs. Redear Sunfish', ['bluegill', 'redear']],
  ['red-drum-vs-black-drum-identification.html', 'Red Drum vs. Black Drum', ['red drum', 'black drum', 'redfish']],
  ['spotted-seatrout-vs-weakfish-identification.html', 'Spotted Seatrout vs. Weakfish', ['spotted seatrout', 'weakfish']],
  ['southern-flounder-vs-summer-flounder-identification.html', 'Southern vs. Summer Flounder', ['southern flounder', 'summer flounder']],
  ['california-halibut-vs-pacific-halibut-identification.html', 'California vs. Pacific Halibut', ['halibut']],
  ['chinook-salmon-vs-coho-salmon-identification.html', 'Chinook vs. Coho Salmon', ['chinook', 'coho']],
  ['rainbow-trout-vs-cutthroat-trout-identification.html', 'Rainbow vs. Cutthroat Trout', ['rainbow trout', 'cutthroat']],
  ['brook-trout-vs-brown-trout-identification.html', 'Brook vs. Brown Trout', ['brook trout', 'brown trout']],
  ['lake-trout-vs-bull-trout-identification.html', 'Lake Trout vs. Bull Trout', ['lake trout', 'bull trout']],
  ['northern-pike-vs-muskellunge-identification.html', 'Northern Pike vs. Muskellunge', ['northern pike', 'muskellunge']],
  ['yellow-perch-vs-white-perch-identification.html', 'Yellow Perch vs. White Perch', ['yellow perch', 'white perch']],
  ['king-mackerel-vs-spanish-mackerel-identification.html', 'King vs. Spanish Mackerel', ['king mackerel', 'spanish mackerel']],
  ['yellowfin-tuna-vs-bluefin-tuna-identification.html', 'Yellowfin vs. Bluefin Tuna', ['yellowfin', 'bluefin']],
  ['blue-marlin-vs-striped-marlin-identification.html', 'Blue vs. Striped Marlin', ['blue marlin', 'striped marlin']],
  ['sailfish-vs-blue-marlin-identification.html', 'Sailfish vs. Blue Marlin', ['sailfish', 'blue marlin']],
];

function relatedGuides(name) {
  const n = String(name || '').toLowerCase();
  const out = [];
  for (const [href, label, terms] of GUIDE_LINKS) {
    for (const t of terms) {
      if (new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(n)) {
        out.push([href, label]);
        break;
      }
    }
  }
  return out.slice(0, 3);
}

/* ------------------------------------------------------- page templates */
function metaDescription(sp) {
  const parts = [];
  // Several habitat strings already end in a full stop, which used to produce
  // "pools.." once joined — strip it before joining.
  if (sp.habitat) parts.push(String(sp.habitat).replace(/[\s.;,]+$/, ''));
  const baits = asList(sp.baits).slice(0, 3).join(', ');
  if (baits) parts.push(`Baits: ${baits}`);
  let d = `${sp.name} (${sp.sci || ''}) — ${sp.env || ''} species profile: ${parts.join('. ')}.`.replace(/\s+/g, ' ');
  // Cut on a word boundary: the old slice(0,155)+'...' produced snippets like
  // "Species-depe.." on roughly a third of the 549 species pages.
  if (d.length > 158) {
    let cut = d.lastIndexOf(' ', 155);
    if (cut < 60) cut = 155;
    d = d.slice(0, cut).replace(/[\s.,;:—-]+$/, '');
  }
  return d;
}

/* ------------------------------------------------- freshness rotation -- */
/* Each run "refreshes" a deterministic slice of species pages with a season
 * snapshot paragraph. Honest content, stable selection: a given month always
 * rotates to the same 30 pages; next month the window slides. The updated set
 * is logged to .freshness-log.json. */
const FRESH_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const FRESH_ABBR = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
const FRESH_SPANS = { spring: [2, 4], summer: [5, 7], fall: [8, 10], autumn: [8, 10], winter: [11, 1] };

function seasonMonths(season) {
  const s = String(season || '').toLowerCase();
  if (!s || /varies|check |check\b|run-dependent|depends|region|weather|regulation/i.test(s)) return null;
  const out = new Set();
  const addSpan = ([a, b]) => {
    if (a <= b) for (let i = a; i <= b; i++) out.add(i);
    else { for (let i = a; i < 12; i++) out.add(i); for (let i = 0; i <= b; i++) out.add(i); }
  };
  if (/year-?round|all year/i.test(s)) {
    const peak = s.match(/(spring|summer|fall|autumn|winter)\s*(?:\u2013|\u2014|-|to|through)\s*(?:early\s*|late\s*)?(spring|summer|fall|autumn|winter)/);
    if (peak && /peak/i.test(s)) { addSpan([FRESH_SPANS[peak[1]][0], FRESH_SPANS[peak[2]][1]]); return out; }
    for (let i = 0; i < 12; i++) out.add(i);
    return out;
  }
  const range = s.match(/(spring|summer|fall|autumn|winter)\s*(?:\u2013|\u2014|-|to|through)\s*(?:early\s*|late\s*)?(spring|summer|fall|autumn|winter)/);
  if (range) { addSpan([FRESH_SPANS[range[1]][0], FRESH_SPANS[range[2]][1]]); return out; }
  let matched = false;
  for (const [word, span] of Object.entries(FRESH_SPANS)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(s)) { addSpan(span); matched = true; }
  }
  if (matched) return out;
  const tokens = [...s.matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)[a-z]*\b/gi)]
    .map((m) => FRESH_ABBR[m[1].toLowerCase()]);
  if (tokens.length >= 2) {
    const [a, b] = [tokens[0], tokens[tokens.length - 1]];
    if (a <= b) for (let i = a; i <= b; i++) out.add(i);
    else { for (let i = a; i < 12; i++) out.add(i); for (let i = 0; i <= b; i++) out.add(i); }
    return out;
  }
  if (tokens.length === 1) out.add(tokens[0]);
  return out.size ? out : null;
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic per-month pick: seed = year*12+month, stable Fisher–Yates. */
function buildFreshPlan(species, slugOf) {
  let y = new Date().getFullYear(), m = new Date().getMonth();
  if (process.env.BSF_FRESH_MONTH) { const p = process.env.BSF_FRESH_MONTH.split('-'); y = +p[0]; m = +p[1] - 1; }
  const n = Math.min(process.env.BSF_FRESH_N ? +process.env.BSF_FRESH_N : 30, species.length);
  const rand = mulberry32((y * 12 + m) * 2654435761);
  const idx = species.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  const picked = new Map();
  for (const i of idx) {
    if (picked.size >= n) break;
    const sp = species[i];
    if (!seasonMonths(sp.season)) continue; // no parseable window -> no snapshot
    const slug = slugOf(sp);
    if (!slug || picked.has(slug)) continue;
    picked.set(slug, sp);
  }
  return { year: y, month: m, picked };
}

/** Core 3-month window of a species' season, anchored at its rarest month. */
function peakSpan(sp, monthCounts) {
  const months = seasonMonths(sp.season);
  if (!months || !months.size) return null;
  const arr = [...months].sort((a, b) => a - b);
  if (arr.length >= 3) {
    let best = arr[0], bestC = Infinity;
    for (const m of arr) if (monthCounts[m] < bestC) { bestC = monthCounts[m]; best = m; }
    const w = [best, (best + 1) % 12, (best + 2) % 12];
    const sorted = [...w].sort((a, b) => a - b);
    if (sorted[2] - sorted[0] === 2) return `${FRESH_MONTHS[sorted[0]]}–${FRESH_MONTHS[sorted[2]]}`;
    return `${FRESH_MONTHS[w[0]]}–${FRESH_MONTHS[w[2]]}`; // wrapped: December–February
  }
  if (arr.length === 2) return `${FRESH_MONTHS[arr[0]]} and ${FRESH_MONTHS[arr[1]]}`;
  return FRESH_MONTHS[arr[0]];
}

function speciesPage(sp, slug, fresh = null) {
  const name = esc(sp.name);
  const sci = esc(sp.sci || '');
  const env = esc(sp.env || '');
  const url = `${SITE}/species/${slug}.html`;
  const desc = metaDescription(sp);
  const title = fitTitle([
    `${sp.name} Identification & Fishing Guide | Blue Seas Fishing`,
    `${sp.name} Identification & Fishing Guide | Blue Seas`,
    `${sp.name} Identification & Fishing Guide`,
    `${sp.name} Fishing Profile`,
  ]);

  const regions = asList(sp.regions || sp.hotspots);
  const stateLinks = statesForSpecies.get(slug) || [];
  const baits = asList(sp.baits);
  const aliases = asList(sp.alias || sp.aka || sp.aliases);
  const guides = relatedGuides(sp.name);
  const related = relatedMap.get(slug) || [];
  const depth = sp.depth ? String(sp.depth) : '';
  const img = String(sp.img || '').trim();
  const imgAbs = img.startsWith('http') ? img : img ? SITE + img : '';
  const commonsSearch = `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(sp.sci || sp.name)}`;

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Species Database', item: `${SITE}/gallery.html` },
          { '@type': 'ListItem', position: 3, name: sp.name, item: url },
        ],
      },
      {
        '@type': 'Article',
        headline: `How to identify a ${sp.name}`,
        description: desc,
        mainEntityOfPage: url,
        about: { '@type': 'Thing', name: sp.name, alternateName: sp.sci || undefined },
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
  ${imgAbs ? `<meta property="og:image" content="${esc(imgAbs)}">\n  <meta property="og:image:alt" content="${name}">` : ''}
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <link rel="stylesheet" href="/assets/css/species-guides.css">
  <style>
    .sp-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:18px 0}
    .sp-facts div{border:1px solid #d8e2ea;border-radius:10px;padding:10px 12px;background:#f7fafc;font-size:15px}
    .sp-facts strong{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#5a7184;margin-bottom:2px}
    .sp-hero{margin:18px 0}.sp-hero img{width:100%;max-width:720px;height:auto;border-radius:12px;border:1px solid #d8e2ea;display:block;margin:0 auto}
    .sp-hero figcaption{text-align:center;font-size:12px;color:#5a7184;margin-top:4px}
  </style>
  <script src="/analytics-consent.js?v=4" defer></script>
</head>
<body>
<nav class="guide-nav"><div class="guide-nav-inner"><a class="guide-brand" href="/">Blue Seas Fishing</a><a href="/fish-id.html">Identify a Fish</a><a href="/gallery.html">Species Database</a><a href="/species/">Species A–Z</a><a href="/destinations/">Destinations</a><a href="/blog.html">Fishing Guides</a><a href="/forum.html">Forum</a><a href="/subscribe.html">Subscribe</a><a href="/premium.html" class="guide-cta">Go Premium</a></div></nav>
<main class="guide-wrap">
  <div class="breadcrumbs"><a href="/">Home</a> / <a href="/gallery.html">Species</a> / ${name}</div>
  <p class="scientific">${sci}</p>
  <h1>How to identify a ${name}</h1>
  <p class="lede">${esc(sp.habitat ? `${sp.name} are found in ${sp.habitat.toLowerCase()}` : `${sp.name} (${sp.sci || 'scientific name below'}) profile with habitat, bait, and season information`)}. Use these features as a starting point and compare with a full identification guide before relying on any identification.</p>
  ${img ? `<figure class="sp-hero"><img src="${esc(img)}" alt="${name} (${sci})" width="1200" height="800" loading="lazy"><figcaption>Photo: <a href="${commonsSearch}" rel="nofollow">Wikimedia Commons</a> contributors (CC BY-SA)</figcaption></figure>` : ''}
  <div class="sp-facts">
    <div><strong>Environment</strong>${env || '—'}</div>
    <div><strong>Season</strong>${esc(sp.season || '—')}</div>
    ${depth ? `<div><strong>Depth</strong>${esc(depth)}</div>` : ''}
    ${aliases.length ? `<div><strong>Also known as</strong>${esc(aliases.join(', '))}</div>` : ''}
  </div>
  ${fresh ? `<div class="fresh-note" style="border:1px solid #cfe3d8;border-left:4px solid #2e6b34;border-radius:8px;background:#f4faf6;padding:10px 14px;margin:14px 0;font-size:15px"><strong>Season snapshot — ${esc(fresh.window)}</strong> ${esc(fresh.text)}</div>` : ''}
  <h2>Habitat and range</h2>
  <p>${esc(sp.habitat || 'Habitat information for this species is being expanded.')}</p>
  ${regions.length ? `<h2>Where to catch ${name}</h2><ul>${regions.map((r) => {
    const href = DEST_MAP[String(r).trim()];
    return href
      ? `<li><a href="${esc(href)}">${esc(r)}</a> — all species we list for this fishery</li>`
      : `<li>${esc(r)}</li>`;
  }).join('')}</ul>` : ''}
  ${stateLinks.length ? `<h2>${esc(name)} by state</h2>
  <p>State season calendars that list ${esc(name)} — each shows the months it is in season and the official licence source:</p>
  <ul class="sp-states">${stateLinks.slice(0, 12).map((s) => `<li><a href="/states/${s}.html">${esc(STATE_NAMES.get(s) || s)}</a> — seasons, best months and licence info</li>`).join('')}</ul>${stateLinks.length > 12 ? `<p class="muted" style="font-size:13px">Plus ${stateLinks.length - 12} more — <a href="/states/">all 50 state calendars</a>.</p>` : ''}` : ''}
  <h2>Baits and lures</h2>
  ${baits.length ? `<p>${baits.map((b) => `<strong>${esc(b)}</strong>`).join(' · ')}</p>` : '<p>Bait information for this species is being expanded. Start with gear matched to the environment above.</p>'}
  <div class="prem-teaser" style="margin:18px 0;padding:16px;border:1px solid #bfdbfe;border-radius:12px;background:#eff6ff;display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between">
    <div><strong><a href="/trip-planner.html?dest=&amp;species=${encodeURIComponent(esc(name))}">${esc(name)} trip plan</a></strong><div class="muted" style="font-size:14px">Premium members get a printable plan for this species — best waters by season, bait matches, and hotspot maps — plus unlimited AI identifications.</div></div>
    <a class="button" href="/premium.html">Go Premium</a>
  </div>
  ${guides.length ? `<h2>Detailed identification guides</h2><ul>${guides.map(([href, label]) => `<li><a href="/${href}">${esc(label)}</a></li>`).join('')}</ul>` : ''}
  ${related.length ? `<h2>Related species</h2><p>Often caught in the same waters or confused with ${esc(name)}:</p><ul>${related.map((r) => `<li><a href="/species/${toSlug(r.name)}.html">${esc(r.name)} — identification &amp; profile</a>${r.env ? ` <span style="color:#5a7184">(${esc(r.env)})</span>` : ''}</li>`).join('')}</ul>` : ''}
  <div class="news-cta" style="margin:18px 0;padding:16px;border:1px solid #c7e2d2;border-radius:12px;background:#f2faf5;display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between">
    <div><strong>Monthly bite brief</strong><div class="muted" style="font-size:14px">What's biting in your state, seasonal targets and new guides — one email a month. Unsubscribe anytime.</div></div>
    <a class="button" href="/#newsletter">Get fishing updates</a>
  </div>
  <div class="warning"><strong>Do not rely on a photo alone for legal or food-safety decisions.</strong> Location, season, life stage and local regulations matter. Confirm any identification that affects possession limits or consumption with the responsible wildlife agency.</div>
  <div class="action"><h2>Identify your photo</h2><p>Upload a clear side-view photo for an AI-assisted suggestion, then compare the result against the profile above.</p><a class="button" href="/fish-id.html">Identify my fish</a><a class="button secondary" href="/gallery.html">Browse all species</a></div>
  <footer class="guide-footer"><a href="/species/">Species A–Z index</a> · <a href="/gallery.html">Species Database</a> · <a href="/states/">Fishing by state</a> · <a href="/fish-size-charts/">Record vs average size</a> · <a href="/">Blue Seas Fishing</a></footer>
</main>
<script src="/assets/js/nav-back.js?v=3" defer></script>
</body>
</html>
`;
}

function speciesIndex(groups, total) {
  const letters = [...groups.keys()].sort();
  const nav = letters.map((l) => `<a href="#letter-${l}">${l}</a>`).join(' ');
  const sections = letters.map((l) => {
    const list = groups
      .get(l)
      .map((sp) => `<li><a href="/species/${toSlug(sp.name)}.html">${esc(sp.name)}</a>${sp.env ? ` <span class="env">(${esc(sp.env)})</span>` : ''}</li>`)
      .join('\n      ');
    return `<section class="letter-block" id="letter-${l}">\n    <h2>${l}</h2>\n    <ul>\n      ${list}\n    </ul>\n  </section>`;
  }).join('\n');

  const desc = `Browse ${total} freshwater and saltwater fish species A–Z. Habitat, bait, and season information for each species, plus AI-assisted photo identification.`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Fish Species A–Z (Species Database) | Blue Seas Fishing</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${SITE}/species/">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Blue Seas Fishing">
  <meta property="og:title" content="Fish Species A–Z (Species Database) | Blue Seas Fishing">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${SITE}/species/">
  <meta name="twitter:card" content="summary">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Fish Species A–Z","url":"${SITE}/species/","description":${JSON.stringify(desc)},"publisher":{"@type":"Organization","name":"Blue Seas Fishing","url":"${SITE}/"}}</script>
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
  <script src="/analytics-consent.js?v=4" defer></script>
</head>
<body>
<nav class="guide-nav"><div class="guide-nav-inner"><a class="guide-brand" href="/">Blue Seas Fishing</a><a href="/fish-id.html">Identify a Fish</a><a href="/gallery.html">Species Database</a><a href="/species/">Species A–Z</a><a href="/destinations/">Destinations</a><a href="/blog.html">Fishing Guides</a><a href="/forum.html">Forum</a><a href="/subscribe.html">Subscribe</a><a href="/premium.html" class="guide-cta">Go Premium</a></div></nav>
<main class="wrap">
  <div class="breadcrumbs"><a href="/">Home</a> / <a href="/gallery.html">Species</a> / A–Z index</div>
  <h1>Fish Species A–Z</h1>
  <p>${total} freshwater, saltwater, and migratory species with habitat, bait, and season context. Entries provide a starting point for comparison — not a legal identification.</p>
  <nav class="aznav" aria-label="Species letters">${nav}</nav>
  ${sections}
  <h2>Detailed identification guides</h2>
  <ul>
    <li><a href="/rainbow-trout-identification.html">Rainbow Trout Identification</a></li>
    <li><a href="/chinook-salmon-identification.html">Chinook Salmon Identification</a></li>
    <li><a href="/california-halibut-identification.html">California Halibut Identification</a></li>
    <li><a href="/salmon-vs-trout-identification.html">Salmon vs. Trout</a></li>
    <li><a href="/bluegill-vs-green-sunfish-identification.html">Bluegill vs. Green Sunfish</a></li>
    <li><a href="/walleye-vs-sauger-identification.html">Walleye vs. Sauger</a></li>
    <li><a href="/striped-bass-vs-white-bass-identification.html">Striped Bass vs. White Bass</a></li>
  </ul>
  <footer>Blue Seas Fishing provides identification guidance, not a regulatory determination. Check current local fishing rules.</footer>
</main>
<script src="/assets/js/nav-back.js?v=3" defer></script>
</body>
</html>
`;
}

/* -------------------------------------------------------- gallery patches */
function patchGallery(total) {
  const path = join(ROOT, 'gallery.html');
  let html = readFileSync(path, 'utf8');
  let changed = false;

  // 1) Static A–Z links block (crawl path to every species page)
  if (!html.includes('<!-- species-az-links -->')) {
    const anchor = /(<p><a href="\/rainbow-trout-identification\.html"[\s\S]*?<\/p>)/;
    const letters = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
      .map((l) => `<a href="/species/index.html#letter-${l}">${l}</a>`).join(' ');
    const block = `$1
    <!-- species-az-links -->
    <p><strong>Browse the full database (${total} species):</strong>
      <a href="/species/index.html">Species A–Z index</a>
      &nbsp;·&nbsp; ${letters}
    </p>`;
    if (anchor.test(html)) {
      html = html.replace(anchor, block);
      changed = true;
    } else {
      console.warn('  ! gallery.html: header anchor paragraph not found; A–Z block skipped');
    }
  }

  // 1b) Keep the species count and destinations link in the A–Z block current.
  const countRe = /Browse the full database \(\d+ species\)/;
  if (countRe.test(html)) {
    html = html.replace(countRe, `Browse the full database (${total} species)`);
    changed = true;
  }
  if (!html.includes('/destinations/index.html')) {
    html = html.replace(
      '<a href="/species/index.html">Species A–Z index</a>',
      '<a href="/species/index.html">Species A–Z index</a> &nbsp;·&nbsp; <a href="/destinations/index.html">Fishing destinations</a>',
    );
    changed = true;
  }

  // 1c) Keep the Go Premium link in the topbar (revenue funnel)
  if (!html.includes('href="/premium.html"')) {
    html = html.replace(
      '<a href="/" class="home">Home</a>',
      '<a href="/" class="home">Home</a>\n      <a href="/premium.html" style="font-weight:700;color:#1a365d">Go Premium</a>',
    );
    changed = true;
  }

  // 2) Species cards: real hrefs (modal still opens via click handler)
  if (html.includes('function cardHTML(s){ return `<a href="#" class="card"')) {
    html = html.replace(
      'function cardHTML(s){ return `<a href="#" class="card"',
      'function cardHTML(s){ return `<a href="/species/${toSlug(s.name)}.html" class="card"',
    );
    changed = true;
  }

  // 3) ?q= support for the homepage SearchAction target
  if (!html.includes('bsf-q-param')) {
    html = html.replace(
      /<\/body>/i,
      `<script id="bsf-q-param">
  (function () {
    var q = new URLSearchParams(location.search).get('q');
    if (!q) return;
    var el = document.getElementById('sp-search');
    if (el) { el.value = q; el.dispatchEvent(new Event('input', { bubbles: true })); }
  })();
  </script>
<script src="/assets/js/nav-back.js?v=3" defer></script>
</body>`,
    );
    changed = true;
  }

  if (changed) {
    writeFileSync(path, html);
    console.log('  gallery.html patched');
  } else {
    console.log('  gallery.html already up to date');
  }
}

/* ------------------------------------------------------------------- main */
const db = loadSpeciesDb();
const seen = new Map();
for (const s of db) {
  const key = String(s.name || '').toLowerCase().trim();
  if (key && !seen.has(key)) seen.set(key, s);
}
const species = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
console.log(`Loaded ${species.length} unique species (from ${db.length} rows)`);

/* Related-species cross-links (Phase 1 interlinking): group by the family
 * word (last meaningful word of the name — "bass", "trout", "drum"...),
 * fall back to same-environment siblings for loners. Deterministic (input
 * order is alphabetical), 6 links per page. */
function keyWord(name) {
  const words = String(name || '').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(Boolean);
  const meaningful = words.filter((w) => w !== 'fish' && w.length > 3);
  return meaningful[meaningful.length - 1] || '';
}
const relatedMap = new Map();
{
  const byKey = new Map();
  for (const sp of species) {
    const k = keyWord(sp.name);
    if (!k) continue;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(sp);
  }
  for (const sp of species) {
    const env = String(sp.env || '').toLowerCase();
    const pool = (byKey.get(keyWord(sp.name)) || []).filter((o) => o !== sp);
    // same-environment family members first, then the rest of the family
    pool.sort((a, b) => ((String(a.env || '').toLowerCase() === env ? 0 : 1) - (String(b.env || '').toLowerCase() === env ? 0 : 1)));
    let rel = [...pool];
    if (rel.length < 4 && env) {
      // Circular walk from this species' own position so every loner also
      // receives inbound cross-links (the old scan always started at index 0,
      // so late-alphabet species were never picked as "related" by anyone).
      const start = species.indexOf(sp);
      for (let n = 1; n <= species.length && rel.length < 6; n++) {
        const o = species[(start + n) % species.length];
        if (o !== sp && !rel.includes(o) && String(o.env || '').toLowerCase() === env) rel.push(o);
      }
    }
    rel = rel.slice(0, 6);
    if (rel.length) relatedMap.set(toSlug(sp.name), rel);
  }

  /* Repair pass (Phase 1b):
   * (a) loners with no same-env siblings (e.g. the only Brackish species)
   *     still get a related block — fall back to any circular neighbour;
   * (b) every species ends with >= 2 inbound cross-links from *other* pages'
   *     related lists, so no page leans solely on the A-Z index for links. */
  const relInbound = new Map(); // slug -> how many related lists include it
  for (const list of relatedMap.values()) {
    for (const r of list) relInbound.set(toSlug(r.name), (relInbound.get(toSlug(r.name)) || 0) + 1);
  }
  let filledOwn = 0, boosted = 0;
  for (const sp of species) {
    const slug = toSlug(sp.name);
    const start = species.indexOf(sp);
    // (a) empty related block -> fill from circular neighbours, any env
    if (!relatedMap.has(slug)) {
      const rel = [];
      for (let n = 1; n <= species.length && rel.length < 6; n++) {
        const o = species[(start + n) % species.length];
        if (o !== sp) rel.push(o);
      }
      relatedMap.set(slug, rel);
      for (const r of rel) relInbound.set(toSlug(r.name), (relInbound.get(toSlug(r.name)) || 0) + 1);
      filledOwn++;
    }
    // (b) fewer than 2 inbound related links -> insert into neighbours'
    // lists that still have room (deterministic circular order).
    if ((relInbound.get(slug) || 0) >= 2) continue;
    for (let n = 1; n < species.length && (relInbound.get(slug) || 0) < 2; n++) {
      const o = species[(start + n) % species.length];
      const oSlug = toSlug(o.name);
      const list = relatedMap.get(oSlug);
      if (!list || oSlug === slug) continue;
      if (list.some((r) => toSlug(r.name) === slug)) continue;
      if (list.length >= 6) continue;
      list.push(sp);
      relInbound.set(slug, (relInbound.get(slug) || 0) + 1);
      boosted++;
    }
  }
  console.log(`Related-species repair: ${filledOwn} blocks filled, ${boosted} inbound links added`);
}
console.log(`Related-species map: ${relatedMap.size} pages get cross-links`);

const outDir = join(ROOT, 'species');
rmSync(outDir, { recursive: true, force: true }); // regenerate cleanly; removes stale pages
mkdirSync(outDir, { recursive: true });

const slugsUsed = new Set();
let written = 0, skipped = 0;
const groups = new Map();
const freshPlan = buildFreshPlan(species, (sp) => toSlug(sp.name));
// Global month counts -> rarity-anchored "core window" per refreshed species.
const __freshMonthCounts = new Array(12).fill(0);
for (const sp of species) { const mo = seasonMonths(sp.season); if (mo) mo.forEach((m) => { __freshMonthCounts[m] += 1; }); }
const freshWindows = new Map(), freshTexts = new Map();
for (const [slug, sp] of freshPlan.picked) {
  const mo = seasonMonths(sp.season);
  const inM = mo && mo.has(freshPlan.month);
  const window = peakSpan(sp, __freshMonthCounts) || '';
  freshWindows.set(slug, window);
  const envPhrase = String(sp.env || '').toLowerCase() === 'freshwater' ? 'freshwater' : 'saltwater';
  freshTexts.set(slug, inM
    ? `${sp.name} sit inside their core ${envPhrase} window (${window}) right now — historically the stretch where effort pays off most. Window timing shifts with latitude and local regulation.`
    : `${sp.name}'s core ${envPhrase} window runs ${window} — outside it, fish shift depth and feed less, so match the slower pattern. Window timing shifts with latitude and local regulation.`);
}
console.log(`Freshness: ${freshPlan.picked.size} species pages get a season snapshot (${FRESH_MONTHS[freshPlan.month]} ${freshPlan.year})`);
for (const sp of species) {
  let slug = toSlug(sp.name);
  if (!slug) slug = 'species';
  let base = slug, i = 2;
  while (slugsUsed.has(slug)) slug = `${base}-${i++}`;
  slugsUsed.add(slug);

  const file = join(outDir, `${slug}.html`);
  const fresh = freshPlan.picked.get(slug)
    ? { window: freshWindows.get(slug), text: freshTexts.get(slug) }
    : null;
  const content = speciesPage(sp, slug, fresh);
  if (existsSync(file) && readFileSync(file, 'utf8') === content) skipped++;
  else { writeFileSync(file, content); written++; }
  const letter = sp.name[0].toUpperCase();
  if (!groups.has(letter)) groups.set(letter, []);
  groups.get(letter).push(sp);
}
console.log(`Species pages: ${written} written, ${skipped} unchanged`);
writeFileSync(join(ROOT, '.freshness-log.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  window: `${FRESH_MONTHS[freshPlan.month]} ${freshPlan.year}`,
  refreshed: [...freshPlan.picked.keys()].map((slug) => ({ slug, window: freshWindows.get(slug) })),
}, null, 1));

const indexPath = join(outDir, 'index.html');
const indexContent = speciesIndex(groups, species.length);
if (!existsSync(indexPath) || readFileSync(indexPath, 'utf8') !== indexContent) {
  writeFileSync(indexPath, indexContent);
  console.log('  species/index.html written');
}

patchGallery(species.length);
console.log('Done.');
