#!/usr/bin/env node
/**
 * add-adsense.mjs — puts Google AdSense on the content pages that never had it.
 *
 * Why this exists: the site has loaded the AdSense script for months but has
 * never contained a single <ins class="adsbygoogle"> slot, and the loader is
 * only on a handful of pages. Net position: zero ad impressions, ever.
 *
 * What it does, per page (idempotent — safe to re-run):
 *   1. ensures the AdSense loader + /assets/js/ad-gate.js are in <head>
 *   2. inserts one in-article responsive unit before the page's main content ends
 *   3. inserts one footer unit before </body>
 *
 * Slot IDs are read from money-config.js → BSF_MONEY_CONFIG.ADS.SLOTS.
 * While a slot ID is empty its unit is skipped, but the loader is still added,
 * which is what allows AdSense Auto ads to fill those pages.
 *
 * Usage: node tools/add-adsense.mjs [--dry-run] [--only species]
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const ONLY = args.indexOf('--only') >= 0 ? args[args.indexOf('--only') + 1] : null;
const VERBOSE = args.includes('--verbose');
// --root lets the injection logic be exercised against a fixture copy of the
// site instead of the real tree (used to verify placement without publishing).
const ROOT = args.indexOf('--root') >= 0 ? args[args.indexOf('--root') + 1] : join(HERE, '..');

// ---- monetisation config (same loader pattern generate-destinations.mjs uses) ----
let MONEY = null;
try {
  const fakeWindow = {};
  new Function('window', readFileSync(join(ROOT, 'money-config.js'), 'utf8'))(fakeWindow);
  MONEY = fakeWindow.BSF_MONEY_CONFIG || null;
} catch (e) {
  console.error(`! could not load money-config.js: ${e.message}`);
  process.exit(1);
}
const ADS = (MONEY && MONEY.ADS) || {};
const CLIENT = ADS.CLIENT || '';
const SLOTS = { ...(ADS.SLOTS || {}) };

// --slots inArticle=1234,footer=5678  overrides money-config for one run.
const slotArg = args.indexOf('--slots') >= 0 ? args[args.indexOf('--slots') + 1] : null;
if (slotArg) {
  for (const pair of slotArg.split(',')) {
    const [k, v] = pair.split('=');
    if (k && v) SLOTS[k.trim()] = v.trim();
  }
}
if (!CLIENT) {
  console.error('! money-config.js has no ADS.CLIENT — nothing to do');
  process.exit(1);
}

const LOADER = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}" crossorigin="anonymous"></script>`;
const GATE = `<script src="/assets/js/ad-gate.js?v=1" defer></script>`;

// A unit reserves its own height so inserting it cannot push content down
// after the visitor has started reading (no layout shift).
function unit(slotId, label, adLabel = 'Advertisement') {
  if (!slotId) return '';
  return `<div class="ad-slot" data-ad-placement="${label}" style="margin:22px auto;max-width:728px;min-height:90px;text-align:center;overflow:hidden">
<span style="display:block;font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.55;margin-bottom:4px">${adLabel}</span>
<ins class="adsbygoogle" style="display:block" data-ad-client="${CLIENT}" data-ad-slot="${slotId}" data-ad-format="auto" data-full-width-responsive="true"></ins>
<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>
</div>`;
}

// AdSense requires an ad to be clearly distinguishable from editorial content,
// so the unit carries its own label. An English "Advertisement" on a Russian or
// Arabic page reads as a bug, so each translated mirror gets the local word.
const AD_LABEL = {
  ar: 'إعلان',
  de: 'Anzeige',
  el: 'Διαφήμιση',
  es: 'Anuncio',
  fr: 'Publicité',
  pt: 'Publicidade',
  ru: 'Реклама'
};
const LOCALES = Object.keys(AD_LABEL);

// Unit markup per language: key '' is the English site, every other key is a
// translated mirror directory (es/, de/, ...).
const UNITS = {};
for (const loc of ['', ...LOCALES]) {
  const lbl = AD_LABEL[loc] || 'Advertisement';
  UNITS[loc] = {
    inArticle: unit(SLOTS.inArticle, 'in-article', lbl),
    footer: unit(SLOTS.footer, 'footer', lbl)
  };
}

/** '' for the English site, or the locale prefix of a translated mirror. */
function localeOf(rel) {
  const first = rel.split('/')[0];
  return LOCALES.includes(first) ? first : '';
}

