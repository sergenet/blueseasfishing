// tools/i18n/transform.mjs — per-page HTML transformation for one locale.
//
// Design (single-pass, marker-safe):
//   1. mask()     scripts/styles/JSON-LD/comments/doctypes → \u0000M{n}\u0000 (restored last)
//   2. tag pass   meta[content] + safe text attrs → unit markers INSIDE tags
//   3. text pass  split once on tags; text segments split AROUND mask markers;
//                 translatable chunks → unit markers. (markers are never re-scanned)
//   4. translate  via mt.mjs (cache + glossary on the wire)
//   5. substitute all \u0001{n}\u0001 once → translate links/lang/canonical/hreflang → unmask
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALES, SITE, TEXT_ATTRS, META_TEXT, SKIP_FILES, isPathIndexable } from './config.mjs';
import { applyHeadPolicy, hasNoindex, hreflangFor } from './head.mjs';
import { translateBatch } from './mt.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..'); // site root

// ---------- masking ----------
function mask(html) {
  const store = [];
  const put = (s) => { store.push(s); return `\u0000M${store.length - 1}\u0000`; };
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, (m) => put(m));
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (m) => put(m));
  html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (m) => put(m));
  html = html.replace(/<!--[\s\S]*?-->/g, (m) => put(m));
  html = html.replace(/<!doctype[^>]*>/gi, (m) => put(m));
  return { html, store };
}
function unmask(html, store) {
  return html.replace(/\u0000M(\d+)\u0000/g, (_, i) => store[+i] ?? '');
}

// ---------- URL helpers ----------
const SHARED_PREFIX = /^\/(assets|images|icons|api|newsletter-issues)\//;
const SHARED_EXACT = /^\/(sw\.js|site\.webmanifest|robots\.txt|ads\.txt|favicon\.ico|sitemap\.xml|offline\.html|404\.html|branding\.js|branding-live\.js|analytics-consent\.js|membership\.js|meta-seo\.js|money-config\.js|gear-affiliate-tracker\.js)/;

function shouldPrefix(pathname, code) {
  if (code === 'en') return false;
  if (SHARED_PREFIX.test(pathname) || SHARED_EXACT.test(pathname)) return false;
  for (const l of LOCALES) {
    if (pathname === `/${l.code}` || pathname.startsWith(`/${l.code}/`)) return false;
  }
  // Never prefix pages that aren't mirrored in THIS locale (backups, 301
  // sources, and SKIP_FILES pages). SKIP_FILES pages now have locale copies
  // (mirror-auth.mjs generates login/premium/subscribe/members-area/
  // premium-success/trip-planner/gear-recommendations per language), so
  // prefix them once the locale file actually exists — keeps links pointing
  // at the localized copy instead of the English page.
  const base = pathname.split('/').pop();
  if (SKIP_FILES.has(base) && !existsSync(join(ROOT, code, base))) return false;
  if (/ - Copy| - copy|\(backup\)|~$/.test(base)) return false;
  return true;
}

