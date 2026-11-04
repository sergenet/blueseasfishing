#!/usr/bin/env node
/**
 * generate-states.mjs
 *
 * Builds the 50-state + DC "Fishing Seasons" calendar — the site's linkable
 * data asset for "[state] fishing season" and "[state] what's biting" queries.
 *
 * Method (transparent, data-driven — no scraped content):
 *   - A species belongs to a state when the state's full name or a famous
 *     shared fishery (Chesapeake, Outer Banks, Great Lakes, Gulf of Mexico…)
 *     appears in that species' `regions` data. Species carrying an explicit
 *     two-letter code (e.g. "Chesapeake (MD/VA)", "Sacramento (CA)") map to
 *     exactly those states; US/CA in a code group means Canada, not California.
 *   - Per state: freshwater/saltwater species tables (species pages), the
 *     months when the most of that state's species are in season (shared
 *     season parser, same logic as generate-monthly.mjs), auto-derived
 *     destination links, and hand-checked licence sources.
 *
 * Outputs:
 *   states/index.html          hub — all states with species counts
 *   states/<state>.html        one page per state
 *
 * Run order: after destinations/monthly generators; then sitemap + verify-seo.
 *   node tools/generate-states.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { fitTitle } from './lib/title-fit.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.blueseasfishing.com';
const OUT_DIR = join(ROOT, 'states');
const MIN_SPECIES = 3; // a state ships with a full page at 3+ species; smaller ones still ship (truthful pages, noted as growing)

// Census-style regions — used by the hub sections AND by each state page's
// "nearby states" block (Phase 1 interlinking: every state page links its
// region peers, so no state is reachable only from the hub).
const REGION_GROUPS = [
  ['South', ['FL', 'TX', 'LA', 'AL', 'MS', 'GA', 'SC', 'NC', 'VA', 'AR', 'OK', 'TN', 'KY', 'WV']],
  ['Northeast', ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA', 'MD', 'DE', 'DC']],
  ['Midwest', ['OH', 'MI', 'IN', 'IL', 'WI', 'MN', 'IA', 'MO', 'KS', 'NE', 'SD', 'ND']],
  ['West', ['WA', 'OR', 'CA', 'NV', 'AZ', 'UT', 'ID', 'MT', 'WY', 'CO', 'NM', 'AK', 'HI']],
];

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
// Curated corrections replace upstream region data (same as regions/destinations gen).
const CORRECTIONS = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'region-corrections.json'), 'utf8'));
for (const s of sandbox.window.SPECIES_DB || []) {
  const c = CORRECTIONS[String(s.name || '').trim()];
  if (c) s.regions = c.slice();
}
// Generated regions pack (fill-or-add).
try { vm.runInContext(readFileSync(join(ROOT, 'species-db.regions.js'), 'utf8'), sandbox); } catch (e) { /* keep going */ }

const db = sandbox.window.SPECIES_DB || [];
const seen = new Map();
for (const s of db) { const k = String(s.name || '').toLowerCase(); if (k && !seen.has(k)) seen.set(k, s); }
const species = [...seen.values()];

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

/* ------------------------------------------------------- season parser -- */
/* Shared logic with generate-monthly.mjs / generate-destinations.mjs. */
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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
  if (/year-?round|all year/i.test(s)) {
    const peak = s.match(/(spring|summer|fall|autumn|winter)\s*(?:\u2013|\u2014|-|to|through)\s*(?:early\s*|late\s*)?(spring|summer|fall|autumn|winter)/);
    if (peak && /peak/i.test(s)) { addSpan([SEASON_SPANS[peak[1]][0], SEASON_SPANS[peak[2]][1]]); return out; }
    for (let i = 0; i < 12; i++) out.add(i);
    return out;
  }
  const range = s.match(/(spring|summer|fall|autumn|winter)\s*(?:\u2013|\u2014|-|to|through)\s*(?:early\s*|late\s*)?(spring|summer|fall|autumn|winter)/);
  if (range) { addSpan([SEASON_SPANS[range[1]][0], SEASON_SPANS[range[2]][1]]); return out; }
  let matched = false;
  for (const [word, span] of Object.entries(SEASON_SPANS)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(s)) { addSpan(span); matched = true; }
  }
  if (matched) return out;
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

/** Months where the most of a state's species are in season (>=60% of peak, floor 3). */
function bestMonths(list) {
  const counts = new Array(12).fill(0);
  for (const s of list) {
    const months = seasonMonths(s.season);
    if (months) months.forEach((m) => { counts[m] += 1; });
  }
  const max = Math.max(...counts);
  if (max < MIN_SPECIES) return [];
  const cutoff = Math.max(MIN_SPECIES, Math.ceil(max * 0.6));
  return counts.map((c, i) => ({ i, c })).filter((x) => x.c >= cutoff);
}

