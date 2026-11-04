// tools/i18n/check-mirror.mjs — report untranslated text nodes per locale page.
// For each page × locale: split EN and locale HTML into text nodes (tags
// masked), then count locale nodes byte-identical to EN (i.e. English
// fallbacks). Ignores brand/short/code-like nodes.
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
  // strip head (meta/title live there; we check body prose), scripts, styles
  const body = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const parts = body.split(/(<[^>]+>)/);
  const out = [];
  for (const p of parts) {
    if (p.startsWith('<')) continue;
    const t = p.replace(/\s+/g, ' ').trim();
    if (!t) continue;
    if (!/[A-Za-zÀ-ɏ]{3,}/.test(t)) continue;      // needs real words
    if (t.length < 3) continue;
    out.push(t);
  }
  return out;
}

function isBrandish(t) {
  return /^(BlueSeas|Blue Seas Fishing|Blueseas|Fishing|Fishing With Serge)/i.test(t)
    || /blueseasfishing\.com/i.test(t);
}

let totalMissing = 0;
const report = [];
for (const p of PAGES) {
  const enSrc = join(ROOT, p);
  if (!existsSync(enSrc)) continue;
  const enNodes = textNodes(readFileSync(enSrc, 'utf8'));
  for (const l of LOCALES) {
    const f = join(ROOT, l, p);
    if (!existsSync(f)) { report.push(`${l}/${p}: MISSING FILE`); totalMissing += enNodes.length; continue; }
    const locNodes = new Set(textNodes(readFileSync(f, 'utf8')));
    const enSet = new Set(enNodes);
    // untranslated = node exists verbatim in EN source and also in locale file
    const untr = [...locNodes].filter((t) => enSet.has(t) && !isBrandish(t) && / [a-z]/.test(t));
    if (untr.length) {
      totalMissing += untr.length;
      report.push(`${l}/${p}: ${untr.length} EN nodes  e.g. "${untr[0].slice(0, 70)}"`);
    }
  }
}
console.log(report.join('\n') || 'ALL PAGES FULLY TRANSLATED');
console.log(`\nTOTAL untranslated text nodes: ${totalMissing}`);
