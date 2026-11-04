#!/usr/bin/env node
/**
 * generate-sitemap.mjs
 *
 * Regenerates sitemap.xml: static content pages + every generated species
 * page, each with a real <lastmod> (file mtime). Excludes member/auth pages
 * and duplicates handled by .htaccess redirects.
 *
 * Run:  node tools/generate-sitemap.mjs
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HREFLANG_LOCALES, isPathIndexable } from './i18n/config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.blueseasfishing.com';

// Locale mirrors produced by tools/i18n, minus English. Taken from the i18n
// config rather than copied, so the two can never disagree: a locale that is
// noindex,follow (config.INDEXABLE) must not be advertised as an alternate —
// submitting a URL we have told Google to ignore is a contradictory signal.
const LOCALES = HREFLANG_LOCALES.map((l) => l.code).filter((c) => c !== 'en');

// Pages intentionally excluded: noindex member/auth pages, and
// gear-recommendations.html (301'd to recommended-fishing-gear.html).
const EXCLUDE = new Set([
  'login.html', 'members-area.html', 'premium-success.html',
  'subscribe.html', 'gear-recommendations.html',
  'trip-planner.html', // noindex member tool (premium paywall page)
  '404.html', // noindex error page
  'offline.html', // noindex PWA fallback page
  'premium.html', // noindex paywall page
  'index.html', // canonical homepage URL is "/", added explicitly below
]);

// --- lastmod: date of last *content* change, not last regeneration -----------
// File mtime is useless for this site: the monthly generators rewrite every page
// in a single run, so all 817 URLs end up carrying the same date and Google
// discards a lastmod that never varies. Instead we keep a manifest of content
// hashes; a URL's lastmod only advances when its <body> actually differs from
// the previous run. Head churn (hreflang cluster, ad loader, PWA tags) is
// ignored on purpose — it is not a content change worth re-crawling for.
const MANIFEST = join(ROOT, '.lastmod-manifest.json');
let manifest = {};
try { if (existsSync(MANIFEST)) manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')); } catch { manifest = {}; }
const TODAY = new Date().toISOString().slice(0, 10);

// Ad units are deliberately excluded from the hash. They are injected into the
// body by tools/add-adsense.mjs, so a portfolio-wide ad rollout would otherwise
// mark every page as freshly changed and hand Google 8,000 identical dates in
// one go — exactly the dilution this manifest exists to prevent. An added ad is
// not a content change worth re-crawling for.
const AD_BLOCK_RE = /<div class="ad-slot"[\s\S]*?<\/div>/g;

function lastmod(file) {
  let html;
  try { html = readFileSync(join(ROOT, file), 'utf8'); } catch { return TODAY; }
  const body = html.match(/<body[\s\S]*<\/body>/i);
  const content = (body ? body[0] : html).replace(AD_BLOCK_RE, '');
  const hash = createHash('sha1').update(content).digest('hex').slice(0, 16);
  const prev = manifest[file];
  if (!prev || prev.hash !== hash) {
    manifest[file] = { hash, date: TODAY };
    return TODAY;
  }
  return prev.date;
}

/** A page that asks not to be indexed must not be advertised in the sitemap.
 *  Advertising a noindex URL is a contradictory signal (Search Console flags
 *  it as "Submitted URL marked 'noindex'"). Read from disk rather than from a
 *  side-list so the sitemap can never drift from the pages themselves —
 *  generate-states.mjs marks duplicate state x month pages this way. */
const NOINDEX_RE = /<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i;
function isNoindex(file) {
  try { return NOINDEX_RE.test(readFileSync(join(ROOT, file), 'utf8')); } catch { return false; }
}

/** SITE-prefixed URL -> path on disk (covers both file.html and dir/ forms). */
function fileFor(loc) {
  const rel = loc === `${SITE}/` ? 'index.html' : loc.slice(SITE.length).replace(/^\//, '');
  return rel.endsWith('/') ? `${rel}index.html` : rel;
}

const urls = [{ loc: `${SITE}/`, lastmod: lastmod('index.html') }];

for (const f of readdirSync(ROOT)) {
  if (!f.endsWith('.html') || EXCLUDE.has(f)) continue;
  if (/ - Copy| - copy|\(backup\)|~$/.test(f)) continue; // editor backup files
  urls.push({ loc: `${SITE}/${f}`, lastmod: lastmod(f) });
}

// Generated species pages
const speciesDir = join(ROOT, 'species');
for (const f of readdirSync(speciesDir)) {
  if (!f.endsWith('.html')) continue;
  const loc = f === 'index.html' ? `${SITE}/species/` : `${SITE}/species/${f}`;
  urls.push({ loc, lastmod: lastmod(join('species', f)) });
}

// Generated destination pages
const destDir = join(ROOT, 'destinations');
if (existsSync(destDir)) {
  for (const f of readdirSync(destDir)) {
    if (!f.endsWith('.html')) continue;
    const loc = f === 'index.html' ? `${SITE}/destinations/` : `${SITE}/destinations/${f}`;
    urls.push({ loc, lastmod: lastmod(join('destinations', f)) });
  }
}

// Generated monthly "What's Biting" calendar pages
const monthlyDir = join(ROOT, 'whats-biting');
if (existsSync(monthlyDir)) {
  for (const f of readdirSync(monthlyDir)) {
    if (!f.endsWith('.html')) continue;
    const loc = f === 'index.html' ? `${SITE}/whats-biting/` : `${SITE}/whats-biting/${f}`;
    urls.push({ loc, lastmod: lastmod(join('whats-biting', f)) });
  }
}

// Generated state-by-state seasons pages (incl. nested state/month pages)
const statesDir = join(ROOT, 'states');
if (existsSync(statesDir)) {
  const walk = (dir, rel) => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      if (f.isDirectory()) walk(join(dir, f.name), `${rel}/${f.name}`);
      else if (f.name.endsWith('.html')) {
        const loc = f.name === 'index.html' && rel === 'states' ? `${SITE}/states/` : `${SITE}/${rel}/${f.name}`;
        urls.push({ loc, lastmod: lastmod(join(rel, f.name)) });
      }
    }
  };
  walk(statesDir, 'states');
}

