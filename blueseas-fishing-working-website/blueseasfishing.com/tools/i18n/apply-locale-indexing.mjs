#!/usr/bin/env node
// tools/i18n/apply-locale-indexing.mjs — re-stamp the whole site's head policy
// from config.mjs INDEXABLE, with no translation and no MT spend.
//
// Why this exists (2026-11-01):
//   Changing INDEXABLE changes the head of every page: dropped locales gain
//   `noindex,follow` and lose their hreflang cluster, indexable pages must drop
//   the dropped locales from theirs. transform.mjs would produce exactly this
//   on the next full build — but a full build pays for a re-mirror of ~7,700
//   pages and rewrites translated bodies that did not change. This pass makes
//   the same decision with the same shared helpers (tools/i18n/head.mjs),
//   touching only <head>, so it is deterministic, idempotent and free.
//
//   It is the whole-tree sibling of sync-robots-meta.mjs: that one repairs the
//   mirrors of English pages during the monthly pipeline, this one also covers
//   the English pages themselves and the pages the mirror build skips
//   (login/premium/members-area/...). Run it after changing INDEXABLE; both it
//   and transform.mjs converge on the same output, so re-running is safe.
//
// Run:  node tools/i18n/apply-locale-indexing.mjs [--dry-run] [--only <substr>]
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALES, SKIP_DIRS, SKIP_PATTERN, isIndexable, isPathIndexable } from './config.mjs';
import { applyHeadPolicy, hasNoindex } from './head.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const DRY = process.argv.includes('--dry-run');
const args = process.argv.slice(2);
const onlyIdx = args.indexOf('--only');
const ONLY = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

// Directories that never hold public pages (build inputs, assets, seeds,
// newsletter bundles, one-off backups of generator scripts).
const NEVER = new Set([...SKIP_DIRS, 'backup-p0-20261031-214210', '_api-inspect', 'backup']);

function walkPages(dir, skipCodes) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (e.name.startsWith('.')) continue;
      if (skipCodes && skipCodes.has(e.name)) continue;
      if (NEVER.has(e.name)) continue;
      if (/^backup/i.test(e.name)) continue;
      out.push(...walkPages(join(dir, e.name), skipCodes));
    } else if (e.name.endsWith('.html')) {
      if (SKIP_PATTERN.test(e.name)) continue;
      out.push(join(dir, e.name));
    }
  }
  return out;
}

const relOf = (abs) => abs.slice(ROOT.length + 1).replace(/\\/g, '/');
const localeCodes = new Set(LOCALES.map((l) => l.code));

// ---- 1. English pages: authoritative robots state + their own cluster -------
const englishPages = walkPages(ROOT, localeCodes).map(relOf);
const englishNoindex = new Map();
for (const rel of englishPages) {
  const abs = join(ROOT, rel);
  englishNoindex.set(rel, hasNoindex(readFileSync(abs, 'utf8')));
}

let failed = 0;
const stats = new Map(); // tree -> { scanned, changed, noindex }
const bump = (tree, field) => {
  const s = stats.get(tree) || { scanned: 0, changed: 0, noindex: 0 };
  s[field]++;
  stats.set(tree, s);
};

function stamp(tree, abs, rel, indexable) {
  if (ONLY && !rel.includes(ONLY)) return;
  bump(tree, 'scanned');
  try {
    const before = readFileSync(abs, 'utf8');
    const after = applyHeadPolicy(before, rel, { indexable });
    if (after === before) return;
    if (!DRY) writeFileSync(abs, after);
    bump(tree, 'changed');
    if (!indexable) bump(tree, 'noindex');
  } catch (e) {
    console.error(`  ! ${rel}: ${e.message}`);
    failed++;
  }
}

for (const rel of englishPages) {
  stamp('en', join(ROOT, rel), rel, !englishNoindex.get(rel));
}

// ---- 2. Locale mirrors: allow-list AND the English page's decision ----------
for (const l of LOCALES) {
  if (l.code === 'en') continue;
  const dir = join(ROOT, l.code);
  if (!existsSync(dir)) continue;
  for (const rel of walkPages(dir, null).map(relOf)) {
    const pageRel = rel.slice(l.code.length + 1); // strip "<code>/"
    const english = englishNoindex.get(pageRel) ?? false;
    stamp(l.code, join(ROOT, rel), pageRel, isPathIndexable(pageRel, l.code) && !english);
  }
}

const dropped = LOCALES.filter((l) => !isIndexable(l.code)).map((l) => l.code);
console.log(`${DRY ? '[dry-run] ' : ''}locale indexing policy`);
console.log(`  indexable: ${LOCALES.filter((l) => isIndexable(l.code)).map((l) => l.code).join(', ')}`);
console.log(`  noindex  : ${dropped.join(', ') || '(none)'}`);
console.log('  tree   scanned  rewritten  set-noindex');
for (const l of LOCALES) {
  const s = stats.get(l.code);
  if (!s) continue;
  console.log(`  ${l.code.padEnd(6)} ${String(s.scanned).padStart(7)} ${String(s.changed).padStart(10)} ${String(s.noindex).padStart(12)}`);
}
if (failed) console.log(`  failed: ${failed}`);
process.exit(failed ? 1 : 0);
