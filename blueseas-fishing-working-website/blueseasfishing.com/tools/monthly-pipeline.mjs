#!/usr/bin/env node
/**
 * monthly-pipeline.mjs
 *
 * One command that runs the full content refresh for the current month:
 *   1. destinations -> species pages (with the 30-page freshness rotation)
 *      -> comparisons -> monthly calendar -> states (+ state-month pages)
 *      -> newsletter issues for this month
 *   2. sitemap + verify-seo (hard gate: a verify failure stops the pipeline)
 *
 * Deploy, IndexNow ping and newsletter sending are handled by
 * run-monthly.ps1 (which calls this script first).
 *
 * Run:  node tools/monthly-pipeline.mjs
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Order matters:
//   destinations -> .destinations-map.json          (consumed by states + species)
//   states       -> .state-species.json / .states-month-map.json
//   species      -> .state-species.json             (species -> state cross-links)
//   ...          -> monthly + newsletter read .states-month-map.json
// States therefore runs BEFORE species (moved 2026-10-17): the species page
// generator now links each species to the state calendars that list it, so it
// needs this run's .state-species.json rather than last month's. States itself
// depends only on the species database and .destinations-map.json, so nothing
// is lost by moving it earlier.
// Steps are [label, runtime, script, ...args]; runtime is 'node' or 'python'.
//
// The repair passes after the i18n steps exist because every content generator
// rewrites whole pages from its own template. A generator that does not emit an
// og:image, a reciprocal hreflang cluster or a translated description silently
// removes the one that was there, and nothing catches it until someone happens
// to look. On 2026-11-04 the accumulated result was 385 state pages with no
// og:image, 235 English pages with a one-way hreflang cluster and 672 locale
// destinations shipping the English meta description. Each pass is idempotent,
// so running them every month costs nothing.
const steps = [
  ['destinations', 'node', 'tools/generate-destinations.mjs'],
  ['states + state-month pages', 'node', 'tools/generate-states.mjs'],
  ['species + freshness rotation', 'node', 'tools/generate-species-pages.mjs'],
  ['comparison guides', 'node', 'tools/generate-comparisons.mjs'],
  ['monthly calendar', 'node', 'tools/generate-monthly.mjs'],
  ['newsletter issues', 'node', 'tools/generate-newsletter.mjs'],
  ['sitemap', 'node', 'tools/generate-sitemap.mjs'],
  ['pwa head wiring', 'node', 'tools/add-pwa-head.mjs'],
  // Restores the English half of the hreflang cluster. The content generators
  // rewrite whole pages and drop the <link rel=alternate> tags that i18n/build
  // injects, so without this step the English pages lose their side of the
  // cluster every single month and Google sees a one-way annotation.
  // `--locale en` makes this structural only: no translation, no MT spend.
  ['i18n english hreflang restore', 'node', 'tools/i18n/build.mjs', '--locale', 'en'],
  // build.mjs --locale en only covers the sections it mirrors. Destinations,
  // states, whats-biting and fish-size-charts were left without a cluster; this
  // pass fills in every section, confirms each mirror exists on disk and skips
  // any mirror that is noindex.
  ['english hreflang, all sections', 'node', 'tools/i18n/fix-english-hreflang.mjs'],
  ['i18n robots meta sync', 'node', 'tools/i18n/sync-robots-meta.mjs'],
  // Social preview images and translated descriptions, in that order: the
  // description pass compares the mirror against its English original, which is
  // stable by then.
  ['social preview tags', 'python', 'tools/fix-social-tags.py'],
  ['locale descriptions', 'python', 'tools/i18n/fix-locale-descriptions.py'],
  ['locale title brand', 'python', 'tools/i18n/normalise-title-brand.py'],
  // Last of the title passes, and only after the brand is normalised: it drops
  // the brand suffix from translated titles that run past 60 characters. Google
  // truncates from the end, so on those pages the brand was never shown — it
  // was pushing the descriptive half off the edge instead.
  ['locale title length', 'node', 'tools/i18n/shorten-locale-titles.mjs'],
  // Ads run AFTER the i18n steps, not before: a full i18n build regenerates the
  // locale mirrors from the English source and would drop the units from every
  // translated page, leaving them unmonetised until the next month. Running last
  // means the mixed English/locale tree is the one that gets wired.
  ['adsense wiring', 'node', 'tools/add-adsense.mjs'],
  ['verify-seo', 'node', 'tools/verify-seo.mjs'],
  ['hreflang reciprocity', 'python', 'tools/verify-hreflang.py'],
];

let failed = null;
for (const [label, runtime, script, ...scriptArgs] of steps) {
  console.log(`\n=== ${label} (${script}${scriptArgs.length ? ' ' + scriptArgs.join(' ') : ''}) ===`);
  const r = spawnSync(runtime, [script, ...scriptArgs], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) { failed = script; break; }
}

if (failed) {
  console.error(`\nPIPELINE FAILED at ${failed} — nothing deployed.`);
  process.exit(1);
}
console.log('\nPipeline complete: content refreshed and verified. Ready to deploy.');
