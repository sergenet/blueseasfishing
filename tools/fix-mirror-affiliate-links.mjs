#!/usr/bin/env node
/**
 * fix-mirror-affiliate-links.mjs
 *
 * The locale mirrors are copies of the English pages, so when the English
 * destination pages were regenerated with live Awin links the 672 translated
 * copies kept the old, dead `awinmid=129285` hrefs. Re-running the full i18n
 * build would re-translate every page (MT cost) for what is a pure link swap.
 *
 * Instead this copies the English gear links into each mirror **by position**:
 * both copies carry the same three gear links in the same order, only the
 * surrounding labels differ. Nothing else in the file is touched.
 *
 * Run:  node tools/fix-mirror-affiliate-links.mjs --dry-run
 *       node tools/fix-mirror-affiliate-links.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', 'blueseas-fishing-working-website', 'blueseasfishing.com');
const LOCALES = ['es', 'fr', 'de', 'pt', 'ru', 'el', 'ar'];
const DRY = process.argv.includes('--dry-run');

const HREF = /https:\/\/www\.awin1\.com\/cread\.php\?[^"'\s]+/g;

let filesTouched = 0;
let linksReplaced = 0;
const stillDead = [];

const enDir = join(SITE, 'destinations');
const pages = readdirSync(enDir).filter((f) => f.endsWith('.html') && f !== 'index.html');

for (const page of pages) {
  const enHtml = readFileSync(join(enDir, page), 'utf8');
  const enLinks = enHtml.match(HREF) || [];
  if (!enLinks.length) continue;

  for (const loc of LOCALES) {
    const mirrorPath = join(SITE, loc, 'destinations', page);
    if (!existsSync(mirrorPath)) continue;
    let html = readFileSync(mirrorPath, 'utf8');

    let i = 0;
    const before = html;
    html = html.replace(HREF, (match) => (i < enLinks.length ? enLinks[i++] : match));
    if (html === before) continue;

    linksReplaced += i;
    filesTouched++;
    if (!DRY) writeFileSync(mirrorPath, html);

    const leftovers = html.match(/awinmid=129285/g);
    if (leftovers) stillDead.push(`${loc}/destinations/${page} (${leftovers.length})`);
  }
}

console.log(`${DRY ? '[dry-run] ' : ''}mirror files updated: ${filesTouched}`);
console.log(`links replaced: ${linksReplaced}`);
if (stillDead.length) {
  console.log(`\nstill pointing at the dead merchant: ${stillDead.length}`);
  for (const s of stillDead.slice(0, 10)) console.log(`  ${s}`);
} else {
  console.log('no dead-merchant links remain in the mirrors');
}
