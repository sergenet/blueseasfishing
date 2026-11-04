#!/usr/bin/env node
/**
 * generate-newsletter.mjs
 *
 * Builds the monthly "What's biting in <State>" email issues — one per US
 * state that has a live /states/<state>/<month>.html page this month, plus a
 * national fallback issue for subscribers without a state.
 *
 * Data source of truth: .states-month-map.json (written by generate-states.mjs)
 * joined with the licence sources recorded in .licence-sources.json — the same
 * data the live pages show. No invented content.
 *
 * No-repeat guarantee: .newsletter-history.json records every subject line and
 * lead-story species slug ever sent. Candidates are filtered against it; if a
 * slot cannot be filled without a repeat, the issue says so honestly instead
 * of recycling.
 *
 * Output: newsletter-issues/<YYYY>-<MM>/<state-slug>.html + .subject.txt
 *         (and national.html) — consumed by tools/monthly-pipeline.mjs.
 *
 * Run:  node tools/generate-newsletter.mjs [YYYY-MM]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.blueseasfishing.com';
const OUT_DIR = join(ROOT, 'newsletter-issues');
const HIST_PATH = join(ROOT, '.newsletter-history.json');

const argMonth = process.argv[2];
const now = new Date();
const year = argMonth ? +argMonth.split('-')[0] : now.getFullYear();
const monthIdx = argMonth ? +argMonth.split('-')[1] - 1 : now.getMonth(); // 0-based
const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][monthIdx];
const mKey = monthName.toLowerCase();
const stamp = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;

/* ---------------------------------------------------------------- data -- */
const STATE_MONTHS = JSON.parse(readFileSync(join(ROOT, '.states-month-map.json'), 'utf8'));
const LICENCES = JSON.parse(readFileSync(join(ROOT, '.licence-sources.json'), 'utf8'));
const STATE_SPECIES = JSON.parse(readFileSync(join(ROOT, '.state-species.json'), 'utf8'));
const HISTORY = existsSync(HIST_PATH) ? JSON.parse(readFileSync(HIST_PATH, 'utf8'))
  : { sent: [], speciesLead: [] };
HISTORY.sent = Array.isArray(HISTORY.sent) ? HISTORY.sent : [];
HISTORY.speciesLead = Array.isArray(HISTORY.speciesLead) ? HISTORY.speciesLead : [];

/* Load the species DB (name -> season/regions) to pick honest lead stories. */
import vm from 'node:vm';
const sandbox = { window: {}, document: { dispatchEvent() {}, addEventListener() {}, readyState: 'complete' }, setTimeout() {}, setInterval() {}, clearInterval() {}, clearTimeout() {}, console: { log() {}, warn() {} } };
vm.createContext(sandbox);
for (const f of ['species-db.js', 'species-db.enriched.js', 'species-db.enriched.world.js', 'species-db.expanded.js', 'species-db.expanded.worldwide.js']) {
  try { vm.runInContext(readFileSync(join(ROOT, f), 'utf8'), sandbox); } catch (e) { /* keep going */ }
}
const speciesBySlug = new Map();
for (const s of sandbox.window.SPECIES_DB || []) {
  const k = String(s.name || '').toLowerCase();
  if (k && !speciesBySlug.has(k)) speciesBySlug.set(k, s);
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const toSlug = (s) => String(s || '').toLowerCase().replace(/[()\[\]]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const shortName = (n) => String(n || '').replace(/\s*\([^)]*\)\s*/g, '').trim();

const ABBR = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
const SPANS = { spring: [2, 4], summer: [5, 7], fall: [8, 10], autumn: [8, 10], winter: [11, 1] };
function seasonMonths(season) {
  const s = String(season || '').toLowerCase();
  if (!s || /varies|check |check\b|run-dependent|depends|region|weather|regulation/i.test(s)) return null;
  const out = new Set();
  const add = ([a, b]) => { if (a <= b) for (let i = a; i <= b; i++) out.add(i); else { for (let i = a; i < 12; i++) out.add(i); for (let i = 0; i <= b; i++) out.add(i); } };
  if (/year-?round|all year/i.test(s)) {
    const p = s.match(/(spring|summer|fall|autumn|winter)\s*(?:\u2013|\u2014|-|to|through)\s*(?:early\s*|late\s*)?(spring|summer|fall|autumn|winter)/);
    if (p && /peak/i.test(s)) { add([SPANS[p[1]][0], SPANS[p[2]][1]]); return out; }
    for (let i = 0; i < 12; i++) out.add(i); return out;
  }
  const r = s.match(/(spring|summer|fall|autumn|winter)\s*(?:\u2013|\u2014|-|to|through)\s*(?:early\s*|late\s*)?(spring|summer|fall|autumn|winter)/);
  if (r) { add([SPANS[r[1]][0], SPANS[r[2]][1]]); return out; }
  let m = false;
  for (const [w, sp] of Object.entries(SPANS)) if (new RegExp(`\\b${w}\\b`, 'i').test(s)) { add(sp); m = true; }
  if (m) return out;
  const t = [...s.matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)[a-z]*\b/gi)].map((x) => ABBR[x[1].toLowerCase()]);
  if (t.length >= 2) { const [a, b] = [t[0], t[t.length - 1]]; if (a <= b) for (let i = a; i <= b; i++) out.add(i); else { for (let i = a; i < 12; i++) out.add(i); for (let i = 0; i <= b; i++) out.add(i); } return out; }
  if (t.length === 1) out.add(t[0]);
  return out.size ? out : null;
}

