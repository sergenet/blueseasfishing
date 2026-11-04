#!/usr/bin/env node
/**
 * localize-species-meta.mjs — give every translated species page a description
 * in its own language.
 *
 * Why this exists
 * ---------------
 * The mirrors were built by transform.mjs, which translates <meta content> for
 * names in META_TEXT. Titles came out localised, but every one of the 3,843
 * species mirrors still carried the ENGLISH description, e.g. on the German
 * cod page:
 *
 *   <title>Atlantischer Kabeljau: Identifizierung & Fangprofil | ...</title>
 *   <meta name="description" content="Atlantic Cod (Gadus morhua) — Saltwater
 *         species profile: Reefs, rock piles, wrecks, ledges; from nearshore to
 *         deep. Baits: Jigs, bait rigs (squid, herring).">
 *
 * A German query answered by a German title over an English snippet is the
 * likely cause of 2,004 impressions and ~0 clicks on that page.
 *
 * Why it composes instead of translating
 * --------------------------------------
 * Two reasons not to run the English string through MT:
 *   1. The English source is itself broken — generate-species-pages.mjs cuts at
 *      158 chars and appends "...", so many read "Species-depe..". Translating
 *      that translates garbage.
 *   2. The page body is ALREADY translated: "Lebensraum und Verbreitungsgebiet"
 *      holds proper German habitat text. So we promote text that already exists
 *      rather than paying for a translation that would be worse.
 *
 * Grammar safety: the species name is taken from the breadcrumb, which is the
 * nominative form the site already uses ("Atlantischer Kabeljau", not the h1's
 * accusative "einen Atlantischen Kabeljau"), so it drops into a "Name: ..."
 * label without case surgery.
 *
 * Idempotent: re-running rewrites the same string. Pass --dry-run to preview.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DRY = process.argv.includes('--dry-run');
const BACKUP = join(dirname(fileURLToPath(import.meta.url)), 'species-meta-backup.json');
const MAX = 158; // Google truncates around 155-160 chars.

/** This tree is not under version control, so keep the originals on disk
 *  before the first write and offer a one-command rollback. */
function saveBackup(map) {
  // Merge, never replace: a later run that touches only some locales must not
  // wipe the originals recorded by an earlier run.
  let prev = {};
  if (existsSync(BACKUP)) {
    try { prev = JSON.parse(readFileSync(BACKUP, 'utf8')); } catch { prev = {}; }
  }
  const merged = { ...prev, ...map };
  writeFileSync(BACKUP, JSON.stringify(merged));
  console.log(`backup written: ${BACKUP} (${Object.keys(merged).length} pages)`);
}
function restore(html, oldDesc, newDesc) {
  const a = escapeAttr(newDesc), b = escapeAttr(oldDesc);
  let out = html.split(a).join(b);
  const jn = newDesc.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const jo = oldDesc.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return out.split(jn).join(jo);
}

// Locale → how a description reads. `lead` is the word before the habitat
// clause; `tail` is the fixed closing benefit phrase. Kept short so the habitat
// text (the informative part) has room.
const STYLE = {
  // English is composed too: generate-species-pages.mjs used to hard-cut at 158
  // chars mid-word, so ~a third of the 549 indexed pages ended in "Species-depe..".
  en: { lead: 'Habitat:', tail: 'Baits, season and where to catch it.', short: 'Baits and best season.', env: true },
  de: { lead: 'Lebensraum:', tail: 'Köder, beste Jahreszeit und Fanggebiete.', short: 'Köder und beste Jahreszeit.' },
  es: { lead: 'Hábitat:', tail: 'Cebos, mejor temporada y dónde pescarlo.', short: 'Cebos y mejor temporada.' },
  fr: { lead: 'Habitat\u00a0:', tail: 'Appâts, meilleure saison et lieux de pêche.', short: 'Appâts et meilleure saison.' },
  pt: { lead: 'Habitat:', tail: 'Iscas, melhor época e onde pescar.', short: 'Iscas e melhor época.' },
  ru: { lead: 'Среда обитания:', tail: 'Приманки, лучший сезон и места ловли.', short: 'Приманки и сезон ловли.' },
  el: { lead: 'Βιότοπος:', tail: 'Δολώματα, καλύτερη εποχή και τόποι αλιείας.', short: 'Δολώματα και εποχή.' },
  ar: { lead: 'الموطن:', tail: 'الطُعوم وأفضل موسم وأماكن الصيد.', short: 'الطُعوم والموسم.' },
};

const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const unescape = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Spanish/Portuguese habitat strings arrive with a trailing full stop. */
function tidyClause(s) {
  return String(s).replace(/[\s.;,·]+$/u, '').trim();
}