// Resolve href relative to the source page → {path, queryHash} or null (external/anchor/...).
function resolveHref(href, fromRel) {
  if (!href) return null;
  if (/^(https?:)?\/\//i.test(href)) {
    if (href.startsWith(SITE)) href = href.slice(SITE.length) || '/';
    else return null;
  }
  if (href.startsWith('#') || /^(mailto|javascript|data|tel):/i.test(href)) return null;
  const m = href.match(/^([^?#]*)([\s\S]*)$/);
  let p = m[1];
  const queryHash = m[2];
  if (!p.startsWith('/')) {
    const dir = fromRel.includes('/') ? fromRel.slice(0, fromRel.lastIndexOf('/')) : '';
    p = '/' + (dir ? dir + '/' + p : p);
  }
  const parts = [];
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return { path: '/' + parts.join('/'), queryHash };
}

const MASK_RE = /\u0000M\d+\u0000/;

// ---------- main ----------
// Returns { html, fallbacks } — fallbacks > 0 means some text stayed English
// (MT quota hit) and the page must be rebuilt on the next run.
export async function transformPage(relPath, sourceHtml, code, opts = {}) {
  const stats = opts.stats || {};
  // Allow the caller to swap the MT transport (opts.translateBatch) without
  // changing this file. Defaults to the mt.mjs batch translator.
  const doTranslate = opts.translateBatch || translateBatch;
  const src0 = sourceHtml.replace(/[\u0000\u0001]/g, '');
  const { html: masked, store } = mask(src0);
  let html = masked;
  const TRANSLATE = code !== 'en';
  const units = [];
  const marker = () => `\u0001${units.length}\u0001`; // index BEFORE push

  if (TRANSLATE) {
    // --- pass A: tag interiors (meta content + safe attrs) ---
    html = html.replace(/<[a-zA-Z][^>]*>/g, (tag) => {
      let t = tag;
      // meta content
      const nm = t.match(/^(<meta\b[^>]*?)$/i);
      if (nm) {
        const nameM = t.match(/(name|property)\s*=\s*["']([^"']+)["']/i);
        const cM = t.match(/content\s*=\s*["']([^"']*)["']/i);
        if (nameM && cM && cM[1].trim() && META_TEXT.test(nameM[2]) && /[A-Za-zÀ-ɏ]/.test(cM[1])) {
          const ph = marker();
          units.push({ src: cM[1].trim(), raw: cM[1], kind: 'meta' });
          t = t.replace(/content\s*=\s*["'][^"']*["']/i, `content="${ph}"`);
        }
        return t;
      }
      // safe text attrs
      const attrRe = new RegExp(`\\s(${TEXT_ATTRS.join('|')})\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i');
      return t.replace(attrRe, (mm, name, _q, dq, sq) => {
        const val = dq != null ? dq : sq;
        if (!val || !val.trim() || !/[A-Za-zÀ-ɏ]/.test(val)) return mm;
        const ph = marker();
        units.push({ src: val.trim(), raw: val, kind: 'attr' });
        return ` ${name}="${ph}"`;
      });
    });

    // --- pass B: text segments (single split; split around mask markers) ---
    const parts = html.split(/(<[^>]+>)/);
    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i];
      if (seg.startsWith('<')) continue;
      if (!seg.trim() || !/[A-Za-zÀ-ɏ]/.test(seg)) continue;
      // split around mask markers so scripts/comments survive untouched
      const chunks = seg.split(new RegExp(`(${MASK_RE.source})`, 'g'));
      parts[i] = chunks.map((c) => {
        if (MASK_RE.test(c) && c === c.match(MASK_RE)?.[0]) return c; // pure marker
        if (!c.trim() || !/[A-Za-zÀ-ɏ]/.test(c)) return c;
        // A–Z letter anchors ("A" … "Z") must stay Latin letters — MT turns
        // them into translated articles ("A" → "un"/"una"). Never send them.
        if (/^[A-Z]$/.test(c.trim())) return c;
        const ph = marker();
        units.push({ src: c, raw: c, kind: 'node' });
        return ph;
      }).join('');
    }
    html = parts.join('');

    // --- translate + substitute (one shot) ---
    if (units.length) {
      const translated = await doTranslate(
        units.map((u) => u.src), code, opts.cache, opts.onProgress, stats
      );
      units.forEach((u, i) => { u.dst = translated[i]; });
      html = html.replace(/\u0001(\d+)\u0001/g, (mm, n) => {
        const u = units[+n];
        if (!u) return mm;
        const lead = u.raw.match(/^\s*/)[0];
        const trail = u.raw.match(/\s*$/)[0];
        return lead + u.dst + trail;
      });
    }
  }

  // --- link rewriting (locale only) ---
  if (code !== 'en') {
    html = html.replace(/\s(href|src)\s*=\s*("([^"]*)"|'([^']*)')/gi, (mm, attr, _q, dq, sq) => {
      const val = dq != null ? dq : sq;
      const res = resolveHref(val, relPath);
      if (!res) return mm;
      const { path, queryHash } = res;
      if (!shouldPrefix(path, code)) return mm;
      const target = path.endsWith('/') ? path + 'index.html' : path;
      if (!existsSync(join(ROOT, target.replace(/^\//, '')))) return mm; // dead link → leave
      const newPath = path === '/' ? `/${code}/` : `/${code}${path}`;
      return ` ${attr}="${newPath}${queryHash}"`;
    });
  }

  // --- html lang/dir ---
  html = html.replace(/<html\b([^>]*)>/i, (mm, attrs) => {
    const loc = LOCALES.find((l) => l.code === code);
    let a = attrs.replace(/\s(lang|dir)\s*=\s*("[^"]*"|'[^']*')/gi, '');
    a = a.replace(/\s+/g, ' ').replace(/\s$/, '');
    return `<html${a} lang="${code}" dir="${loc.dir}">`;
  });

  // --- canonical ---
  const canonical = hreflangFor(relPath, code);
  if (/<link\s+rel="canonical"[^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${canonical}">`);
  } else {
    html = html.replace(/<\/head>/i, `  <link rel="canonical" href="${canonical}">\n</head>`);
  }

  // --- hreflang cluster + robots directive (policy lives in config.mjs) ---
  // A page that may be indexed advertises the indexable locales only. A page
  // that may not — a dropped locale, or a mirror of an English noindex page
  // such as the duplicate state x month set — carries noindex,follow and
  // advertises nothing: Google ignores annotations on and at noindex URLs, so
  // leaving the cluster there is a contradictory signal.
  html = applyHeadPolicy(html, relPath, {
    indexable: isPathIndexable(relPath, code) && !hasNoindex(html),
  });

  // --- og/twitter url ---
  html = html.replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/i, `$1${canonical}$2`);
  html = html.replace(/(<meta\s+name="twitter:url"\s+content=")[^"]*(")/i, `$1${canonical}$2`);

  // --- switcher + rtl ---
  // Guard on the PRE-mask source: mask() hides <script> bodies, so checking the
  // masked `html` never sees lang-switch.js and would re-inject it every run.
  if (!src0.includes('lang-switch.js')) {
    html = html.replace(/<\/body>/i, `  <script src="/assets/js/lang-switch.js?v=5" defer></script>\n</body>`);
  }
  if (code === 'ar' && !src0.includes('rtl.css')) {
    html = html.replace(/<\/head>/i, `  <link rel="stylesheet" href="/assets/css/rtl.css?v=20261017-1">\n</head>`);
  }

  return { html: unmask(html, store), fallbacks: stats.fallbacks || 0 };
}