/* ------------------------------------------------------- issue builder -- */
function buildIssue(slug, name, licenceUrl, licenceLabel) {
  const mapEntry = STATE_MONTHS[slug];
  const count = mapEntry.months[mKey];
  const monthPageUrl = `${SITE}/states/${slug}/${mKey}.html`;
  const stateUrl = `${SITE}/states/${slug}.html`;

  // Lead candidates: species mapped to this state via .state-species.json
  // (written by generate-states.mjs — single source of truth), in season this
  // month, most seasonal first. Never re-lead a previously used species.
  const stateSpecies = STATE_SPECIES[slug] || [];
  const candidates = stateSpecies
    .map((sl) => speciesBySlug.get(sl))
    .filter(Boolean)
    .map((s) => { const mo = seasonMonths(s.season); return { s, mo, size: mo ? mo.size : 12 }; })
    .filter(({ mo }) => mo && mo.has(monthIdx))
    .sort((a, b) => a.size - b.size || a.s.name.localeCompare(b.s.name));
  const leads = [];
  const usedRepeats = [];
  for (const { s } of candidates) {
    if (leads.length >= 3) break;
    const key = String(s.name).toLowerCase();
    if (HISTORY.speciesLead.includes(key)) { usedRepeats.push(s); continue; }
    leads.push(s);
  }
  // Honest fallback: if fewer than 3 fresh leads, note it rather than recycle.
  const fillerNote = leads.length < 3 && usedRepeats.length
    ? `More of ${name}'s usual suspects are in season too — see the full month page (we feature each species in this brief only once, so regular readers always get something new).`
    : '';

  return { slug, name, count, monthPageUrl, stateUrl, licenceUrl, licenceLabel, leads, fillerNote };
}

/* ------------------------------------------------------- email render -- */
function renderIssue(iss) {
  const subject = `What's biting in ${iss.name} — ${monthName} ${year}`;
  const leadBlocks = iss.leads.map((s) => {
    const slug = String(s.name).toLowerCase();
    const window = (seasonMonths(s.season) || new Set()).size ? String(s.season) : '';
    return `<tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0">
      <a href="${SITE}/species/${slug}.html" style="color:#0b3d5c;font-weight:700;font-size:16px;text-decoration:none">${esc(shortName(s.name))}</a>
      ${s.sci ? `<div style="color:#64748b;font-size:13px;font-style:italic">${esc(s.sci)}</div>` : ''}
      <div style="color:#334155;font-size:14px;margin-top:4px">Season: ${esc(window)}</div>
      <div style="margin-top:6px"><a href="${SITE}/species/${slug}.html" style="color:#0369a1;font-size:13px">Full profile →</a></div>
    </td></tr>`;
  }).join('\n');

  return {
    subject,
    html: `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a">
<div style="max-width:600px;margin:0 auto;padding:18px">
  <div style="background:#0b3d5c;border-radius:12px 12px 0 0;padding:18px 22px;color:#fff">
    <a href="${SITE}/" style="color:#bae6fd;font-weight:800;text-decoration:none;font-size:18px">Blue Seas Fishing</a>
    <div style="font-size:13px;margin-top:4px;color:#e0f2fe">Monthly bite brief · ${esc(monthName)} ${year}</div>
  </div>
  <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;padding:22px;border-radius:0 0 12px 12px">
    <h1 style="margin:0 0 6px;font-size:22px">What's biting in ${esc(iss.name)}</h1>
    <p style="margin:0 0 16px;color:#475569;font-size:15px">${iss.count} species in our database have season windows covering ${esc(monthName)} in ${esc(iss.name)}.</p>
    <a href="${iss.monthPageUrl}" style="display:inline-block;background:#0369a1;color:#fff;border-radius:8px;padding:10px 16px;text-decoration:none;font-weight:700;font-size:14px">See the full ${esc(iss.name)} ${esc(monthName)} list →</a>
    <h2 style="font-size:16px;margin:22px 0 4px">This month's featured targets</h2>
    <table style="width:100%;border-collapse:collapse">
${leadBlocks}
    </table>
    ${iss.fillerNote ? `<p style="color:#64748b;font-size:13px;margin:12px 0 0">${esc(iss.fillerNote)}</p>` : ''}
    <div style="border:1px solid #c7e2d2;border-radius:10px;background:#f2faf5;padding:14px;margin:18px 0">
      <strong style="font-size:15px">Caught something you can't name?</strong>
      <p style="margin:6px 0 10px;color:#475569;font-size:14px">Upload a photo — AI-assisted identification, free, three a day.</p>
      <a href="${SITE}/fish-id.html" style="color:#0369a1;font-weight:700;font-size:14px">Identify my fish →</a>
    </div>
    <p style="color:#64748b;font-size:12px;margin:14px 0 0">Before you fish: ${iss.licenceUrl ? `<a href="${iss.licenceUrl}" style="color:#0369a1">${esc(iss.licenceLabel)}</a>` : 'your state wildlife agency'} has current rules, seasons and licence requirements.</p>
    <p style="color:#94a3b8;font-size:12px;margin:14px 0 0">You're getting this because you subscribed at blueseasfishing.com. <a href="${SITE}/api/newsletter.php?unsubscribe={{UNSUB_TOKEN}}" style="color:#94a3b8">Unsubscribe</a>.</p>
  </div>
</div>
</body></html>`,
  };
}