/** Cut a clause list at a separator so it fits `budget`, never mid-word. */
function fitClause(text, budget) {
  if (text.length <= budget) return text;
  // Include the Arabic comma/semicolon: without them every Arabic page whose
  // habitat clause was too long fell through to the name-only fallback.
  const seps = ['; ', ', ', ' — ', ' – ', '، ', '؛ ', '· '];
  for (const sep of seps) {
    let cut = text.lastIndexOf(sep, budget);
    while (cut > 20) {
      const piece = text.slice(0, cut).trim();
      if (piece.length >= 20) return piece;
      cut = text.lastIndexOf(sep, cut - 1);
    }
  }
  // No clean break: give up on the clause rather than truncate a word.
  return text.length <= budget ? text : null;
}

function buildDescription(name, habitat, style, env) {
  const hab = tidyClause(habitat || '');
  // English keeps the saltwater/freshwater word: it is a real search modifier
  // and the original snippet carried it.
  const lead = style.env && env
    ? `${env} ${style.lead.charAt(0).toLowerCase()}${style.lead.slice(1)}`
    : style.lead;
  // Try the full closing phrase first; if the habitat then leaves no room, drop
  // to the short closing phrase so the informative clause survives.
  for (const tailText of [style.tail, style.short]) {
    if (!hab) break;
    const head = `${name}. ${lead} `;
    const tail = ` ${tailText}`;
    const budget = MAX - head.length - tail.length - 1; // -1 for the closing period
    const fitted = fitClause(hab, budget);
    if (fitted && fitted.length >= 20) {
      const out = `${head}${fitted}.${tail}`;
      if (out.length <= MAX) return out;
    }
  }
  // No room for the habitat: lead with the name and the benefit only.
  const short = `${name}: ${style.tail}`;
  return short.length <= MAX ? short : name.slice(0, MAX);
}

function extract(html) {
  const sciM = html.match(/<p class="scientific">([\s\S]*?)<\/p>/);
  const sci = sciM ? unescape(strip(sciM[1])) : null;
  const nameM = html.match(/<div class="breadcrumbs">([\s\S]*?)<\/div>/);
  let name = null;
  if (nameM) {
    // The species name is whatever follows the last link. Some locales emit a
    // literal " / " separator before it, some don't (Arabic pages vary), so
    // anchor on the closing </a> rather than on the slash.
    const segs = nameM[1].split(/<\/a>/i);
    const tail = segs.length > 1 ? segs[segs.length - 1] : segs[0];
    name = unescape(strip(tail)).replace(/^\/\s*/, '').replace(/^\s*\/\s*/, '').trim() || null;
  }
  let env = null;
  const factPos = html.indexOf('class="sp-facts"');
  if (factPos !== -1) {
    const chunk = html.slice(factPos, factPos + 900);
    const em = chunk.match(/<div><strong>[\s\S]*?<\/strong>([\s\S]*?)<\/div>/);
    if (em) env = unescape(strip(em[1]));
  }
  let habitat = null;
  const facts = html.indexOf('class="sp-facts"');
  if (facts !== -1) {
    const h2 = html.indexOf('<h2', facts);
    if (h2 !== -1) {
      const p = html.indexOf('<p>', h2);
      const end = p === -1 ? -1 : html.indexOf('</p>', p);
      if (p !== -1 && end !== -1) habitat = unescape(strip(html.slice(p + 3, end)));
    }
  }
  return { name, habitat, sci, env };
}

function currentDescription(html) {
  const m = html.match(/<meta name="description" content="([^"]*)"/);
  return m ? m[1] : null;
}

/** Rewrite the four places the description appears, each with its own escaping. */
function rewrite(html, oldDesc, newDesc) {
  const attrOld = escapeAttr(oldDesc);
  const attrNew = escapeAttr(newDesc);
  let out = html;
  out = out.replace(
    /(<meta name="description" content=")([^"]*)(")/,
    (m, a, _v, c) => a + attrNew + c,
  );
  out = out.replace(
    /(<meta property="og:description" content=")([^"]*)(")/,
    (m, a, _v, c) => a + attrNew + c,
  );
  out = out.replace(
    /(<meta name="twitter:description" content=")([^"]*)(")/,
    (m, a, _v, c) => a + attrNew + c,
  );
  // JSON-LD carries the same sentence; it is JSON, so only quotes/backslashes
  // need escaping (not HTML entities), and only if it still holds the English.
  const jsonOld = oldDesc.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  if (jsonOld && out.includes(jsonOld)) {
    const jsonNew = newDesc.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    out = out.split(jsonOld).join(jsonNew);
  }
  return out;
}

/** English lives at the web root (species/), mirrors at <locale>/species/. */
const speciesDir = (code) => (code === 'en' ? join(ROOT, 'species') : join(ROOT, code, 'species'));

/** The A–Z hub is not a species page: it has no breadcrumb name and no habitat,
 *  so composing from them produced "A–Z index: Baits, season and...". */