// ---- which pages get ads: content templates only, never utility/legal pages ----
const CONTENT_DIRS = ['species', 'states', 'destinations', 'whats-biting', 'fish-size-charts', 'guides'];
const COMPARISON_RE = /-vs-[a-z-]+-identification\.html$|-identification\.html$/;
// Hand-written editorial pages that sit at the site root instead of in a
// template directory. They are the article/tips/shop/commerce pages, so they
// are every bit as monetisable as the generated templates — before this list they
// carried Auto ads only (the loader and nothing else), which on a page with no
// fixed unit is often no ads at all.
const HANDWRITTEN_CONTENT = new Set([
  'fish-id.html', // footer unit only — see FOOTER_ONLY
  'blog.html',
  'gallery.html',
  'shop.html',
  'community.html',
  'recommended-fishing-gear.html',
  'tips-baits-lures.html',
  'tips-beginner-knots.html',
  'tips-deep-sea-techniques.html',
  'tips-gear-setup.html',
  'tips-safety-ethics.html',
  'tips-seasonal-guide.html',
  'tips-tackle-box-essentials.html'
]);

// Pages that get the footer unit only. fish-id.html is the AI identification
// tool: its <main> opens with the upload widget, so the in-article anchor (the
// last paragraph before the first <h2>) sits ABOVE the primary action and would
// push the thing the visitor came for below an ad. The footer anchor is at the
// end of <main>, under the explanatory section that follows the tool, which is
// the one place on the page where a unit is additive rather than obstructive.
const FOOTER_ONLY = new Set(['fish-id.html']);
const SKIP_RE = /^(premium|contact|cookies|privacy|terms|404|checkout|thank-you)\.html$/i;
// Locale directories are NOT skipped: the translated mirrors are full copies of
// the same templates, and leaving them without units made 7 of the site's 8
// language versions unmonetisable.
const SKIP_DIRS = new Set(['tools', 'assets', 'api', 'config', 'backup-p0-20261031-214210', '_originals-webp', 'ios-project', 'icons', 'images', 'includes']);

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name.startsWith('backup-')) continue;
    const abs = join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      yield* walk(abs);
    } else if (e.name.endsWith('.html')) {
      yield abs;
    }
  }
}

function isContentPage(rel) {
  // A translated mirror repeats the English layout one level down
  // (es/species/x.html), so judge the path as if the locale prefix were absent.
  const rest = localeOf(rel) ? rel.split('/').slice(1).join('/') : rel;
  const parts = rest.split('/');
  const file = parts[parts.length - 1];
  if (SKIP_RE.test(file)) return false;
  if (parts.length > 1 && CONTENT_DIRS.includes(parts[0])) return true;
  if (parts.length === 1 && COMPARISON_RE.test(file)) return true;
  if (parts.length === 1 && HANDWRITTEN_CONTENT.has(file)) return true;
  return false;
}

// The main content region, so anchors are only ever looked for inside it.
function mainRegion(html) {
  const open = html.match(/<main[^>]*>/i);
  if (!open) return null;
  const start = open.index + open[0].length;
  const end = html.toLowerCase().indexOf('</main>', start);
  if (end < 0) return null;
  return { start, end };
}

/**
 * Where the in-article unit belongs: at the end of the article's intro, i.e.
 * after the last paragraph that closes before the first <h2> section. That is
 * inside the prose the visitor is reading, not below the article.
 *
 * On a page with no <h2> at all (gallery.html is a photo grid with an intro
 * paragraph and no sections) "last paragraph before the first section" resolves
 * to the very last paragraph, which would drop the "in-article" unit at the
 * foot of the page next to the footer unit. There the intro IS the first
 * paragraph, so that is the anchor used.
 * Returns null when the page has no usable prose anchor.
 */
function inArticleOffset(html) {
  const reg = mainRegion(html);
  const from = reg ? reg.start : 0;
  const to = reg ? reg.end : html.length;
  const seg = html.slice(from, to);
  const h2 = seg.search(/<h2[\s>]/i);
  const introEnd = h2 < 0 ? seg.length : h2;
  // Last </p> that closes within the intro block, and the first one overall.
  const closing = /<\/p>/gi;
  let m, lastP = -1, firstP = -1;
  while ((m = closing.exec(seg)) && m.index < introEnd) {
    if (firstP < 0) firstP = m.index + m[0].length;
    lastP = m.index + m[0].length;
  }
  if (h2 < 0 && firstP > 0) return { at: from + firstP, anchor: 'after first paragraph' };
  if (lastP > 0) return { at: from + lastP, anchor: 'end of intro paragraph' };
  if (h2 >= 0) return { at: from + h2, anchor: 'before first section' };
  return null;
}

/**
 * Where the footer unit belongs: immediately above the page footnote, or at the
 * end of <main>. Never after the footer, where it reads as part of the boilerplate.
 */
function footerOffset(html) {
  const reg = mainRegion(html);
  if (reg) {
    const seg = html.slice(reg.start, reg.end);
    const f = seg.search(/<footer[\s>]/i);
    if (f >= 0) return { at: reg.start + f, anchor: 'above footer' };
    return { at: reg.end, anchor: 'end of main' };
  }
  const f = html.search(/<footer[\s>]/i);
  if (f >= 0) return { at: f, anchor: 'above footer' };
  const b = html.lastIndexOf('</body>');
  return b >= 0 ? { at: b, anchor: 'before </body>' } : null;
}

