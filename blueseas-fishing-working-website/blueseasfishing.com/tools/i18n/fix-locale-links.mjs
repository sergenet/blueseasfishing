// tools/i18n/fix-locale-links.mjs — post-hoc repair pass for locale mirrors.
//
// Two fixes that must run AFTER mirror-auth.mjs has generated the locale
// copies of the formerly-skipped pages (login, premium, subscribe,
// members-area, premium-success, trip-planner, gear-recommendations):
//
//   1. Absolute nav/CTA links to those pages inside every locale page still
//      point at the English copy (href="/login.html" etc.) because the old
//      shouldPrefix rule refused to prefix SKIP_FILES. transform.mjs now
//      prefixes when the locale copy exists, but the ~1,109 already-built
//      pages per language need this offline pass. Idempotent: already
//      prefixed links don't match.
//
//   2. The A–Z letter anchors (href="...#letter-A">A</a>) were sent through
//      MT as text nodes and came back as translations of the English letter
//      ("A" → "un", "B" → "b"). The anchor targets are the Latin letters, so
//      the link text is restored to the bare letter in every locale.
//
// Run: node tools/i18n/fix-locale-links.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const LOCALES = ['es', 'fr', 'de', 'pt', 'ru', 'el', 'ar'];

// longest-first so premium-success wins over premium
const PAGES = [
  'premium-success', 'gear-recommendations', 'members-area',
  'trip-planner', 'premium', 'subscribe', 'login',
];
const PAGE_ALT = PAGES.join('|');

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

const AUTH_RE = new RegExp(`href=(["'])/(?:${PAGE_ALT})\\.html`, 'g');
const LETTER_RE = /href=["'][^"']*#letter-([A-Z])["'][^>]*>([^<]*)</g;

let files = 0, authFixes = 0, letterFixes = 0;
for (const code of LOCALES) {
  for (const file of walk(join(ROOT, code))) {
    const src = readFileSync(file, 'utf8');
    let out = src;

    // 1. prefix absolute auth/commerce links with the locale
    out = out.replace(AUTH_RE, (m, q) => {
      authFixes++;
      return `href=${q}/${code}/` + m.slice(`href=${q}/`.length);
    });

    // 2. restore A–Z letter link text
    out = out.replace(LETTER_RE, (m, letter, text) => {
      if (text === letter) return m;
      letterFixes++;
      return m.replace(`>${text}<`, `>${letter}<`);
    });

    if (out !== src) { writeFileSync(file, out, 'utf8'); files++; }
  }
}
console.log(`fix-locale-links: ${files} files changed, ${authFixes} auth links prefixed, ${letterFixes} letter anchors restored`);
