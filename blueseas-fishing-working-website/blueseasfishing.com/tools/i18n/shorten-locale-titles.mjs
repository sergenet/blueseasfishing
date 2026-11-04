#!/usr/bin/env node
// tools/i18n/shorten-locale-titles.mjs — bring localised titles back under the
// length Google will actually display, without rewriting any translation.
//
// Why this exists (2026-11-04):
//   verify-seo Step 7 measures English titles against 60 chars and fails the
//   build, which is why generators run them through tools/lib/title-fit.mjs.
//   Locale mirrors are only reported, because their length follows the
//   translation, not a template. The result: 6,285 of 7,763 localised titles
//   are over 60 chars, 120 at worst. Spanish and Greek simply need more words
//   than English for the same idea, so most of that is legitimate.
//
//   What is not legitimate is the tail. Every one of those pages still carries
//   the English brand suffix the templates append — 6,052 of the 6,285 end in
//   "| Blue Seas Fishing". Google truncates a title from the end, so on a long
//   title the brand was never displayed; it was simply pushing the words that
//   would have been displayed off the end. Dropping it shortens the title,
//   changes nothing the searcher used to see, and lets the descriptive half
//   ("…: Identifizierung & Fangprofil") show up instead.
//
//   This pass therefore removes ONLY the trailing brand segment. It does not
//   cut words, drop other segments, or ellipsise: on a translated page the
//   remaining words are the query match, and inventing a shorter phrase is
//   editorial work, not a repair. The 916 titles that are still over 60 once
//   the brand is gone are reported, not mangled.
//
// Run:  node tools/i18n/shorten-locale-titles.mjs [--dry-run]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TARGETS, SKIP_DIRS, SKIP_FILES, SKIP_PATTERN } from './config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const DRY = process.argv.includes('--dry-run');

const TITLE_MAX = 60;
// Never leave a title shorter than this: a bare 12-character fragment reads as
// a broken page and loses more than the brand cost.
const TITLE_MIN = 25;

// The brand suffix the templates append, with every separator seen in the tree:
// "| Blue Seas Fishing" (the normalised form), and the "—" / "-" variants the
// older templates and the brand normalisation pass left behind, including a few
// "… - BlueSeasFishing.com" forms. The separator must be surrounded by spaces so
// a hyphen inside a compound word is never treated as one.
const BRAND_TAIL_RE =
  /\s+[|\u2013\u2014-]\s*(?:Blue\s*Seas\s*Fishing|BlueSeasFishing\.com)\s*$/i;

// Character references count as one displayed character, matching verify-seo so
// this pass and the gate agree on what "60 characters" means.
const ENTITY_RE = /&(?:[a-z][a-z0-9]*|#\d+|#x[\da-f]+);/gi;
const plainLen = (s) => String(s).replace(ENTITY_RE, 'X').length;

const walk = (dir) => {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue;
      out.push(...walk(join(dir, e.name)));
    } else if (e.name.endsWith('.html')) {
      if (SKIP_FILES.has(e.name) || SKIP_PATTERN.test(e.name)) continue;
      out.push(join(dir, e.name));
    }
  }
  return out;
};

let scanned = 0, overLimit = 0, shortened = 0, noBrand = 0, stillLong = 0, tooShort = 0;
const leftovers = [];

for (const l of TARGETS) {
  const dir = join(ROOT, l.code);
  for (const abs of walk(dir)) {
    scanned++;
    const html = readFileSync(abs, 'utf8');
    const m = html.match(/<title>([\s\S]*?)<\/title>/i);
    if (!m) continue;
    const title = m[1].replace(/\s+/g, ' ').trim();
    if (plainLen(title) <= TITLE_MAX) continue;
    overLimit++;

    const tail = title.match(BRAND_TAIL_RE);
    if (!tail) {
      noBrand++;
      if (leftovers.length < 5) leftovers.push([plainLen(title), title]);
      continue;
    }
    const rest = title.slice(0, tail.index).replace(/[\s|\u2013\u2014-]+$/, '').trim();
    const restLen = plainLen(rest);
    if (restLen < TITLE_MIN) { tooShort++; continue; }
    // The brand comes off even when the rest is still over the limit. It sits at
    // the very end, so on an over-length title it is already past the cut and
    // never displayed — dropping it shows more of the words that are.
    if (restLen > TITLE_MAX) {
      stillLong++;
      if (leftovers.length < 5) leftovers.push([restLen, rest]);
    }

    const out = html.replace(m[0], `<title>${rest}</title>`);
    if (!DRY) writeFileSync(abs, out);
    shortened++;
  }
}

console.log(`${DRY ? '[dry-run] ' : ''}localised title length (max ${TITLE_MAX}):`);
console.log(`  pages scanned            : ${scanned}`);
console.log(`  over ${TITLE_MAX} chars            : ${overLimit}`);
console.log(`  shortened (brand removed): ${shortened}`);
console.log(`  kept (still long w/o brand): ${stillLong}`);
console.log(`  kept (no brand suffix)   : ${noBrand}`);
if (tooShort) console.log(`  kept (would be < ${TITLE_MIN} chars): ${tooShort}`);
if (leftovers.length) {
  console.log('  longest kept:');
  for (const [n, t] of leftovers.sort((a, b) => b[0] - a[0])) {
    console.log(`    ${String(n).padStart(3)}  ${t.slice(0, 100)}`);
  }
}