function insertAt(html, snippet, at) {
  return html.slice(0, at) + '\n' + snippet + '\n' + html.slice(at);
}

const placed = { inArticle: {}, footer: {} };
function note(kind, anchor) {
  const k = kind + ':' + anchor;
  placed[kind === 'in-article' ? 'inArticle' : 'footer'][anchor] =
    (placed[kind === 'in-article' ? 'inArticle' : 'footer'][anchor] || 0) + 1;
}

// Two units a few lines apart read as ad clutter, and on a short page the
// in-article anchor and the footer anchor can collapse to nearly the same
// place (gallery.html and community.html have almost no prose after their
// intro). When that happens the in-article unit is dropped and the footer unit
// carries the page on its own, rather than shipping a double stack.
const MIN_UNIT_GAP = 500;

function unitsTooClose(html) {
  const a = inArticleOffset(html);
  const b = footerOffset(html);
  return !!(a && b) && b.at - a.at < MIN_UNIT_GAP;
}

function injectInArticle(html, rel) {
  const snippet = UNITS[localeOf(rel)].inArticle;
  if (!snippet) return html;
  if (html.includes('data-ad-placement="in-article"')) return html;
  if (unitsTooClose(html)) {
    crowded++;
    if (VERBOSE) console.log(`  ~ in-article skipped, only ${MIN_UNIT_GAP}px of content before the footer unit: ${rel}`);
    return html;
  }
  const spot = inArticleOffset(html);
  if (!spot) {
    if (VERBOSE) console.log(`  ! no in-article anchor: ${rel}`);
    return html;
  }
  note('in-article', spot.anchor);
  if (VERBOSE) console.log(`  + in-article @ ${spot.anchor}: ${rel}`);
  return insertAt(html, snippet, spot.at);
}

function injectFooter(html, rel) {
  const snippet = UNITS[localeOf(rel)].footer;
  if (!snippet) return html;
  if (html.includes('data-ad-placement="footer"')) return html;
  const spot = footerOffset(html);
  if (!spot) {
    if (VERBOSE) console.log(`  ! no footer anchor: ${rel}`);
    return html;
  }
  note('footer', spot.anchor);
  if (VERBOSE) console.log(`  + footer @ ${spot.anchor}: ${rel}`);
  return insertAt(html, snippet, spot.at);
}

function injectHead(html) {
  let out = html;
  if (!out.includes('pagead2.googlesyndication.com')) {
    const head = out.match(/<head[^>]*>/i);
    if (head) {
      const at = head.index + head[0].length;
      out = out.slice(0, at) + '\n' + LOADER + '\n' + GATE + out.slice(at);
    }
  } else if (!out.includes('ad-gate.js') && CLIENT) {
    // loader already there (e.g. homepage) — make sure the premium gate is too
    const head = out.match(/<head[^>]*>/i);
    if (head) {
      const at = head.index + head[0].length;
      out = out.slice(0, at) + '\n' + GATE + out.slice(at);
    }
  }
  return out;
}

let scanned = 0, changed = 0, already = 0, crowded = 0;
const examples = [];
for (const abs of walk(ROOT)) {
  const rel = relative(ROOT, abs).replace(/\\/g, '/');
  if (!isContentPage(rel)) continue;
  if (ONLY && !rel.startsWith(ONLY)) continue;
  scanned++;
  const before = readFileSync(abs, 'utf8');
  let after = injectHead(before);
  if (!FOOTER_ONLY.has(rel.split('/').pop())) after = injectInArticle(after, rel);
  after = injectFooter(after, rel);
  if (after === before) { already++; continue; }
  changed++;
  if (examples.length < 3) examples.push(rel);
  if (!DRY) writeFileSync(abs, after);
}

console.log(`${DRY ? '[dry run] ' : ''}content pages scanned: ${scanned}`);
console.log(`  updated: ${changed}`);
console.log(`  already correct: ${already}`);
if (examples.length) console.log(`  e.g. ${examples.join(', ')}`);
console.log(`  loader: ${CLIENT}  in-article slot: ${SLOTS.inArticle || '(unset — loader only)'}  footer slot: ${SLOTS.footer || '(unset)'}`);
if (!SLOTS.inArticle && !SLOTS.footer) {
  console.log('  NOTE: no slot IDs set, so only the loader was added. That is enough for Auto ads;');
  console.log('        paste slot IDs into money-config.js ADS.SLOTS and re-run to add fixed units.');
}
if (SLOTS.inArticle) console.log('  in-article placement:', JSON.stringify(placed.inArticle));
if (SLOTS.footer) console.log('  footer placement:   ', JSON.stringify(placed.footer));
if (crowded) console.log(`  in-article units skipped to avoid a double stack: ${crowded}`);