// Generated record-vs-average size chart pages
const recordsDir = join(ROOT, 'fish-size-charts');
if (existsSync(recordsDir)) {
  for (const f of readdirSync(recordsDir)) {
    if (!f.endsWith('.html')) continue;
    const loc = f === 'index.html' ? `${SITE}/fish-size-charts/` : `${SITE}/fish-size-charts/${f}`;
    urls.push({ loc, lastmod: lastmod(join('fish-size-charts', f)) });
  }
}

// Quarterly member mini-guides
const guidesDir = join(ROOT, 'guides');
if (existsSync(guidesDir)) {
  for (const f of readdirSync(guidesDir)) {
    if (!f.endsWith('.html')) continue;
    urls.push({ loc: `${SITE}/guides/${f}`, lastmod: lastmod(join('guides', f)) });
  }
}

urls.sort((a, b) => a.loc.localeCompare(b.loc));

// Drop noindex pages: they are intentionally out of the index, so the sitemap
// must not submit them for crawling (duplicate state x month pages).
const beforeFilter = urls.length;
const kept = urls.filter((u) => !isNoindex(fileFor(u.loc)));
urls.length = 0;
urls.push(...kept);
const dropped = beforeFilter - urls.length;

// Mirror a site-relative path (e.g. "/", "/blog.html", "/species/largemouth-bass.html")
// into a locale-prefixed absolute URL, matching tools/i18n/transform.mjs hreflangFor.
function localeUrl(relPath, code) {
  if (relPath === '/') return `${SITE}/${code}/`;
  return `${SITE}/${code}${relPath}`;
}

// Emit each English URL plus its locale mirrors, cross-linked with hreflang.
const english = urls.map((u) => {
  const relPath = u.loc === `${SITE}/` ? '/' : u.loc.slice(SITE.length);
  const alternates = LOCALES
    // Section policy first: a species page is indexable in English only, so its
    // 7 mirror URLs must not be advertised as alternates.
    .filter((code) => isPathIndexable(relPath, code))
    .filter((code) => existsSync(join(ROOT, code, relPath === '/' ? 'index.html' : relPath.replace(/^\//, ''))))
    .map((code) => ({ code, loc: localeUrl(relPath, code) }));
  return { ...u, relPath, alternates };
});

/** The hreflang cluster shared by every version of one page. */
function clusterFor(englishLoc, alternates) {
  return [
    `<xhtml:link rel="alternate" hreflang="en" href="${englishLoc}"/>`,
    ...alternates.map((a) => `<xhtml:link rel="alternate" hreflang="${a.code}" href="${a.loc}"/>`),
    `<xhtml:link rel="alternate" hreflang="x-default" href="${englishLoc}"/>`,
  ].join('');
}

/** SITE-less URL path -> path on disk, e.g. "/es/states/" -> "es/states/index.html". */
function diskPath(loc) {
  const rel = loc === `${SITE}/` ? '/' : loc.slice(SITE.length);
  return rel.endsWith('/') ? `${rel.replace(/^\//, '')}index.html` : rel.replace(/^\//, '');
}

// Every indexable language version becomes its own <url>, and each repeats the
// full cluster. Google's guidance is that all versions are submitted, not just
// the source: listing only the English URL (as this file did until now) left
// roughly 1,700 live translations reachable only through alternate hrefs and
// internal links, which is a weaker signal than being in the sitemap at all.
const entries = [];
for (const e of english) {
  const cluster = e.alternates.length ? clusterFor(e.loc, e.alternates) : '';
  entries.push({ loc: e.loc, lastmod: e.lastmod, cluster });
  for (const a of e.alternates) {
    entries.push({ loc: a.loc, lastmod: lastmod(diskPath(a.loc)), cluster });
  }
}
entries.sort((a, b) => a.loc.localeCompare(b.loc));

function entryXml(e) {
  const parts = [`<url><loc>${e.loc}</loc><lastmod>${e.lastmod}</lastmod>`];
  if (e.cluster) parts.push(e.cluster);
  parts.push('</url>');
  return parts.join('');
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(entryXml).join('\n')}
</urlset>
`;

writeFileSync(join(ROOT, 'sitemap.xml'), xml);
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
const mirrored = english.filter((e) => e.alternates.length).length;
const dateCount = new Set(entries.map((e) => e.lastmod)).size;
console.log(`sitemap.xml written: ${entries.length} URLs — ${english.length} English (${mirrored} with locale alternates) + ${entries.length - english.length} locale versions`);
console.log(`  lastmod dates in use: ${dateCount} (grows over time as pages change; 1 means nothing has changed since the manifest was created)`);
if (dropped) console.log(`  ${dropped} noindex page(s) excluded from the sitemap`);