/* ----------------------------------------------------------- states -- */
const STATES = {
  AL: { name: 'Alabama', lic: { region: 'Alabama (ADCNR)', sources: ['https://www.outdooralabama.com/'] } },
  AK: { name: 'Alaska', lic: { region: 'Alaska (ADF&G)', sources: ['https://www.adfg.alaska.gov/'] } },
  AZ: { name: 'Arizona', lic: { region: 'Arizona (AZGFD)', sources: ['https://www.azgfd.com/'] } },
  AR: { name: 'Arkansas', lic: { region: 'Arkansas (AGFC)', sources: ['https://www.agfc.com/'] } },
  CA: { name: 'California', lic: { region: 'California (CDFW)', sources: ['https://wildlife.ca.gov/'] } },
  CO: { name: 'Colorado', lic: { region: 'Colorado (CPW)', sources: ['https://cpw.state.co.us/'] } },
  CT: { name: 'Connecticut', lic: { region: 'Connecticut (DEEP)', sources: ['https://portal.ct.gov/deep'] } },
  DE: { name: 'Delaware', lic: { region: 'Delaware (DNREC)', sources: ['https://dnrec.delaware.gov/'] } },
  FL: { name: 'Florida', lic: { region: 'Florida (FWC)', sources: ['https://myfwc.com/'] } },
  GA: { name: 'Georgia', lic: { region: 'Georgia (WRD)', sources: ['https://georgiawildlife.com/'] } },
  HI: { name: 'Hawaii', lic: { region: 'Hawaii (DAR)', sources: ['https://dlnr.hawaii.gov/dar/'] } },
  ID: { name: 'Idaho', lic: { region: 'Idaho (IDFG)', sources: ['https://idfg.idaho.gov/'] } },
  IL: { name: 'Illinois', lic: { region: 'Illinois (IDNR)', sources: ['https://www2.illinois.gov/dnr/'] } },
  IN: { name: 'Indiana', lic: { region: 'Indiana (DNR)', sources: ['https://www.in.gov/dnr/'] } },
  IA: { name: 'Iowa', lic: { region: 'Iowa (DNR)', sources: ['https://www.iowadnr.gov/'] } },
  KS: { name: 'Kansas', lic: { region: 'Kansas (KDWP)', sources: ['https://www.ksoutdoors.com/'] } },
  KY: { name: 'Kentucky', lic: { region: 'Kentucky (KDFWR)', sources: ['https://fw.ky.gov/'] } },
  LA: { name: 'Louisiana', lic: { region: 'Louisiana (LDWF)', sources: ['https://www.wlf.louisiana.gov/'] } },
  ME: { name: 'Maine', lic: { region: 'Maine (IFW)', sources: ['https://www.maine.gov/ifw/'] } },
  MD: { name: 'Maryland', lic: { region: 'Maryland (DNR)', sources: ['https://dnr.maryland.gov/'] } },
  MA: { name: 'Massachusetts', lic: { region: 'Massachusetts (MassWildlife/DMF)', sources: ['https://www.mass.gov/orgs/masswildlife'] } },
  MI: { name: 'Michigan', lic: { region: 'Michigan (DNR)', sources: ['https://www.michigan.gov/dnr'] } },
  MN: { name: 'Minnesota', lic: { region: 'Minnesota (DNR)', sources: ['https://www.dnr.state.mn.us/'] } },
  MS: { name: 'Mississippi', lic: { region: 'Mississippi (MDWFP/DMR)', sources: ['https://www.mdwfp.com/', 'https://dmr.ms.gov/'] } },
  MO: { name: 'Missouri', lic: { region: 'Missouri (MDC)', sources: ['https://mdc.mo.gov/'] } },
  MT: { name: 'Montana', lic: { region: 'Montana (FWP)', sources: ['https://fwp.mt.gov/'] } },
  NE: { name: 'Nebraska', lic: { region: 'Nebraska (NGPC)', sources: ['https://outdoornebraska.gov/'] } },
  NV: { name: 'Nevada', lic: { region: 'Nevada (NDOW)', sources: ['https://www.ndow.org/'] } },
  NH: { name: 'New Hampshire', lic: { region: 'New Hampshire (Fish and Game)', sources: ['https://wildlife.state.nh.us/'] } },
  NJ: { name: 'New Jersey', lic: { region: 'New Jersey (DEP Fish & Wildlife)', sources: ['https://dep.nj.gov/njfishandwildlife/'] } },
  NM: { name: 'New Mexico', lic: { region: 'New Mexico (NMDGF)', sources: ['https://www.wildlife.state.nm.us/'] } },
  NY: { name: 'New York', lic: { region: 'New York (DEC)', sources: ['https://www.dec.ny.gov/'] } },
  NC: { name: 'North Carolina', lic: { region: 'North Carolina (NCWRC/DMF)', sources: ['https://www.ncwildlife.org/', 'https://www.deq.nc.gov/marine-fisheries'] } },
  ND: { name: 'North Dakota', lic: { region: 'North Dakota (Game and Fish)', sources: ['https://gf.nd.gov/'] } },
  OH: { name: 'Ohio', lic: { region: 'Ohio (ODNR)', sources: ['https://ohiodnr.gov/'] } },
  OK: { name: 'Oklahoma', lic: { region: 'Oklahoma (ODWC)', sources: ['https://www.wildlifedepartment.com/'] } },
  OR: { name: 'Oregon', lic: { region: 'Oregon (ODFW)', sources: ['https://www.dfw.state.or.us/'] } },
  PA: { name: 'Pennsylvania', lic: { region: 'Pennsylvania (PFBC)', sources: ['https://www.fishandboat.com/'] } },
  RI: { name: 'Rhode Island', lic: { region: 'Rhode Island (DEM)', sources: ['https://dem.ri.gov/'] } },
  SC: { name: 'South Carolina', lic: { region: 'South Carolina (SCDNR)', sources: ['https://www.dnr.sc.gov/'] } },
  SD: { name: 'South Dakota', lic: { region: 'South Dakota (GFP)', sources: ['https://gfp.sd.gov/'] } },
  TN: { name: 'Tennessee', lic: { region: 'Tennessee (TWRA)', sources: ['https://www.tn.gov/twra.html'] } },
  TX: { name: 'Texas', lic: { region: 'Texas (TPWD)', sources: ['https://tpwd.texas.gov/'] } },
  UT: { name: 'Utah', lic: { region: 'Utah (DWR)', sources: ['https://wildlife.utah.gov/'] } },
  VT: { name: 'Vermont', lic: { region: 'Vermont (FWD)', sources: ['https://vtfishandwildlife.com/'] } },
  VA: { name: 'Virginia', lic: { region: 'Virginia (DWR/VMRC)', sources: ['https://dwr.virginia.gov/', 'https://www.mrc.virginia.gov/'] } },
  WA: { name: 'Washington', lic: { region: 'Washington (WDFW)', sources: ['https://wdfw.wa.gov/'] } },
  WV: { name: 'West Virginia', lic: { region: 'West Virginia (DNR)', sources: ['https://wvdnr.gov/'] } },
  WI: { name: 'Wisconsin', lic: { region: 'Wisconsin (DNR)', sources: ['https://dnr.wisconsin.gov/'] } },
  WY: { name: 'Wyoming', lic: { region: 'Wyoming (GFD)', sources: ['https://wgfd.wyo.gov/'] } },
  DC: { name: 'District of Columbia', lic: { region: 'District of Columbia (DOEE)', sources: ['https://doee.dc.gov/'] } },
};