const INDEX_DESC = {
  en: 'Every fish species A–Z: identification features, habitat, baits and best season, with links to fishing destinations and state calendars.',
  de: 'Alle Fischarten von A–Z: Merkmale, Lebensraum, Köder und beste Fangzeit — mit Links zu Revieren und Angelkalendern der Bundesstaaten.',
  es: 'Todas las especies de peces de la A a la Z: rasgos, hábitat, cebos y mejor temporada, con enlaces a destinos y calendarios estatales.',
  fr: 'Toutes les espèces de poissons de A à Z : identification, habitat, appâts et meilleure saison, avec liens vers les destinations et calendriers.',
  pt: 'Todas as espécies de peixes de A a Z: identificação, habitat, iscas e melhor época, com links para destinos e calendários estaduais.',
  ru: 'Все виды рыб от А до Я: признаки, среда обитания, приманки и лучший сезон — со ссылками на места ловли и календари штатов.',
  el: 'Όλα τα είδη ψαριών από Α έως Ω: χαρακτηριστικά, βιότοπος, δολώματα και καλύτερη εποχή, με συνδέσμους σε προορισμούς και ημερολόγια.',
  ar: 'كل أنواع الأسماك من الألف إلى الياء: السمات والموطن والطُعوم وأفضل موسم، مع روابط للوجهات وتقاويم الصيد.',
};

const locales = Object.keys(STYLE);
const stats = {};
const samples = [];
const backups = {};

/** Some pages carry an English description in their JSON-LD that is worded
 *  differently from the (longer, untruncated) meta one, so the string swap in
 *  rewrite() never matched it. This pass simply makes the structured-data
 *  description equal the localised meta description. Idempotent. */
if (process.argv.includes('--fix-ld')) {
  let fixed = 0;
  for (const code of Object.keys(STYLE)) {
    const dir = speciesDir(code);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.html')) continue;
      const path = join(dir, file);
      const html = readFileSync(path, 'utf8');
      const desc = currentDescription(html);
      if (!desc) continue;
      const out = html.replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)/, (block) => {
        const jsonDesc = desc.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return block.replace(/"description":"(?:[^"\\]|\\.)*"/, `"description":"${jsonDesc}"`);
      });
      if (out !== html) { writeFileSync(path, out); fixed++; }
    }
  }
  console.log(`json-ld description aligned on ${fixed} pages`);
  process.exit(0);
}

if (process.argv.includes('--restore')) {
  const map = JSON.parse(readFileSync(BACKUP, 'utf8'));
  let n = 0;
  for (const [rel, oldDesc] of Object.entries(map)) {
    const path = join(ROOT, rel);
    if (!existsSync(path)) continue;
    const html = readFileSync(path, 'utf8');
    const cur = currentDescription(html);
    if (!cur || cur === oldDesc) continue;
    writeFileSync(path, restore(html, oldDesc, cur));
    n++;
  }
  console.log(`restored ${n} pages from backup`);
  process.exit(0);
}

for (const code of locales) {
  const dir = speciesDir(code);
  if (!existsSync(dir)) { stats[code] = 'missing'; continue; }
  let written = 0, unchanged = 0, skipped = 0;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.html')) continue;
    const path = join(dir, file);
    const html = readFileSync(path, 'utf8');
    const old = currentDescription(html);
    if (file === 'index.html') {
      const want = INDEX_DESC[code];
      if (!want || !old || old === want) { unchanged++; continue; }
      const updated = rewrite(html, old, want);
      if (updated !== html) {
        if (!DRY) {
          backups[code === 'en' ? `species/${file}` : `${code}/species/${file}`] = old;
          writeFileSync(path, updated);
        }
        written++;
      }
      continue;
    }
    const { name, habitat, sci, env } = extract(html);
    if (!name || !old) { skipped++; continue; }
    // The English profile keeps the scientific name in the snippet, as the
    // original generator did; it is the one token every locale shares.
    const display = code === 'en' && sci ? `${name} (${sci})` : name;
    const next = buildDescription(display, habitat, STYLE[code], env);
    if (!next || next === old) { unchanged++; continue; }
    const updated = rewrite(html, old, next);
    if (updated === html) { skipped++; continue; }
    if (samples.filter((s) => s.code === code).length < 3) {
      samples.push({ code, file, name, old, next });
    }
    if (!DRY) {
      backups[code === 'en' ? `species/${file}` : `${code}/species/${file}`] = old;
      writeFileSync(path, updated);
    }
    written++;
  }
  stats[code] = { written, unchanged, skipped };
}

for (const s of samples) {
  console.log(`[${s.code}] ${s.file}`);
  console.log(`   name: ${s.name}`);
  console.log(`   old : ${s.old}`);
  console.log(`   new : ${s.next}   (${s.next.length})`);
}
if (!DRY && Object.keys(backups).length) saveBackup(backups);
console.log(DRY ? '\nDRY RUN — nothing written' : '\nwritten');
console.log(JSON.stringify(stats));
