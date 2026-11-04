// tools/i18n/head.mjs — head-level SEO policy shared by every writer.
//
// One implementation of three decisions, because getting them out of sync is
// what this file exists to prevent:
//   1. which URLs an hreflang cluster may name  (config.INDEXABLE)
//   2. whether a page carries `noindex,follow`
//   3. how the cluster and the robots directive are written
//
// Consumers: transform.mjs (the MT build), sync-robots-meta.mjs (the
// no-MT repair pass), apply-locale-indexing.mjs (one-off re-stamp), and
// generate-sitemap.mjs (alternates). No fs, no network, no MT imports — safe to
// import anywhere.

import { SITE, HREFLANG_LOCALES, isPathIndexable } from './config.mjs';

// A single `<link rel="alternate" hreflang=".." href="..">` tag.
const ALT_TAG = String.raw`<link\s+rel=["']alternate["']\s+hreflang=["'][^"']*["']\s+href=["'][^"']*["']\s*\/?>`;
export const ALT_HREFLANG_RE = new RegExp(ALT_TAG, 'i');
export const ALT_HREFLANG_GLOBAL_RE = new RegExp(ALT_TAG, 'gi');
// A run of alternate links, as transform.mjs has always rewritten them.
const ALT_RUN_RE = new RegExp(String.raw`(?:${ALT_TAG}\s*)+`, 'i');

const ROBOTS_RE = /<meta\s+name=["']robots["'][^>]*>/gi;
const NOINDEX_RE = /content\s*=\s*["'][^"']*noindex/i;

/** The noindex directive written site-wide (matches generate-states.mjs). */
export const NOINDEX_TAG = '<meta name="robots" content="noindex,follow">';

export function hasNoindex(html) {
  // Only look inside <head>; a stray "noindex" in body copy must not count.
  const head = headOf(html);
  for (const tag of head.match(ROBOTS_RE) || []) if (NOINDEX_RE.test(tag)) return true;
  return false;
}

function headOf(html) {
  const i = html.search(/<\/head>/i);
  return i < 0 ? html : html.slice(0, i);
}

/** Ensure the page carries `noindex,follow` exactly once. Idempotent. */
export function setNoindex(html) {
  const i = html.search(/<\/head>/i);
  if (i < 0 || hasNoindex(html)) return html;
  let replaced = false;
  const head = html.slice(0, i).replace(ROBOTS_RE, (tag) => {
    if (replaced) return tag;
    const next = tag.replace(/content\s*=\s*(["'])[^"']*\1/i, 'content="noindex,follow"');
    if (next === tag) return tag; // no content= attribute — keep looking
    replaced = true;
    return next;
  });
  const out = replaced ? head : `${html.slice(0, i)}  ${NOINDEX_TAG}\n`;
  return out + html.slice(i);
}

/**
 * Remove a noindex robots directive. The site writes a single robots directive
 * per page (`noindex,follow`), so the whole tag goes — this is not a
 * directive-level editor for multi-directive meta tags.
 */
export function clearNoindex(html) {
  const i = html.search(/<\/head>/i);
  if (i < 0) return html;
  const head = html.slice(0, i);
  if (!hasNoindex(head)) return html;
  const cleaned = head.replace(/(?:\r?\n)?[ \t]*<meta\s+name=["']robots["'][^>]*>[ \t]*\r?\n?/gi,
    (tag) => (NOINDEX_RE.test(tag) ? '' : tag));
  return cleaned + html.slice(i);
}

/** Canonical URL of relPath in `code`, mirroring the on-disk layout. */
export function hreflangFor(relPath, code) {
  if (relPath === 'index.html') {
    return code === 'en' ? `${SITE}/` : `${SITE}/${code}/`;
  }
  if (relPath.endsWith('/index.html')) {
    const dir = relPath.slice(0, -'index.html'.length);
    return code === 'en' ? `${SITE}/${dir}` : `${SITE}/${code}/${dir}`;
  }
  return code === 'en' ? `${SITE}/${relPath}` : `${SITE}/${code}/${relPath}`;
}

/**
 * The cluster: one link per locale that may actually index this page, plus
 * x-default → English.
 *
 * Filtered per page, not just per locale: a species page is indexable in
 * English only (NON_INDEXABLE_SECTIONS), so its cluster must not advertise the
 * seven mirrors that carry noindex — that is the contradiction verify-seo
 * Step 6 fails on.
 */
export function hreflangBlock(relPath) {
  const links = HREFLANG_LOCALES
    .filter((l) => isPathIndexable(relPath, l.code))
    .map((l) => `<link rel="alternate" hreflang="${l.code}" href="${hreflangFor(relPath, l.code)}">`);
  links.push(`<link rel="alternate" hreflang="x-default" href="${hreflangFor(relPath, 'en')}">`);
  return links.join('\n  ');
}

/** Remove every alternate-hreflang link from the head. Idempotent. */
export function stripHreflangCluster(html) {
  const i = html.search(/<\/head>/i);
  if (i < 0 || !ALT_HREFLANG_RE.test(html)) return html; // nothing to strip
  const head = html.slice(0, i)
    .replace(ALT_HREFLANG_GLOBAL_RE, '')
    // lines that held nothing but a cluster tag are now blank indentation…
    .replace(/^[ \t]+$/gm, '')
    // …and the run they made collapses to the single newline it replaced
    .replace(/(?:\r?\n){2,}/g, '\n');
  return head + html.slice(i);
}

/**
 * Write the cluster for a page that may be indexed: rewrite the existing run in
 * place (so the surrounding indentation is preserved), else insert before
 * </head>. Idempotent.
 */
export function writeHreflangCluster(html, relPath) {
  const i = html.search(/<\/head>/i);
  if (i < 0) return html;
  const head = html.slice(0, i);
  const block = hreflangBlock(relPath);
  // Insert on its own line(s): without the leading newline the first link is
  // glued to whatever ended <head> (usually </script>), and the next run then
  // rewrites the indentation — i.e. the file needed two passes to converge.
  // Both branches must end the cluster the same way, or the file needs two passes:
  // the insert branch added a trailing newline while the replace branch swallowed it
  // (ALT_RUN_RE consumes trailing whitespace), gluing the last link to </head> and
  // making the next run rewrite the file again. Measured 2026-11-01 on the
  // noindex -> indexable flip: 49 mirrors rewritten twice per run.
  const needsNewline = !head.endsWith('\n');
  const nextHead = ALT_HREFLANG_RE.test(head)
    ? head.replace(ALT_RUN_RE, () => `${block}\n`)
    : `${head}${needsNewline ? '\n' : ''}  ${block}\n`;
  return nextHead + html.slice(i);
}

/**
 * Apply the full head policy to one page.
 * @param {string} html
 * @param {string} relPath  site-relative path, no locale prefix
 * @param {{ indexable: boolean }} opts
 */
export function applyHeadPolicy(html, relPath, { indexable }) {
  return indexable
    ? writeHreflangCluster(clearNoindex(html), relPath)
    : setNoindex(stripHreflangCluster(html));
}
