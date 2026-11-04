import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALES, isIndexable, isPathIndexable, NON_INDEXABLE_SECTIONS } from './i18n/config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.blueseasfishing.com';

let errors = 0, checks = 0;
const fail = (msg) => { console.error(`  ✗ ${msg}`); errors++; };
const ok = (msg) => { checks++; if (msg) console.log(`  ✓ ${msg}`); };

console.log('Step 1: walking directories...');
function walk(dir, out = []) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) walk(p, out);
    else if (f.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const pages = walk(ROOT);
console.log(`Found ${pages.length} pages. Checking JSON-LD and canonicals...`);
let ldBlocks = 0;
for (const page of pages) {
  const rel = page.slice(ROOT.length + 1).replace(/\\/g, '/');
  const html = readFileSync(page, 'utf8');

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    ldBlocks++;
    try {
      JSON.parse(m[1]);
    } catch (e) {
      fail(`${rel}: invalid JSON-LD (${e.message})`);
    }
  }

  const canon = (html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i) || [])[1];
  if (canon) {
    if (!canon.startsWith(`${SITE}/`)) fail(`${rel}: canonical not on www host: ${canon}`);
    if (rel === 'index.html' || rel.endsWith('/index.html')) {
      if (canon.endsWith('/index.html')) {
        fail(`${rel}: directory index canonical must end with '/', not /index.html: ${canon}`);
      }
    }
    let path = canon.slice(SITE.length).split('?')[0];
    if (path === '/' || path === '') path = 'index.html';
    path = path.replace(/\/$/, '/index.html'); // directory-style canonicals
    const expected = normalize(join(ROOT, path));
    const self = normalize(page);
    if (expected !== self && !self.endsWith('404.html')) {
      fail(`${rel}: canonical ${canon} does not match file location`);
    }
  }
}
ok(`${ldBlocks} JSON-LD blocks parsed, canonicals checked across ${pages.length} pages`);

console.log('Step 2: Checking internal links...');
const linkSources = [
  join(ROOT, 'gallery.html'),
  join(ROOT, 'species', 'index.html'),
  ...readdirSync(join(ROOT, 'species')).filter((f) => f.endsWith('.html') && f !== 'index.html')
    .slice(0, 40).map((f) => join(ROOT, 'species', f)),
  ...(existsSync(join(ROOT, 'destinations')) ? [
    join(ROOT, 'destinations', 'index.html'),
    ...readdirSync(join(ROOT, 'destinations')).filter((f) => f.endsWith('.html') && f !== 'index.html')
      .slice(0, 40).map((f) => join(ROOT, 'destinations', f)),
  ] : []),
  ...(existsSync(join(ROOT, 'states')) ? (() => {
    const files = [join(ROOT, 'states', 'index.html')];
    for (const e of readdirSync(join(ROOT, 'states'), { withFileTypes: true })) {
      if (e.isDirectory()) {
        for (const f of readdirSync(join(ROOT, 'states', e.name))) {
          if (f.endsWith('.html')) files.push(join(ROOT, 'states', e.name, f));
        }
      } else if (e.name.endsWith('.html')) files.push(join(ROOT, 'states', e.name));
    }
    return files;
  })() : []),
  ...(existsSync(join(ROOT, 'fish-size-charts')) ? [
    join(ROOT, 'fish-size-charts', 'index.html'),
    ...readdirSync(join(ROOT, 'fish-size-charts')).filter((f) => f.endsWith('.html'))
      .map((f) => join(ROOT, 'fish-size-charts', f)),
  ] : []),
];

