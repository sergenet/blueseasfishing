#!/usr/bin/env node
/**
 * generate-monthly.mjs
 *
 * Builds the 12 evergreen "What's Biting in <Month>" pages — URLs that spike
 * in search every year and recycle traffic into the species database and
 * destination guides.
 *
 * Method (transparent, not scraped): each species row in species-db.js carries
 * a `season` string. We map its months/quarters onto a calendar month; species
 * whose season window includes the month become that month's targets, grouped
 * by Freshwater / Saltwater, each linking to its species page. A hand-curated
 * set of featured fisheries (from destinations/) anchors each month.
 *
 * Outputs:
 *   whats-biting/<month>.html     one page per calendar month
 *   whats-biting/index.html       hub page (also linked as "seasonal calendar")
 *
 * Run:  node tools/generate-monthly.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { fitTitle } from './lib/title-fit.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.blueseasfishing.com';

/* ------------------------------------------------------------ load DB */
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const file of ['species-db.js', 'species-db.enriched.js', 'species-db.enriched.world.js', 'species-db.expanded.js', 'species-db.expanded.worldwide.js', 'species-db.regions.js', 'species-db.images.js']) {
  try { vm.runInContext(readFileSync(join(ROOT, file), 'utf8'), sandbox); } catch (e) { /* skip broken pack */ }
}
const DB = [...(sandbox.window.SPECIES_DB || []), ...(sandbox.window.SPECIES_DB_ENRICH || []), ...(sandbox.window.SPECIES_DB_CATALOG_ROWS || [])]
  // dedupe by lowercase name, keep the row with the longest season string (most specific)
  .reduce((acc, s) => {
    if (!s || !s.name) return acc;
    const key = String(s.name).toLowerCase();
    const prev = acc.get(key);
    if (!prev || String(s.season || '').length > String(prev.season || '').length) acc.set(key, s);
    return acc;
  }, new Map());

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

/* ------------------------------------------------------- season parsing */
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTH_ABBR = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
const SEASONS = { spring: [2, 3, 4, 5], summer: [5, 6, 7, 8], fall: [8, 9, 10, 11], autumn: [8, 9, 10, 11], winter: [11, 0, 1, 2] };