/** Famous shared fisheries -> state codes. Multi-region fisheries only; a
 *  regex that is really one place must match exactly one state. */
const KEYWORDS = [
  [/chesapeake/i, ['MD', 'VA']],
  [/outer banks|hatteras|carolina sounds/i, ['NC']],
  [/\bcarolinas?\b/i, ['NC', 'SC']],
  [/santee/i, ['SC']],
  [/gulf of mexico|gulf coast\b|gulf \(fl\b|\bgulf\b|venice|louisiana marsh|laguna madre/i, ['FL', 'TX', 'LA', 'AL', 'MS']],
  [/florida/i, ['FL']],
  [/great lakes/i, ['MI', 'WI', 'MN', 'IL', 'IN', 'OH', 'PA', 'NY']],
  [/puget sound|columbia river|pacific northwest/i, ['WA', 'OR']],
  [/sacramento|monterey|california bank|channel islands|san diego/i, ['CA']],
  [/hudson river|montauk|long island|new york/i, ['NY']],
  [/georges bank|cape cod|gulf of maine|new england/i, ['MA']],
  [/susquehanna/i, ['PA']],
  [/mississippi river/i, ['MN', 'WI', 'IA', 'IL', 'MO', 'KY', 'TN', 'AR', 'MS', 'LA']],
  [/ohio river/i, ['PA', 'OH', 'WV', 'KY', 'IN', 'IL']],
  [/missouri river/i, ['MT', 'ND', 'SD', 'NE', 'IA', 'KS', 'MO']],
  [/alaska/i, ['AK']],
  [/hawaii/i, ['HI']],
  [/reservoirs \(tx|trinity river \(tx/i, ['TX', 'OK']],
  [/southern reservoirs|southern us rivers/i, ['TX', 'OK', 'AR', 'LA', 'MS', 'AL', 'GA', 'FL', 'SC', 'NC', 'TN']],
  [/ozarks/i, ['MO', 'AR', 'OK', 'KS']],
  [/appalachia|smoky|southern appalachian/i, ['TN', 'NC', 'GA', 'AL']],
];

/** Species -> state codes. Only explicit 2-letter codes inside a parenthesised
 *  or slash-separated group count: "Chesapeake (MD/VA)", "Sacramento (CA)".
 *  "(US/CA)" is United States / Canada, not California — excluded. */
function statesFor(sp) {
  const out = new Set();
  const regs = Array.isArray(sp.regions) ? sp.regions
    : String(sp.regions || '').split(/[,;]|\u2022/).map((x) => x.trim()).filter(Boolean);
  for (const r of regs) {
    for (const m of r.matchAll(/[(\/\[](US\/)?([A-Z]{2})(?=[\/\)\]\s,]|$)/g)) {
      if (m[1] || !STATES[m[2]]) continue; // "US/CA" or a country code
      out.add(m[2]);
    }
    for (const [code, st] of Object.entries(STATES)) {
      const pat = st.name === 'Virginia' ? '(?<!West )\\bVirginia\\b' : `\\b${st.name}\\b`;
      if (new RegExp(pat, 'i').test(r)) out.add(code);
    }
    for (const [re, codes] of KEYWORDS) if (re.test(r)) for (const c of codes) out.add(c);
  }
  return out;
}

/* --------------------------------------------------- aggregate states -- */
const byState = new Map(); // code -> [{row, via}]
const viaByState = new Map(); // code -> Set(match method)
for (const sp of species) {
  for (const code of statesFor(sp)) {
    if (!byState.has(code)) { byState.set(code, []); viaByState.set(code, new Set()); }
    byState.get(code).push(sp);
    viaByState.get(code).add('regions');
  }
}

const NAV = `<nav class="guide-nav"><div class="guide-nav-inner"><a class="guide-brand" href="/">Blue Seas Fishing</a><a href="/fish-id.html">Identify a Fish</a><a href="/whats-biting/">Seasonal Calendar</a><a href="/states/">Fishing by State</a><a href="/destinations/">Destinations</a><a href="/forum.html">Forum</a><a href="/subscribe.html">Subscribe</a></div></nav>`;

/* ------------------------------------------------------ page builders -- */
function speciesTable(list, opts = {}) {
  if (!list.length) return '';
  const rows = list.map((s) => {
    const img = imgFor(s.name);
    const months = seasonMonths(s.season);
    const season = months ? [...months].sort((a, b) => a - b).map((m) => MONTH_NAMES[m].slice(0, 3)).join('–') : String(s.season || '').trim();
    const bait = opts.baits
      ? `<td class="st-bait">${esc(String(s.baits || '').trim().slice(0, 120) || '—')}</td>`
      : '';
    return `<tr><td class="st-name">${img ? `<img src="${img}" alt="" width="44" height="30" loading="lazy"> ` : ''}<a href="/species/${toSlug(s.name)}.html">${esc(shortName(s.name))}</a></td><td>${esc(season || '—')}</td>${bait}</tr>`;
  }).join('\n      ');
  const head = opts.baits ? '<th>Species</th><th>Season</th><th>Baits &amp; lures that work</th>' : '<th>Species</th><th>Season</th>';
  return `<table class="st-table"><thead><tr>${head}</tr></thead><tbody>\n      ${rows}\n    </tbody></table>`;
}

/* Species whose window OPENS this month, and whose window CLOSES after it.
 *
 *  This is the only block on a state-month page that nothing else publishes: the
 *  species list is shared with the state guide and the national calendar, but
 *  "what just became legal to target" and "what you have one month left for" is a
 *  month-boundary fact, and it changes every month, which is what earns recrawls.
 *  Derived from the same season windows as everything else — nothing invented. */
function seasonTransitions(list, m) {
  const prev = (m + 11) % 12;
  const next = (m + 1) % 12;
  const opens = [];
  const closes = [];
  for (const s of list) {
    const mo = seasonMonths(s.season);
    if (!mo || !mo.has(m)) continue;
    if (!mo.has(prev)) opens.push(s);
    if (!mo.has(next)) closes.push(s);
  }
  const byName = (a, b) => shortName(a.name).localeCompare(shortName(b.name));
  return { opens: opens.sort(byName), closes: closes.sort(byName) };
}

function transitionBlock(name, mn, { opens, closes }) {
  if (!opens.length && !closes.length) return '';
  const line = (s) => `<li><a href="/species/${toSlug(s.name)}.html">${esc(shortName(s.name))}</a><span class="st-bait-inline">${esc(String(s.baits || '').trim())}</span></li>`;
  const parts = [`<h2>What changes in ${esc(name)} in ${mn}</h2>`];
  parts.push(`<p class="st-shift">${opens.length} species enter their season window in ${mn} and ${closes.length} are in their last month of the ${esc(name)} season as we chart it.</p>`);
  if (opens.length) {
    parts.push(`<h3>Opening in ${mn} (${opens.length})</h3><ul class="st-shift-list">${opens.slice(0, 12).map(line).join('')}</ul>`);
  }
  if (closes.length) {
    parts.push(`<h3>Closing after ${mn} (${closes.length})</h3><ul class="st-shift-list">${closes.slice(0, 12).map(line).join('')}</ul>`);
  }
  return parts.join('\n  ');
}

function monthPillLinks(months) {
  if (!months.length) return '';
  return months.map(({ i }) => `<a class="st-pill" href="/whats-biting/${MONTH_NAMES[i].toLowerCase()}.html">${MONTH_NAMES[i]}</a>`).join('');
}

function destinationLinks(code, heading) {
  let map = {};
  try { map = JSON.parse(readFileSync(join(ROOT, '.destinations-map.json'), 'utf8')); } catch { return ''; }
  const want = {
    AL: ['Gulf coast (LA/TX)', 'Southern US rivers'], AK: ['Alaska (Sitka/Homer)', 'Gulf of Alaska'],
    CA: ['California banks (CA)', 'California offshore', 'Sacramento (CA)', 'Monterey Bay (CA)', 'Channel Islands (CA)', 'California/Baja'],
    FL: ['Florida coasts', 'Florida Keys / Bahamas', 'Florida reefs (US)', 'Key West (FL)', 'Dry Tortugas (FL)', 'Florida beaches', 'Florida Atlantic', 'Jupiter (FL)', 'Gulf of Mexico (FL/TX/LA)'],
    GA: ['South Atlantic (FL–NC)', 'South Atlantic reefs (FL–NC)', 'Southern US rivers'],
    HI: ['Hawaii'], LA: ['Venice (LA)', 'Louisiana marshes', 'Gulf coast (LA/TX)'],
    MD: ['Chesapeake (MD/VA)', 'Chesapeake (MD)', 'Chesapeake tributaries'],
    MA: ['Georges Bank (MA)', 'Georges Bank (US)', 'Gulf of Maine', 'Northeast US offshore (MA/NJ)'],
    NC: ['Outer Banks (NC)', 'Hatteras (NC)', 'Carolina sounds', 'Carolinas'],
    NY: ['Hudson River (NY)', 'Montauk (NY)', 'Hudson Canyon (NY)', 'Northeast US offshore (MA/NJ)'],
    OR: ['Columbia River (OR/WA)', 'Pacific Northwest (WA/OR)', 'Pacific Northwest beaches (WA/OR)'],
    SC: ['Santee Cooper (SC)', 'Carolinas', 'Carolina sounds'],
    TX: ['Laguna Madre (TX)', 'Trinity River (TX)', 'Gulf of Mexico (FL/TX)', 'Reservoirs (TX/OK/FL)', 'Gulf coast (LA/TX)'],
    VA: ['Chesapeake (MD/VA)', 'Chesapeake (VA/MD)'],
    WA: ['Puget Sound (WA)', 'Columbia River (OR/WA)', 'Pacific Northwest (WA/OR)'],
    PA: ['Susquehanna (PA)', 'Great Lakes (US/CA)'],
    ME: ['Gulf of Maine', 'Northeast US offshore (MA/NJ)'],
    NJ: ['Northeast US offshore (MA/NJ)'],
    MN: ['Great Lakes (US/CA)', 'Mississippi River'],
    WI: ['Great Lakes (US/CA)', 'Great Lakes bays', 'Mississippi River'],
    MI: ['Great Lakes (US/CA)', 'Great Lakes bays'],
    OH: ['Ohio River', 'Great Lakes (US/CA)'],
    IL: ['Great Lakes (US/CA)', 'Mississippi River'],
    MO: ['Mississippi River', 'Missouri River'],
  };
  let names = (want[code] || []).filter((n) => map[n]);
  // fallback: any destination whose region string mentions the state name
  if (!names.length) {
    const stName = STATES[code].name;
    for (const region of Object.keys(map)) {
      if (new RegExp(`\\b${stName}\\b`).test(region) && !names.includes(region)) names.push(region);
    }
  }
  if (!names.length) return '';
  const items = names.slice(0, 8).map((n) => `<li><a href="${esc(map[n])}">${esc(n)}</a></li>`).join('');
  const title = heading || `Where to fish in ${esc(STATES[code].name)}`;
  return `<h2>${title}</h2>\n  <ul class="st-dests">\n    ${items}\n  </ul>`;
}

/** Per-month in-season counts for a state's species list. */
function perMonthCounts(list) {
  return MONTH_NAMES.map((_, m) => list.filter((s) => { const mo = seasonMonths(s.season); return mo && mo.has(m); }).length);
}

/** 12-month grid for a state page: qualifying months link to state-month pages. */
function stateMonthsGrid(name, perMonth) {
  const stateSlug = toSlug(name);
  const cells = perMonth.map((n, m) => {
    if (n >= MIN_SPECIES) return `<a class="stg-cell" href="${stateSlug}/${MONTH_NAMES[m].toLowerCase()}.html"><span class="stg-m">${MONTH_NAMES[m].slice(0, 3)}</span><span class="stg-n">${n} in season</span></a>`;
    return `<span class="stg-cell stg-dim"><span class="stg-m">${MONTH_NAMES[m].slice(0, 3)}</span><span class="stg-n">—</span></span>`;
  }).join('');
  return `<h2>${esc(name)} fishing calendar, month by month</h2>\n  <div class="st-grid">\n    ${cells}\n  </div>\n  <p class="muted" style="font-size:13px">Each month links to the species in season then, from our season windows. A month is charted when at least ${MIN_SPECIES} species are in season.</p>`;
}

/** Species-set signature for a state in month m: the sorted slugs of the
 *  species in season. Two months with the same signature carry the same
 *  information, whatever the month name in the title says. */
function monthSignature(list, m) {
  return list
    .filter((s) => { const mo = seasonMonths(s.season); return mo && mo.has(m); })
    .map((s) => toSlug(s.name))
    .sort()
    .join(',');
}

/** Which of a state's month pages carry information no sibling carries.
 *
 *  Indexing diagnosis 2026-10-17: the generator used to emit a month page for
 *  every month with >= MIN_SPECIES in season, which produced 333 pages holding
 *  only 62 distinct species sets — and 17 states whose months were identical to
 *  each other. Hundreds of near-duplicate URLs is the single biggest reason
 *  Google filed them under "Discovered/Crawled - currently not indexed".
 *
 *  A month page is indexable only when:
 *    (a) the state varies month to month at all (>= 2 distinct species sets),
 *        and
 *    (b) this month is the sole representative of its own species set (ties go
 *        to the month with the most species in season, then the earliest).
 *  Every other month page is still written and still linked — just marked
 *  noindex,follow, so visitors keep the month view while the index keeps one
 *  page per distinct answer. */
// Which member of a duplicate species-set group gets indexed. The rule always kept
// one page per distinct set (unchanged — that is what stops 333 thin near-duplicates),
// but the OLD tie-break was "most species, then earliest month", which picked
// March/June/September and left every October and November page `noindex`.
// Measured 2026-11-01: 0 of the 47 indexable state-month pages were October or
// November, while Search Console's top pages for the site are states/ohio/october
// (3 clicks), states/texas/october (2), states/florida/november (2) — i.e. the rule
// was de-indexing the only seasonal months with demand. Weights below follow that
// measured order; unknown months sort last.
const DEMAND_ORDER = [9, 10, 8, 5, 4, 6, 3, 7, 11, 2, 0, 1]; // Oct, Nov, Sep, Jun, May, Apr, Mar, Aug, Dec, Mar, Jan, Feb
const demandRank = (m) => {
  const i = DEMAND_ORDER.indexOf(m);
  return i < 0 ? 99 : i;
};

function indexableMonths(code, perMonth) {
  const list = byState.get(code) || [];
  const sigByMonth = new Map();
  for (let m = 0; m < 12; m++) {
    if (perMonth[m] < MIN_SPECIES) continue;
    sigByMonth.set(m, monthSignature(list, m));
  }
  const keep = new Set();
  if (new Set(sigByMonth.values()).size < 2) return keep; // no month-level information; the state page covers it
  const best = new Map(); // signature -> representative month
  for (const [m, sig] of sigByMonth) {
    const prev = best.get(sig);
    const better = prev === undefined
      || demandRank(m) < demandRank(prev)
      || (demandRank(m) === demandRank(prev) && perMonth[m] > perMonth[prev])
      || (demandRank(m) === demandRank(prev) && perMonth[m] === perMonth[prev] && m < prev);
    if (better) best.set(sig, m);
  }
  for (const m of best.values()) keep.add(m);
  // October and November both earn clicks (states/florida/november, states/indiana/november,
  // states/texas/october…) and frequently collapse into ONE species set, so keeping only the
  // higher-demand member of that pair would still lose half the autumn searches. Allow the
  // runner-up of that single pair — at most two pages per duplicate group, never nine.
  for (const [m, sig] of sigByMonth) {
    if (m === 10 && best.get(sig) === 9) keep.add(10);
  }
  return keep;
}

/** The state × month landing page: /states/<state>/<month>.html */
function stateMonthPage(code, m, perMonth, indexable = true) {
  const st = STATES[code];
  const name = st.name;
  const list = byState.get(code) || [];
  const inSeason = list.filter((s) => { const mo = seasonMonths(s.season); return mo && mo.has(m); })
    .sort((a, b) => shortName(a.name).localeCompare(shortName(b.name)));
  const fw = inSeason.filter((s) => String(s.env || '').toLowerCase() === 'freshwater');
  const sw = inSeason.filter((s) => String(s.env || '').toLowerCase() !== 'freshwater');
  const mn = MONTH_NAMES[m];
  const url = `${SITE}/states/${toSlug(name)}/${mn.toLowerCase()}.html`;
  const stateUrl = `${SITE}/states/${toSlug(name)}.html`;
  const title = fitTitle([
    `Fishing in ${name} in ${mn} — What's Biting | Blue Seas Fishing`,
    `Fishing in ${name} in ${mn} — What's Biting`,
    `${name} Fishing in ${mn} — What's Biting`,
    `${name} Fishing — ${mn}`,
  ]);
  // Answer-first description: the searcher wants a species count and a split, not a
  // description of the page. Measured 2026-11-01: this page was Google's #1 web
  // result for "fishing in north carolina in october" and still earned 0 clicks,
  // because the snippet it chose was the old database-speak lede.
  const desc = `What's biting in ${name} in ${mn}: ${inSeason.length} species in season (${fw.length} freshwater, ${sw.length} saltwater), with baits and identification profiles.`;

  const ld = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Fishing by State', item: `${SITE}/states/` },
        { '@type': 'ListItem', position: 3, name, item: stateUrl },
        { '@type': 'ListItem', position: 4, name: mn, item: url },
      ] },
      { '@type': 'Article', headline: title, description: desc, mainEntityOfPage: url,
        about: { '@type': 'Place', name },
        publisher: { '@type': 'Organization', name: 'Blue Seas Fishing', url: `${SITE}/` } },
    ],
  };

  // sibling-month strip (only qualifying months get links)
  const strip = MONTH_NAMES.map((nm, i) => {
    if (i === m) return `<span class="sm-cur">${nm.slice(0, 3)}</span>`;
    return (perMonth[i] >= MIN_SPECIES)
      ? `<a href="${nm.toLowerCase()}.html">${nm.slice(0, 3)}</a>`
      : `<span class="sm-off" title="Not enough in-season species to chart">${nm.slice(0, 3)}</span>`;
  }).join(' ');

  const national = `/whats-biting/${mn.toLowerCase()}.html`;
  // Measured 2026-11-01: this page type earns 7 of the site's top 10 clicked pages and
  // ranks #1 for "fishing in <state> in <month>", but was 261 words with no reason to
  // click past the AI Overview. Everything below is derived from the species DB:
  // transitions (unique per month), bait lines (already in the DB), in-state fisheries
  // (already generated for the state guide) and a next-month preview.
  const shift = seasonTransitions(list, m);
  const shiftBlock = transitionBlock(name, mn, shift);
  const destBlock = destinationLinks(code, `Where to fish in ${esc(name)} in ${mn}`);
  const nextM = (m + 1) % 12;
  const arriving = list.filter((s) => { const mo = seasonMonths(s.season); return mo && mo.has(nextM) && !mo.has(m); })
    .map((s) => shortName(s.name)).sort((a, b) => a.localeCompare(b));
  const nextLine = perMonth[nextM] >= MIN_SPECIES
    ? `<p class="sm-next">Looking ahead: <a href="${MONTH_NAMES[nextM].toLowerCase()}.html">${perMonth[nextM]} species are in season in ${MONTH_NAMES[nextM]}</a>${arriving.length ? `, including ${esc(arriving.slice(0, 3).join(', '))}${arriving.length > 3 ? ` and ${arriving.length - 3} more` : ''}` : ''}.</p>`
    : '';
  const methodNote = `${inSeason.length} of the ${list.length} species profiles we map to ${esc(name)} waters have season windows covering ${mn}. Windows are species-wide — local runs and regs shift them. Full method: <a href="${stateUrl}">the ${esc(name)} state guide</a>.`;
  const slow = inSeason.length < 5
    ? `<div class="sm-slow"><strong>Honest note:</strong> ${mn} is a quiet month on this page — only ${inSeason.length} species have windows covering it. The <a href="${stateUrl}">state guide</a> lists year-round structure, and the <a href="${national}">national ${mn} calendar</a> shows what's biting elsewhere.</div>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  ${indexable ? '' : '<meta name="robots" content="noindex,follow">\n  '}<link rel="canonical" href="${url}">
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
    .sm-strip{display:flex;gap:6px;flex-wrap:wrap;margin:14px 0;font-size:13px}
    .sm-strip a,.sm-strip span{padding:5px 10px;border:1px solid #c9d8e4;border-radius:999px;text-decoration:none;color:#134e6f}
    .sm-strip .sm-cur{background:#0b3d5c;color:#fff;border-color:#0b3d5c}
    .sm-strip .sm-off{color:#9ab0c0;border-style:dashed}
    .sm-slow{border:1px solid #e4d9b8;border-radius:10px;background:#fdf9ee;padding:12px 14px;margin:16px 0;font-size:14px}
    .sm-next{margin:18px 0;font-size:14px}
    .st-shift{margin:6px 0 14px}
    .st-shift-list{margin:0 0 18px;padding-left:20px}
    .st-shift-list li{margin:6px 0}
    .st-bait-inline{display:block;color:#5b7185;font-size:13px}
  </style>
  <script src="/analytics-consent.js?v=2" defer></script>
</head>
<body>
${NAV}
<main class="guide-wrap">
  <div class="breadcrumbs"><a href="/">Home</a> / <a href="/states/">Fishing by state</a> / <a href="${stateUrl}">${esc(name)}</a> / ${mn}</div>
  <h1>Fishing in ${esc(name)} in ${mn}</h1>
  <p class="lede">In ${mn}, ${inSeason.length} species are inside their season window in ${esc(name)} waters — ${fw.length} freshwater and ${sw.length} saltwater${shift.opens.length ? `, and ${shift.opens.length} of them start their window this month` : ''}. Both lists are below with the baits that work for each, followed by ${shift.closes.length ? `the ${shift.closes.length} species you have one month left for and ` : ''}the fisheries in ${esc(name)} worth the drive. Season windows are species-wide and local rules shift them, so confirm dates with the <a href="${stateUrl}">${esc(name)} state guide</a> before you go.</p>
  <div class="sm-strip">${strip}</div>
  ${slow}
  ${shiftBlock}
  ${fw.length ? `<h2>Freshwater targets in ${esc(name)}, ${mn}</h2>\n  ${speciesTable(fw, { baits: true })}` : ''}
  ${sw.length ? `<h2>Saltwater &amp; brackish targets in ${esc(name)}, ${mn}</h2>\n  ${speciesTable(sw, { baits: true })}` : ''}
  ${nextLine}
  ${destBlock}
  <p class="muted" style="font-size:13px">National view: <a href="${national}">what's biting across all states in ${mn}</a>. ${methodNote}</p>
  <div class="action"><h2>Catch something you can't name?</h2><p>Upload a photo for an AI-assisted identification, then confirm it against the species list above.</p><a class="button" href="/fish-id.html">Identify my fish</a></div>
  <footer class="guide-footer"><a href="${stateUrl}">${esc(name)} state guide</a> · <a href="/states/">All states</a> · <a href="${national}">${mn} national calendar</a> · <a href="/">Blue Seas Fishing</a></footer>
</main>
<script src="/assets/js/nav-back.js?v=3" defer></script>
</body>
</html>
`;
}

