#!/usr/bin/env node
// tools/i18n/sync-robots-meta.mjs — bring every locale mirror's head in line
// with the indexing policy, without touching the translation.
//
// Why this exists (2026-10-17, extended 2026-11-01):
//   generate-states.mjs marks duplicate state x month pages noindex,follow so
//   Google stops crawling hundreds of near-identical URLs. Those pages are
//   mirrored into every locale, and a mirrored page does NOT inherit the
//   decision until tools/i18n/build.mjs re-mirrors it — which costs a full MT
//   pass and only happens when someone chooses to run it. This script applies
//   the decision to the existing mirrors with a deterministic file edit: no MT,
//   no API calls, no manifest churn.
//
//   Since 2026-11-01 the same pass also owns the other half of the policy —
//   config.mjs INDEXABLE. A mirror is indexable only when its locale is
//   allow-listed AND the English page it mirrors is indexable; indexable
//   mirrors advertise an hreflang cluster, non-indexable ones carry
//   noindex,follow and advertise nothing. transform.mjs makes the same decision
//   during a build, so the two converge instead of fighting.
//
//   transform.mjs preserves unknown <meta> tags verbatim (its translatable meta
//   allow-list is description|keywords|og:*|twitter:*|application-name), so
//   once build.mjs next re-mirrors a page the head written here is reproduced
//   from the English source anyway. Re-running is therefore always safe.
//
// Run:  node tools/i18n/sync-robots-meta.mjs [--dry-run]
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TARGETS, SKIP_DIRS, SKIP_FILES, SKIP_PATTERN, isIndexable, isPathIndexable } from './config.mjs';
import { applyHeadPolicy, hasNoindex } from './head.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const DRY = process.argv.includes('--dry-run');

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

const sources = walk(ROOT);
let updated = 0, alreadyOK = 0, missingMirror = 0, failed = 0;
const dropped = TARGETS.filter((l) => !isIndexable(l.code)).map((l) => l.code);
console.log(`policy: indexable locales = ${['en', ...TARGETS.filter((l) => isIndexable(l.code)).map((l) => l.code)].join(', ')}`);
if (dropped.length) console.log(`        noindex locales   = ${dropped.join(', ')}`);

for (const abs of sources) {
  const rel = abs.slice(ROOT.length + 1).replace(/\\/g, '/');
  const englishNoindex = hasNoindex(readFileSync(abs, 'utf8'));

  for (const l of TARGETS) {
    const mirrorPath = join(ROOT, l.code, rel);
    if (!existsSync(mirrorPath)) { missingMirror++; continue; }
    try {
      const before = readFileSync(mirrorPath, 'utf8');
      const after = applyHeadPolicy(before, rel, {
        // Locale AND section AND the English page's own decision — a species
        // mirror is noindex even though every locale is now indexable.
        indexable: isPathIndexable(rel, l.code) && !englishNoindex,
      });
      if (after === before) { alreadyOK++; continue; }
      if (!DRY) writeFileSync(mirrorPath, after);
      updated++;
    } catch (e) {
      console.error(`  ! ${l.code}/${rel}: ${e.message}`);
      failed++;
    }
  }
}

console.log(`${DRY ? '[dry-run] ' : ''}head policy sync across ${TARGETS.length} locales:`);
console.log(`  mirrors rewritten        : ${updated}`);
console.log(`  already correct          : ${alreadyOK}`);
console.log(`  no mirror on disk        : ${missingMirror}`);
if (failed) console.log(`  failed                   : ${failed}`);
process.exit(failed ? 1 : 0);