const broken = new Map();
for (const src of linkSources) {
  const html = readFileSync(src, 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '');
  const baseDir = src.includes('species') ? 'species' : '';
  for (const m of html.matchAll(/href="(\/[^"#]*)[#"]/g)) {
    let target = m[1];
    if (target.startsWith('//')) continue;
    if (target === '/') continue;
    const clean = target.replace(/\?.*$/, '');
    const fsPath = normalize(join(ROOT, clean.replace(/^\//, '')));
    const asDirIndex = normalize(join(ROOT, clean.replace(/\/$/, ''), 'index.html'));
    if (!existsSync(fsPath) && !existsSync(asDirIndex)) {
      const key = `${baseDir || '.'} -> ${clean}`;
      if (!broken.has(key)) broken.set(key, src.slice(ROOT.length + 1));
    }
  }
}
if (broken.size) for (const [link, src] of broken) fail(`broken link ${link} (in ${src})`);
else ok(`all internal /...# links resolve (${linkSources.length} files scanned)`);

console.log('Step 3: Checking sitemap coverage...');
const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
let missing = 0;
for (const u of sitemapUrls) {
  const path = u.slice(SITE.length);
  const fsPath = path === '/' ? 'index.html' : path.replace(/^\//, '').replace(/\/$/, '/index.html');
  if (!existsSync(join(ROOT, fsPath))) { fail(`sitemap URL has no file: ${u}`); missing++; }
}
if (!missing) ok(`all ${sitemapUrls.length} sitemap URLs map to real files`);

console.log('Step 4: Checking noindex in sitemap...');
const NOINDEX_RE = /<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i;
let leaked = 0;
for (const u of sitemapUrls) {
  const path = u.slice(SITE.length);
  const fsPath = path === '/' ? 'index.html' : path.replace(/^\//, '').replace(/\/$/, '/index.html');
  const abs = join(ROOT, fsPath);
  if (!existsSync(abs)) continue;
  if (NOINDEX_RE.test(readFileSync(abs, 'utf8'))) { fail(`sitemap submits a noindex page: ${u}`); leaked++; }
}
if (!leaked) ok(`no noindex page is submitted in the sitemap`);

console.log('Step 5: Checking canonical match with sitemap...');
let canonMismatches = 0;
for (const u of sitemapUrls) {
  const path = u.slice(SITE.length);
  const fsPath = path === '/' ? 'index.html' : path.replace(/^\//, '').replace(/\/$/, '/index.html');
  const abs = join(ROOT, fsPath);
  if (!existsSync(abs)) continue;
  const pageHtml = readFileSync(abs, 'utf8');
  const pageCanon = (pageHtml.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i) || [])[1];
  if (pageCanon && pageCanon !== u) {
    fail(`sitemap URL ${u} does not match page canonical ${pageCanon} in ${fsPath}`);
    canonMismatches++;
  }
}
if (!canonMismatches) ok(`all ${sitemapUrls.length} sitemap URLs match page rel=canonical tags exactly`);

// Step 6 guards the indexing policy in tools/i18n/config.mjs. The policy has two
// axes: locale (all eight indexable) and section (species is English-only), and
// a mirror is indexable only if its English original is not itself noindex.
// A generator that rewrites heads must not be able to silently re-invite Google
// into an excluded section, or leave it out of one that should be indexed.
console.log('Step 6: Checking locale + section indexing policy...');
const localeCodes = new Set(LOCALES.map((l) => l.code));
const ALT_HREF = /<link[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["']/gi;
const SLASH = String.fromCharCode(92); // path separator on Windows
const toRel = (abs) => abs.slice(ROOT.length + 1).split(SLASH).join('/');
let shouldBeIndexedButIsnt = 0, shouldBeNoindexButIsnt = 0, strayAlternate = 0;

for (const page of pages) {
  const rel = toRel(page);
  const first = rel.includes('/') ? rel.split('/')[0] : '';
  const inLocale = first !== 'en' && localeCodes.has(first);
  const code = inLocale ? first : 'en';
  const pageRel = inLocale ? rel.slice(code.length + 1) : rel;
  if (pageRel.startsWith('api/') || pageRel.startsWith('includes/')) continue;

  const html = readFileSync(page, 'utf8');
  const headEnd = html.indexOf('</head>');
  const pageHead = headEnd < 0 ? html : html.slice(0, headEnd);
  const noindexed = NOINDEX_RE.test(pageHead);

  // The English original's own decision is the third axis.
  const enPath = join(ROOT, pageRel);
  const enNoindex = existsSync(enPath) && NOINDEX_RE.test(readFileSync(enPath, 'utf8'));
  const shouldIndex = isPathIndexable(pageRel, code) && !enNoindex;

  if (shouldIndex && noindexed) {
    fail(rel + ': should be indexable but carries noindex (' + code + '/' + pageRel + ')');
    shouldBeIndexedButIsnt++;
  } else if (!shouldIndex && !noindexed) {
    fail(rel + ': excluded by policy but has no noindex tag');
    shouldBeNoindexButIsnt++;
  }

  // A cluster may only name locales in which this same page may be indexed.
  for (const m of pageHead.matchAll(ALT_HREF)) {
    const hcode = m[1];
    if (hcode === 'x-default') continue;
    if (!isPathIndexable(pageRel, hcode)) {
      fail(rel + ': hreflang="' + hcode + '" names a locale where ' + pageRel + ' is excluded');
      strayAlternate++;
    }
  }
}

// Same rule for the sitemap's alternates, which are generated separately.
for (const m of sitemap.matchAll(/<xhtml:link[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"[^>]*>/g)) {
  const hcode = m[1];
  const href = m[2];
  if (hcode === 'x-default' || hcode === 'en') continue;
  const p2 = href.slice(SITE.length).replace(/^[/]/, '');
  const pageRel = p2.startsWith(hcode + '/') ? p2.slice(hcode.length + 1) : p2;
  if (!isPathIndexable(pageRel, hcode)) {
    fail('sitemap advertises an alternate where ' + pageRel + ' is excluded: ' + href);
    strayAlternate++;
  }
}

// Coverage: a locale mirror that may be indexed must actually be advertised.
let unadvertised = 0;
for (const l of LOCALES) {
  if (l.code === 'en') continue;
  const probeAbs = join(ROOT, l.code, 'states', 'texas.html');
  if (!existsSync(probeAbs)) continue;
  const rel = toRel(probeAbs);
  const pageRel = rel.slice(l.code.length + 1);
  if (isPathIndexable(pageRel, l.code) && !sitemap.includes(SITE + '/' + rel)) {
    fail(rel + ': indexable mirror is missing from the sitemap');
    unadvertised++;
  }
}

if (!shouldBeIndexedButIsnt && !shouldBeNoindexButIsnt && !strayAlternate && !unadvertised) {
  const keep = LOCALES.filter((l) => isIndexable(l.code)).map((l) => l.code).join(', ');
  ok('policy holds: indexable locales (' + keep + '); excluded outside English: ' + (NON_INDEXABLE_SECTIONS.join(', ') || 'none'));
}

// Step 7: title + description length.
// Google cuts a result title at roughly 60 characters and a snippet at about
// 160. Nothing enforced this before 2026-11-02, and 984 of 1,228 English pages
// had drifted past 60 (max 87) because every template appended a fixed
// 20-character brand to a name that was already 20-30 characters long. The
// generators now fit titles through tools/lib/title-fit.mjs; this step is what
// keeps a future template edit from quietly reintroducing the drift.
//
// English is a hard failure. Locale mirrors are measured and reported but not
// failed: their length follows the translation rather than a template, so a
// verbose German rendering is not a build-blocking defect.
console.log('Step 7: Checking title and description lengths...');
const ENTITY_RE = /&(?:[a-z][a-z0-9]*|#\d+|#x[\da-f]+);/gi;
const plainLen = (s) => String(s).replace(ENTITY_RE, 'X').length;
const TITLE_MAX = 60;
const DESC_MAX = 160;
let longEnTitle = 0, longEnDesc = 0, longLocaleTitle = 0;
const worstLocale = [];

for (const page of pages) {
  const rel = toRel(page);
  const first = rel.includes('/') ? rel.split('/')[0] : '';
  const isEnglish = !localeCodes.has(first) || first === 'en';

  const html = readFileSync(page, 'utf8');
  const headEnd = html.indexOf('</head>');
  const pageHead = headEnd < 0 ? html : html.slice(0, headEnd);
  const titleM = pageHead.match(/<title>([\s\S]*?)<\/title>/i);
  if (!titleM) { fail(rel + ': no <title>'); continue; }
  const tLen = plainLen(titleM[1].trim());

  if (tLen > TITLE_MAX) {
    if (isEnglish) {
      fail(rel + ': title is ' + tLen + ' chars (max ' + TITLE_MAX + ')');
      longEnTitle++;
    } else {
      longLocaleTitle++;
      worstLocale.push([tLen, rel]);
    }
  }

  if (isEnglish) {
    const descM = pageHead.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']*)["']/i);
    if (descM) {
      const dLen = plainLen(descM[1].trim());
      if (dLen > DESC_MAX) {
        fail(rel + ': description is ' + dLen + ' chars (max ' + DESC_MAX + ')');
        longEnDesc++;
      }
    }
  }
}

if (!longEnTitle && !longEnDesc) {
  ok('English titles <= ' + TITLE_MAX + ' and descriptions <= ' + DESC_MAX + ' on every page');
}
if (longLocaleTitle) {
  worstLocale.sort((a, b) => b[0] - a[0]);
  console.log('  · note: ' + longLocaleTitle + ' localised title(s) exceed ' + TITLE_MAX +
    ' chars after translation (longest: ' + worstLocale[0][1] + ' at ' + worstLocale[0][0] + ')');
}

console.log(errors ? 'FAILED with ' + errors + ' error(s)' : 'All ' + checks + ' checks passed.');
process.exit(errors ? 1 : 0);
