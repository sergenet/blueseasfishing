// tools/i18n/dump-untranslated.mjs — exact list of untranslated nodes per file
// (body text + <title>/meta description), plus species-pack literal status.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const LOCALES = ['es', 'fr', 'de', 'pt', 'ru', 'el', 'ar'];
const PAGES = [
  'login.html', 'premium.html', 'subscribe.html', 'members-area.html',
  'premium-success.html', 'trip-planner.html', 'gear-recommendations.html',
];

function textNodes(html) {
  const body = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const parts = body.split(/(<[^>]+>)/);
  const out = [];
  for (const p of parts) {
    if (p.startsWith('<')) continue;
    const t = p.replace(/\s+/g, ' ').trim();
    if (!t || !/[A-Za-zÀ-ɏ]{3,}/.test(t) || t.length < 3) continue;
    out.push(t);
  }
  return out;
}
const brandish = (t) => /BlueSeas|Blue Seas Fishing|blueseasfishing/i.test(t);

for (const p of PAGES) {
  const enSrc = join(ROOT, p);
  if (!existsSync(enSrc)) continue;
  const enHtml = readFileSync(enSrc, 'utf8');
  const enNodes = new Set(textNodes(enHtml));
  const enTitle = (enHtml.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  for (const l of LOCALES) {
    const f = join(ROOT, l, p);
    if (!existsSync(f)) continue;
    const html = readFileSync(f, 'utf8');
    const locNodes = new Set(textNodes(html));
    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    const untr = [...locNodes].filter((t) => enNodes.has(t) && !brandish(t) && / [a-z]/.test(t));
    const titleIsEn = title === enTitle && / [a-z]/.test(title);
    if (untr.length || titleIsEn) {
      console.log(`\n### ${l}/${p}${titleIsEn ? '  [TITLE UNTRANSLATED]' : ''}`);
      for (const t of untr) console.log(`  - ${JSON.stringify(t)}`);
    }
  }
}

// species packs: are literals translated? sample first habitat/baits literal
console.log('\n### species packs (sample habitat literal)');
for (const file of ['species-db.js', 'species-db.enriched.js']) {
  const en = readFileSync(join(ROOT, file), 'utf8');
  const m = en.match(/habitat:\s*"([^"]{20,60})/);
  if (!m) continue;
  const sample = m[1].slice(0, 30);
  for (const l of LOCALES) {
    const f = join(ROOT, l, file);
    if (!existsSync(f)) { console.log(`  ${l}/${file}: MISSING`); continue; }
    const body = readFileSync(f, 'utf8');
    console.log(`  ${l}/${file}: ${body.includes(sample) ? 'ENGLISH (untranslated)' : 'translated?'}`);
  }
}
