// tools/i18n/config.mjs — shared i18n configuration.
export const SITE = 'https://www.blueseasfishing.com';

// code → native name shown in the switcher.
export const LOCALES = [
  { code: 'en', native: 'English', dir: 'ltr' },
  { code: 'es', native: 'Español', dir: 'ltr' },
  { code: 'fr', native: 'Français', dir: 'ltr' },
  { code: 'de', native: 'Deutsch', dir: 'ltr' },
  { code: 'pt', native: 'Português', dir: 'ltr' },
  { code: 'ru', native: 'Русский', dir: 'ltr' },
  { code: 'el', native: 'Ελληνικά', dir: 'ltr' },
  { code: 'ar', native: 'العربية', dir: 'rtl' },
];
export const SOURCE = 'en';
export const TARGETS = LOCALES.filter((l) => l.code !== SOURCE);

// ---------- indexing policy (single source of truth) ----------
// A page may be indexed only when three things hold, and tools/i18n/head.mjs
// is the one place that decides all three:
//   1. its locale is in INDEXABLE (all eight are),
//   2. its section, if it has a restricted locale list, names that locale,
//   3. its English original is not itself noindex (the generators' own call).
// Anything excluded is still built and served — human visitors keep the
// language switcher — but carries `noindex,follow`, is left out of every
// hreflang cluster and is not advertised in the sitemap.
//
// 2026-11-01, decision revised before it took effect. The first version of this
// file cut four locales outright (ar el pt ru) on the strength of Blue Seas'
// 121 machine-translated pages that Google had crawled and declined. Then GSC
// by country showed the cut was pointed at the wrong variable:
//     ru  12 clicks, 1.6% CTR, position 13.7   <- was cut, best of any size
//     el   7 clicks, 2.3% CTR, position  9.7   <- was cut, best position on site
//     pt   2 clicks, 0.8% CTR, position 11.0   <- was cut
//     de   3 clicks, 0.1% CTR, position 17.1   <- was kept, worst on site
//     de  "atlantischer kabeljau": 2,003 impressions, 0 clicks
// So the predictor of a worthless page is the section, not the language.
// Species encyclopedia mirrors accumulate impressions and no clicks in every
// language; the seasonal state/month pages earn clicks even in ru and el.
// Cutting by language would have removed the site's best markets.
export const INDEXABLE = ['en', 'es', 'fr', 'de', 'pt', 'ru', 'el', 'ar'];
export const isIndexable = (code) => INDEXABLE.includes(code);
export const DROPPED = LOCALES.filter((l) => !isIndexable(l.code)).map((l) => l.code);
// ---------- section policy ----------
// Sections whose mirrors are indexed in only some locales. A section absent
// from this map is indexable in every locale in INDEXABLE.
//
// species — German only.
//   The 549 species pages mirrored into 7 locales are 3,843 near-duplicate
//   translations, and 78 of Blue Seas' 135 “crawled – currently not indexed”
//   pages were species mirrors, so the whole section was excluded outside
//   English. That threw away the site's single largest impression source:
//   the German species pages (“atlantischer kabeljau”, 2,003 impressions,
//   0 clicks) are the one part of the mirror tree Google actively shows.
//   Excluding them kept the impressions and removed any chance of a click
//   (a noindex page cannot rank), which is the worst of both.
//
//   So German is promoted to indexable and the other six stay out: German is
//   the locale where the demand is already proven, and keeping the rest out
//   holds the near-duplicate count to one mirror rather than six. If the
//   German pages earn clicks, promote the next locale by adding it here;
//   nothing else needs to change, because every consumer (head policy, sitemap
//   alternates, verify-seo) asks isPathIndexable().
//
// The English originals stay indexed in every case: they are the content, not
// a mirror.
export const SECTION_LOCALE_ALLOWLIST = {
  species: ['de'],
};
// Sections indexed in no locale outside English. Derived, so the two can never
// disagree: a section with an empty allowlist is a fully excluded section.
export const NON_INDEXABLE_SECTIONS = Object.keys(SECTION_LOCALE_ALLOWLIST)
  .filter((s) => SECTION_LOCALE_ALLOWLIST[s].length === 0);

/**
 * May `relPath` (site-relative, without a locale prefix) be indexed in `code`?
 *
 * Deliberately narrow: it answers only the locale/section policy. Whether a
 * page is indexable in practice is this AND "its English original is not
 * itself noindex" — the generators' own decision, which the callers apply.
 */
export function isPathIndexable(relPath, code) {
  if (!isIndexable(code)) return false;
  if (code === SOURCE) return true;
  const first = String(relPath).replace(/^\/+/, '').split('/')[0];
  const allowed = SECTION_LOCALE_ALLOWLIST[first];
  if (allowed) return allowed.includes(code);
  return true;
}

// Locales that may appear in an hreflang cluster / sitemap alternate.
export const HREFLANG_LOCALES = LOCALES.filter((l) => isIndexable(l.code));

// Dirs never mirrored (backend, tooling, assets, build artifacts).
export const SKIP_DIRS = new Set([
  'node_modules', 'tools', 'api', 'config', 'includes',
  'newsletter-issues', '.idxwork', 'images', 'assets', 'icons',
  'ios-project', 'android-project', '__pycache__',
]);
// Locale output dirs are build artifacts — never source-walked (prevents the
// mirror-of-a-mirror loop that produced es/ar/, fr/ar/, ... on 2026-10-14).
for (const l of LOCALES) SKIP_DIRS.add(l.code);

// Root pages never mirrored (noindex member/auth pages, backups, 301 source).
export const SKIP_FILES = new Set([
  'login.html', 'members-area.html', 'premium-success.html',
  'subscribe.html', 'gear-recommendations.html', 'trip-planner.html',
  '404.html', 'offline.html', 'premium.html',
]);
export const SKIP_PATTERN = / - Copy| - copy|\(backup\)|~$/;

// Attributes whose values are translatable plain text.
export const TEXT_ATTRS = ['title', 'alt', 'aria-label', 'placeholder', 'label', 'summary'];
// <meta> name/property values whose content= is translatable (never URLs).
export const META_TEXT = /^(description|keywords|og:title|og:description|twitter:title|twitter:description|application-name)$/i;