/** Expand a season string into a Set of month indexes (0-11). */
const SEASON_SPANS = { spring: [2, 4], summer: [5, 7], fall: [8, 10], autumn: [8, 10], winter: [11, 1] };
function seasonMonths(season) {
  const s = String(season || '').toLowerCase();
  if (!s || /varies|check |check\b|run-dependent|depends|region|weather|regulation/i.test(s)) return null; // ambiguous — skip
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

/** Month-specific featured fisheries: hand-picked anchors with destination pages. */
const FEATURED = {
  0: [['florida-keys-bahamas.html', 'Florida Keys'], ['california-banks-ca.html', 'California Banks'], ['great-lakes-us-ca.html', 'Great Lakes Tributaries (steelhead)']],
  1: [['florida-keys-bahamas.html', 'Florida Keys'], ['lake-trout-vs-bull-trout-identification.html', 'Ice-lines & deep lakes'], ['gulf-of-mexico.html', 'Gulf of Mexico']],
  2: [['florida-reefs-us.html', 'Florida Reefs'], ['sacramento-ca.html', 'Sacramento River'], ['outer-banks-nc.html', 'Outer Banks']],
  3: [['outer-banks-nc.html', 'Outer Banks'], ['chesapeake-md-va.html', 'Chesapeake Bay'], ['columbia-river-or-wa.html', 'Columbia River']],
  4: [['chesapeake-md-va.html', 'Chesapeake Bay'], ['cabo-mx.html', 'Cabo San Lucas'], ['great-lakes-us-ca.html', 'Great Lakes']],
  5: [['cabo-mx.html', 'Cabo San Lucas'], ['great-lakes-us-ca.html', 'Great Lakes'], ['san-diego-offshore.html', 'San Diego Offshore']],
  6: [['san-diego-offshore.html', 'San Diego Offshore'], ['venice-la.html', 'Venice, Louisiana'], ['montauk-ny.html', 'Montauk']],
  7: [['montauk-ny.html', 'Montauk'], ['venice-la.html', 'Venice, Louisiana'], ['hatteras-nc.html', 'Hatteras']],
  8: [['hatteras-nc.html', 'Hatteras'], ['montauk-ny.html', 'Montauk'], ['columbia-river-or-wa.html', 'Columbia River (salmon)']],
  9: [['outer-banks-nc.html', 'Outer Banks'], ['columbia-river-or-wa.html', 'Columbia River'], ['chesapeake-md-va.html', 'Chesapeake (rockfish run)']],
  10: [['chesapeake-md-va.html', 'Chesapeake rockfish run'], ['florida-reefs-us.html', 'Florida Reefs'], ['georges-bank-us.html', 'Georges Bank']],
  11: [['florida-keys-bahamas.html', 'Florida Keys'], ['georges-bank-us.html', 'Georges Bank'], ['great-lakes-us-ca.html', 'Great Lakes Tributaries']],
};
/** State × month map (written by generate-states.mjs): state -> months with pages. */
let STATE_MONTHS = {};
try { STATE_MONTHS = JSON.parse(readFileSync(join(ROOT, '.states-month-map.json'), 'utf8')); } catch { /* states not built yet */ }

/** "In season by state" block for a national month page. */
function byStateBlock(m) {
  const mKey = monthTitle(m).toLowerCase();
  const states = Object.entries(STATE_MONTHS)
    .filter(([, v]) => v.months && v.months[mKey])
    .sort((a, b) => b[1].months[mKey] - a[1].months[mKey]);
  if (!states.length) return '';
  const pills = states.map(([slug, v]) => `<a href="/states/${slug}/${mKey}.html">${esc(v.name)}</a>`).join(' · ');
  return `<div class="feat-box"><strong>In season by state — ${monthTitle(m)}</strong><p style="margin:6px 0 0">${pills}</p><p class="muted" style="font-size:13px;margin:8px 0 0">State pages list the species whose season windows cover this month.</p></div>`;
}

// Some featured links may not exist as destinations; verify against disk at build time.
function featuredFor(month) {
  return (FEATURED[month] || [])
    .filter(([href]) => existsSync(join(ROOT, 'destinations', href.split('/').pop()) ) || (href.includes('identification') && existsSync(join(ROOT, href))))
    .map(([href, label]) => ({
      // destination pages live in /destinations/, comparison guides at site root
      href: href.includes('identification') ? `/${href}`
        : existsSync(join(ROOT, 'destinations', href)) ? `/destinations/${href}`
        : `/destinations/${href}`,
      label,
    }));
}

/* ------------------------------------------------------------- layout */
const NAV = `<nav class="guide-nav"><div class="guide-nav-inner"><a class="guide-brand" href="/">Blue Seas Fishing</a><a href="/fish-id.html">Identify a Fish</a><a href="/whats-biting/">Seasonal Calendar</a><a href="/states/">Fishing by State</a><a href="/gallery.html">Species Database</a><a href="/destinations/">Destinations</a><a href="/forum.html">Forum</a><a href="/subscribe.html">Subscribe</a></div></nav>`;

function monthTitle(m) { const d = new Date(2026, m, 1); return d.toLocaleString('en-US', { month: 'long' }); }

function seasonSection(monthIdx, env) {
  const rows = [...DB.values()].filter((s) => {
    if (String(s.env || '').toLowerCase() !== env.toLowerCase()) return false;
    const months = seasonMonths(s.season);
    return months && months.has(monthIdx);
  });
  if (!rows.length) return '';
  rows.sort((a, b) => shortName(a.name).localeCompare(shortName(b.name)));
  const items = rows.slice(0, 40).map((s) => {
    const img = imgFor(s.name);
    return `<li><a href="/species/${toSlug(s.name)}.html">${esc(shortName(s.name))}</a>${img ? ` <img src="${img}" alt="" width="64" height="43" loading="lazy" style="vertical-align:middle;border-radius:4px;margin-left:6px">` : ''}<span class="muted" style="font-size:13px"> — ${esc(s.season)}</span></li>`;
  }).join('\n      ');
  const more = rows.length > 40 ? `<p class="muted">…and ${rows.length - 40} more in the <a href="/gallery.html">species database</a>.</p>` : '';
  return `<h2>${env} targets in ${monthTitle(monthIdx)}</h2><ul class="month-species">\n      ${items}\n    </ul>${more}`;
}

function buildMonthPage(m) {
  const title = fitTitle([
    `What's Biting in ${monthTitle(m)} — Fishing Calendar | Blue Seas Fishing`,
    `What's Biting in ${monthTitle(m)} — Fishing Calendar | Blue Seas`,
    `What's Biting in ${monthTitle(m)} — Fishing Calendar`,
  ]);
  const desc = `${monthTitle(m)} fishing calendar: which freshwater and saltwater species are in season now, month-best fisheries, and full species profiles.`;
  const url = `${SITE}/whats-biting/${monthTitle(m).toLowerCase()}.html`;
  const prevM = (m + 11) % 12, nextM = (m + 1) % 12;

  const ld = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'What\'s Biting Calendar', item: `${SITE}/whats-biting/` },
        { '@type': 'ListItem', position: 3, name: monthTitle(m), item: url },
      ] },
      { '@type': 'Article', headline: title, description: desc, mainEntityOfPage: url,
        publisher: { '@type': 'Organization', name: 'Blue Seas Fishing', url: `${SITE}/` } },
    ],
  };

  const featured = featuredFor(m).map((f) => `<li><a href="${esc(f.href)}">${esc(f.label)}</a></li>`).join('');
  const fw = seasonSection(m, 'Freshwater');
  const sw = seasonSection(m, 'Saltwater');
  // Answer-first copy: the old lede opened with "species whose season windows
  // include … drawn from the season field of every profile in our database",
  // which is the sentence Google pulled as the snippet (measured 2026-11-01).
  const countIn = (env) => [...DB.values()].filter((s) => {
    if (String(s.env || '').toLowerCase() !== env.toLowerCase()) return false;
    const mo = seasonMonths(s.season); return mo && mo.has(m);
  }).length;
  const fwCount = countIn('Freshwater'), swCount = countIn('Saltwater');
  const seasonTotal = fwCount + swCount;

  const allMonths = MONTHS.map((_, i) => `<a href="/whats-biting/${monthTitle(i).toLowerCase()}.html"${i === m ? ' class="current"' : ''}>${monthTitle(i).slice(0, 3)}</a>`).join(' ');

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
    .month-nav{display:flex;gap:6px;flex-wrap:wrap;margin:14px 0}
    .month-nav a{padding:6px 10px;border:1px solid #c9d8e4;border-radius:999px;font-size:13px;text-decoration:none;color:#134e6f}
    .month-nav a.current{background:#0b3d5c;color:#fff;border-color:#0b3d5c}
    .month-species li{margin:6px 0}
    .feat-box{border:1px solid #d8e2ea;border-radius:10px;background:#f7fafc;padding:14px 16px;margin:16px 0}
    .feat-box ul{padding-left:18px;margin:8px 0 0}
  </style>
  <script src="/analytics-consent.js?v=2" defer></script>
</head>
<body>
${NAV}
<main class="guide-wrap">
  <div class="breadcrumbs"><a href="/">Home</a> / <a href="/whats-biting/">Seasonal calendar</a> / ${monthTitle(m)}</div>
  <h1>What's biting in ${monthTitle(m)}</h1>
  <p class="lede">In ${monthTitle(m)}, ${seasonTotal} species are inside their season window — ${fwCount} freshwater and ${swCount} saltwater. Each list is below with its season dates, followed by the fisheries that fish best this month. Seasons shift by region, so check your state's rules before you go.</p>
  <div class="month-nav">${allMonths}</div>
  ${featured ? `<div class="feat-box"><strong>Featured fisheries this month</strong><ul>${featured}</ul></div>` : ''}
  ${byStateBlock(m)}
  ${fw || ''}
  ${sw || ''}
  ${!fw && !sw ? '<p>Season windows for this month are being expanded. Meanwhile, browse the <a href="/gallery.html">species database</a> or the <a href="/whats-biting/">full calendar</a>.</p>' : ''}
  <div class="news-cta" style="margin:18px 0;padding:16px;border:1px solid #c7e2d2;border-radius:12px;background:#f2faf5;display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between">
    <div><strong>Monthly bite brief</strong><div class="muted" style="font-size:14px">What's biting in your state, seasonal targets and new guides — one email a month. Unsubscribe anytime.</div></div>
    <a class="button" href="/#newsletter">Get fishing updates</a>
  </div>
  <div class="action"><h2>Catch something this month?</h2><p>Upload a photo for an AI-assisted identification, then confirm against the species profile.</p><a class="button" href="/fish-id.html">Identify my fish</a></div>
  <footer class="guide-footer"><a href="/whats-biting/">Full seasonal calendar</a> · <a href="/states/">Fishing by state</a> · <a href="/species/">Species A–Z</a> · <a href="/">Blue Seas Fishing</a></footer>
</main>
<script src="/assets/js/nav-back.js?v=3" defer></script>
</body>
</html>
`;
}

function buildHub() {
  const title = 'What\'s Biting — Monthly Fishing Calendar | Blue Seas';
  const desc = 'Month-by-month fishing calendar: what freshwater and saltwater species are in season right now, with links to full species profiles and featured fisheries.';
  const url = `${SITE}/whats-biting/`;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'What\'s Biting Calendar', item: url }] },
    { '@type': 'Article', headline: title, description: desc, mainEntityOfPage: url,
      publisher: { '@type': 'Organization', name: 'Blue Seas Fishing', url: `${SITE}/` } },
  ] };
  const cards = MONTHS.map((_, m) => {
    const count = [...DB.values()].filter((s) => { const mo = seasonMonths(s.season); return mo && mo.has(m); }).length;
    return `<li><a href="/whats-biting/${monthTitle(m).toLowerCase()}.html"><strong>${monthTitle(m)}</strong></a><span class="muted"> — ${count} species in season</span></li>`;
  }).join('\n      ');
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
  <style>.month-grid li{margin:8px 0;font-size:17px}</style>
  <script src="/analytics-consent.js?v=2" defer></script>
</head>
<body>
${NAV}
<main class="guide-wrap">
  <div class="breadcrumbs"><a href="/">Home</a> / What's biting calendar</div>
  <h1>What's biting — the monthly fishing calendar</h1>
  <p class="lede">Every month of the year mapped to the species in season across our database, with featured fisheries for each month. Pick your month, pick your target, open the full profile.</p>
  <ul class="month-grid">
      ${cards}
  </ul>
  <div class="action"><h2>Not sure what you caught?</h2><p>Upload a photo for an AI-assisted identification — free, three per day.</p><a class="button" href="/fish-id.html">Identify my fish</a></div>
  <footer class="guide-footer"><a href="/whats-biting/">Monthly calendar</a> · <a href="/states/">Fishing by state</a> · <a href="/species/">Species A–Z</a> · <a href="/destinations/">Destinations</a> · <a href="/">Blue Seas Fishing</a></footer>
</main>
<script src="/assets/js/nav-back.js?v=3" defer></script>
</body>
</html>
`;
}

/* ---------------------------------------------------------------- main */
mkdirSync(join(ROOT, 'whats-biting'), { recursive: true });
let months = 0;
for (let m = 0; m < 12; m++) {
  writeFileSync(join(ROOT, 'whats-biting', `${monthTitle(m).toLowerCase()}.html`), buildMonthPage(m));
  months++;
}
writeFileSync(join(ROOT, 'whats-biting', 'index.html'), buildHub());
console.log(`Done: ${months} month pages + hub (whats-biting/)`);