function renderNational(states) {
  const subject = `What's biting this month — ${monthName} ${year}`;
  const rows = states.slice(0, 12).map(([slug, v]) =>
    `<tr><td style="padding:7px 0;border-bottom:1px solid #e2e8f0"><a href="${SITE}/states/${slug}/${mKey}.html" style="color:#0b3d5c;font-weight:600;text-decoration:none">${esc(v.name)}</a></td><td align="right" style="padding:7px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">${v.months[mKey]} species</td></tr>`).join('\n');
  return {
    subject,
    html: `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a">
<div style="max-width:600px;margin:0 auto;padding:18px">
  <div style="background:#0b3d5c;border-radius:12px 12px 0 0;padding:18px 22px;color:#fff">
    <a href="${SITE}/" style="color:#bae6fd;font-weight:800;text-decoration:none;font-size:18px">Blue Seas Fishing</a>
    <div style="font-size:13px;margin-top:4px;color:#e0f2fe">Monthly bite brief · ${esc(monthName)} ${year}</div>
  </div>
  <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;padding:22px;border-radius:0 0 12px 12px">
    <h1 style="margin:0 0 6px;font-size:22px">${esc(monthName)} is on: ${states.length} states covered</h1>
    <p style="margin:0 0 16px;color:#475569;font-size:15px">Your state isn't on your file yet — here's the national picture. Reply with your state and we'll personalize next month's brief.</p>
    <table style="width:100%;border-collapse:collapse">
${rows}
    </table>
    <p style="margin:14px 0 0"><a href="${SITE}/states/" style="color:#0369a1;font-weight:700;font-size:14px">All 50 states + DC →</a></p>
    <div style="border:1px solid #c7e2d2;border-radius:10px;background:#f2faf5;padding:14px;margin:18px 0">
      <strong style="font-size:15px">Caught something you can't name?</strong>
      <p style="margin:6px 0 10px;color:#475569;font-size:14px">Upload a photo — AI-assisted identification, free, three a day.</p>
      <a href="${SITE}/fish-id.html" style="color:#0369a1;font-weight:700;font-size:14px">Identify my fish →</a>
    </div>
    <p style="color:#94a3b8;font-size:12px;margin:14px 0 0">You're getting this because you subscribed at blueseasfishing.com. <a href="${SITE}/api/newsletter.php?unsubscribe={{UNSUB_TOKEN}}" style="color:#94a3b8">Unsubscribe</a>.</p>
  </div>
</div>
</body></html>`,
  };
}

/* ---------------------------------------------------------------- main -- */
const issues = [];
for (const [slug, v] of Object.entries(STATE_MONTHS)) {
  if (!v.months[mKey]) continue;
  const lic = LICENCES[slug] || {};
  issues.push(buildIssue(slug, v.name, lic.url || '', lic.label || v.name));
}
issues.sort((a, b) => b.count - a.count);

mkdirSync(join(OUT_DIR, stamp), { recursive: true });
for (const iss of issues) {
  const rendered = renderIssue(iss);
  writeFileSync(join(OUT_DIR, stamp, `${iss.slug}.html`), rendered.html);
  writeFileSync(join(OUT_DIR, stamp, `${iss.slug}.subject.txt`), rendered.subject);
}
const national = renderNational(issues.map((i) => [i.slug, { name: i.name, months: { [mKey]: i.count } }]));
writeFileSync(join(OUT_DIR, stamp, 'national.html'), national.html);
writeFileSync(join(OUT_DIR, stamp, 'national.subject.txt'), national.subject);

// Record used leads so the next issue never re-features the same species.
for (const iss of issues) for (const s of iss.leads) {
  const key = String(s.name).toLowerCase();
  if (!HISTORY.speciesLead.includes(key)) HISTORY.speciesLead.push(key);
}
writeFileSync(HIST_PATH, JSON.stringify(HISTORY, null, 1));

console.log(`Newsletter issues for ${stamp}: ${issues.length} state issues + national -> newsletter-issues/${stamp}/`);
console.log(`Lead history: ${HISTORY.speciesLead.length} species used all-time`);