function statePage(code) {
  const st = STATES[code];
  const list = byState.get(code) || [];
  const fw = list.filter((s) => String(s.env || '').toLowerCase() === 'freshwater').sort((a, b) => shortName(a.name).localeCompare(shortName(b.name)));
  const sw = list.filter((s) => String(s.env || '').toLowerCase() !== 'freshwater').sort((a, b) => shortName(a.name).localeCompare(shortName(b.name)));
  const name = st.name;
  const isDC = code === 'DC';
  const url = `${SITE}/states/${toSlug(name)}.html`;
  const title = fitTitle([
    `${name} Fishing Seasons — What's Biting & When | Blue Seas Fishing`,
    `${name} Fishing Seasons & What's Biting | Blue Seas`,
    `${name} Fishing Seasons: What's Biting`,
    `${name} Fishing Seasons`,
  ]);
  const desc = isDC
    ? `${name} fishing seasons: which freshwater and saltwater species are in season month by month, with licence info and links to full species profiles.`
    : `${name} fishing seasons: ${list.length} species profiles mapped to ${name} waters, the best months to fish, top fisheries and licence info.`;
  const months = bestMonths(list);
  const perMonth = perMonthCounts(list);
  const gridBlock = stateMonthsGrid(name, perMonth);

  const ld = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Fishing by State', item: `${SITE}/states/` },
        { '@type': 'ListItem', position: 3, name, item: url },
      ] },
      { '@type': 'Article', headline: title, description: desc, mainEntityOfPage: url,
        about: { '@type': 'Place', name },
        publisher: { '@type': 'Organization', name: 'Blue Seas Fishing', url: `${SITE}/` } },
    ],
  };

  const destBlock = destinationLinks(code);
  const region = REGION_GROUPS.find(([, codes]) => codes.includes(code));
  const regionBlock = region
    ? `<h2>Fishing in the ${esc(region[0])}</h2>
  <p class="st-region">${region[1].filter((c) => c !== code && STATES[c]).map((c) => `<a href="/states/${toSlug(STATES[c].name)}.html">${esc(STATES[c].name)}</a>`).join(' · ')}</p>`
    : '';
  const monthsBlock = months.length
    ? `<h2>Best months to fish in ${esc(name)}</h2>\n  <div class="st-months">${monthPillLinks(months)}</div>\n  <p class="muted" style="font-size:13px">Months when the largest share of ${esc(name)}'s profiled species are in season, from our database. Full calendar: <a href="/whats-biting/">What's Biting</a>.</p>`
    : '';
  const lic = st.lic;
  const licBlock = `<div class="st-licence"><h2>Licences &amp; regulations — ${esc(lic.region)}</h2><p>Rules, seasons and size limits change: check the official agency before you fish.</p><p class="st-lic-sources">Official: ${lic.sources.map((s) => `<a href="${esc(s)}" rel="nofollow">${esc(s.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>`).join(' · ')}</p></div>`;

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
    .st-table{width:100%;border-collapse:collapse;margin:12px 0 22px}
    .st-table th,.st-table td{border-bottom:1px solid #dde6ec;padding:7px 8px;text-align:left;vertical-align:middle}
    .st-table th{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:#5a7184}
    .st-table img{border-radius:4px;vertical-align:middle;margin-right:8px}
    .st-name a{font-weight:600}
    .st-months{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 6px}
    .st-pill{padding:6px 12px;border:1px solid #c9d8e4;border-radius:999px;font-size:13px;text-decoration:none;color:#134e6f}
    .st-licence{border:1px solid #b8cfe0;border-left:4px solid #0b3d5c;border-radius:8px;background:#f2f7fb;padding:14px 16px;margin:22px 0}
    .st-licence h2{margin-top:0;font-size:17px}
    .st-lic-sources{font-size:13px;color:#5a7184;margin-bottom:0}
    .st-dests{columns:2;column-gap:36px;padding-left:18px}
    .st-region{font-size:14px;line-height:2;margin:0 0 18px}
    .st-region a{color:#134e6f}
    @media(max-width:640px){.st-dests{columns:1}}
    .st-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px;margin:12px 0 6px}
    .stg-cell{border:1px solid #c9d8e4;border-radius:10px;padding:8px 6px;text-align:center;text-decoration:none;display:block}
    .stg-cell .stg-m{display:block;font-weight:700;font-size:14px;color:#134e6f}
    .stg-cell .stg-n{display:block;font-size:11px;color:#5a7184;margin-top:2px}
    a.stg-cell:hover{border-color:#0b3d5c;background:#f2f7fb}
    .stg-dim{border-style:dashed;background:#fbfcfd}
    .stg-dim .stg-m{color:#9ab0c0}
  </style>
  <script src="/analytics-consent.js?v=2" defer></script>
</head>
<body>
${NAV}
<main class="guide-wrap">
  <div class="breadcrumbs"><a href="/">Home</a> / <a href="/states/">Fishing by state</a> / ${esc(name)}</div>
  <h1>${esc(name)} fishing seasons</h1>
  <p class="lede">${esc(name)} waters hold ${list.length} of the species we profile — ${fw.length} freshwater and ${sw.length} saltwater. Below are the months that fish best, the fisheries to target and the licence source you need before you go. Seasons shift year to year; the official agency has the final word.</p>
  ${monthsBlock}
  ${gridBlock}
  ${speciesTable(fw) ? `<h2>Freshwater species in ${esc(name)}</h2>\n  ${speciesTable(fw)}` : ''}
  ${speciesTable(sw) ? `<h2>Saltwater &amp; brackish species in ${esc(name)}</h2>\n  ${speciesTable(sw)}` : ''}
  ${!fw.length && !sw.length ? '<p>Species coverage for this state is growing. Browse the <a href="/gallery.html">species database</a> meanwhile.</p>' : ''}
  ${destBlock}
  ${regionBlock}
  ${licBlock}
  <div class="action"><h2>Catch something you can't name?</h2><p>Upload a photo for an AI-assisted identification, then confirm it against the ${esc(name)} species list above.</p><a class="button" href="/fish-id.html">Identify my fish</a></div>
  <footer class="guide-footer"><a href="/states/">All states</a> · <a href="/whats-biting/">Seasonal calendar</a> · <a href="/fish-size-charts/">Record vs average size</a> · <a href="/species/">Species A–Z</a> · <a href="/">Blue Seas Fishing</a></footer>
</main>
<script src="/assets/js/nav-back.js?v=3" defer></script>
</body>
</html>
`;
}

function buildHub() {
  const title = 'Fishing Seasons by State — 50-State Calendar | Blue Seas';
  const desc = 'State-by-state fishing seasons: which freshwater and saltwater species are in season in your state, with best months, fisheries and licence sources.';
  const url = `${SITE}/states/`;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Fishing by State', item: url }] },
    { '@type': 'CollectionPage', name: 'Fishing Seasons by State', url, description: desc,
      publisher: { '@type': 'Organization', name: 'Blue Seas Fishing', url: `${SITE}/` } },
  ] };
  const sections = REGION_GROUPS.map(([label, codes]) => {
    const items = codes.map((c) => {
      const n = (byState.get(c) || []).length;
      const st = STATES[c];
      return `<li><a href="/states/${toSlug(st.name)}.html">${esc(st.name)}</a> <span class="st-count">${n ? `${n} species` : 'coming soon'}</span></li>`;
    }).join('\n        ');
    return `<section class="st-group"><h2>${label}</h2><ul>\n        ${items}\n      </ul></section>`;
  }).join('\n  ');
  const total = [...byState.values()].reduce((a, l) => a + l.length, 0);
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
    body{font-family:Lato,Arial,sans-serif;color:#1d3446;margin:0}
    .st-groups{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;margin:18px 0}
    .st-group h2{font-size:16px;border-bottom:2px solid #0b3d5c;padding-bottom:4px}
    .st-group ul{list-style:none;padding:0;margin:8px 0}
    .st-group li{margin:5px 0;font-size:15px}
    .st-count{color:#5a7184;font-size:13px;margin-left:6px}
    .st-state-note{border:1px solid #d8e2ea;border-radius:10px;background:#f7fafc;padding:12px 14px;margin:16px 0;font-size:14px;color:#41586b}
  </style>
  <script src="/analytics-consent.js?v=2" defer></script>
</head>
<body>
${NAV}
<main class="guide-wrap">
  <div class="breadcrumbs"><a href="/">Home</a> / Fishing by state</div>
  <h1>Fishing seasons by state</h1>
  <p class="lede">Every state, month by month: which of our ${'species profiles'} list that state's waters, the best months to fish, featured fisheries and the official licence source. Pick your state.</p>
  ${sections}
  <div class="st-state-note"><strong>How these pages are built:</strong> each state page aggregates the species in our database whose ranges include that state's waters, then computes peak months from each species' season window. Honest data — thin states say so. Always verify current regulations with the state agency.</div>
  <div class="action"><h2>Fishing a state we cover thin?</h2><p>Take a photo anyway — the AI fish identifier works on any catch, and every confirmed ID makes the database better.</p><a class="button" href="/fish-id.html">Identify my fish</a></div>
  <footer class="guide-footer"><a href="/whats-biting/">Monthly calendar</a> · <a href="/destinations/">Destinations</a> · <a href="/species/">Species A–Z</a> · <a href="/">Blue Seas Fishing</a></footer>
</main>
<script src="/assets/js/nav-back.js?v=3" defer></script>
</body>
</html>
`;
}

/* ---------------------------------------------------------------- main -- */
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });
let wrote = 0, monthPages = 0, indexableMonthPages = 0;
for (const [code, st] of Object.entries(STATES)) {
  const slug = toSlug(st.name);
  writeFileSync(join(OUT_DIR, `${slug}.html`), statePage(code));
  wrote++;
  // state × month pages (only months where >= MIN_SPECIES species are in season)
  const perMonth = perMonthCounts(byState.get(code) || []);
  const stateDir = join(OUT_DIR, slug);
  const monthsToWrite = perMonth.filter((n) => n >= MIN_SPECIES).length;
  if (monthsToWrite) {
    mkdirSync(stateDir, { recursive: true });
    const indexable = indexableMonths(code, perMonth);
    for (let m = 0; m < 12; m++) {
      if (perMonth[m] < MIN_SPECIES) continue;
      const isIndexable = indexable.has(m);
      writeFileSync(join(stateDir, `${MONTH_NAMES[m].toLowerCase()}.html`), stateMonthPage(code, m, perMonth, isIndexable));
      monthPages++;
      if (isIndexable) indexableMonthPages++;
    }
  }
}
writeFileSync(join(OUT_DIR, 'index.html'), buildHub());
// Month map consumed by generate-monthly.mjs to add "in season by state" links.
const monthMap = {};
for (const [code, st] of Object.entries(STATES)) {
  const perMonth = perMonthCounts(byState.get(code) || []);
  const months = {};
  perMonth.forEach((n, m) => { if (n >= MIN_SPECIES) months[MONTH_NAMES[m].toLowerCase()] = n; });
  if (Object.keys(months).length) monthMap[toSlug(st.name)] = { name: st.name, months };
}
writeFileSync(join(ROOT, '.states-month-map.json'), JSON.stringify(monthMap));
// State -> species slug list (consumed by generate-newsletter.mjs; single source
// of truth for state/species matching, so the newsletter never re-derives it).
const stateSpeciesOut = {};
for (const [code, list] of byState) {
  stateSpeciesOut[toSlug(STATES[code].name)] = list
    .map((s) => toSlug(s.name)).filter(Boolean)
    .sort();
}
writeFileSync(join(ROOT, '.state-species.json'), JSON.stringify(stateSpeciesOut));
// State -> licence source (consumed by generate-newsletter.mjs).
const licenceOut = {};
for (const [code, st] of Object.entries(STATES)) {
  licenceOut[toSlug(st.name)] = { url: st.lic.sources[0] || '', label: st.lic.region };
}
writeFileSync(join(ROOT, '.licence-sources.json'), JSON.stringify(licenceOut, null, 1));
// Public states list (deploys — non-dot path) for the subscribe form + PHP validation.
mkdirSync(join(ROOT, 'assets', 'data'), { recursive: true });
writeFileSync(join(ROOT, 'assets', 'data', 'states-list.json'), JSON.stringify(
  Object.entries(STATES).map(([code, st]) => ({ slug: toSlug(st.name), name: st.name, code }))
    .sort((a, b) => a.name.localeCompare(b.name)), null, 1));
const withSpecies = [...byState.keys()].filter((c) => (byState.get(c) || []).length >= MIN_SPECIES);
console.log(`Done: ${wrote} state pages + ${monthPages} state-month pages (${indexableMonthPages} indexable, ${monthPages - indexableMonthPages} noindex duplicates) + hub -> states/ (${byState.size} states matched, ${withSpecies.length} with ${MIN_SPECIES}+ species, ${Object.keys(monthMap).length} in month map)`);


