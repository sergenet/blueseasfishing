#!/usr/bin/env node
/**
 * crawl-depth.mjs
 *
 * BFS from the homepage across internal links to compute every page's crawl
 * depth (minimum clicks from /). Flags pages deeper than MAX_DEPTH and pages
 * that are unreachable from the homepage entirely (orphans) even though they
 * exist on disk and in the sitemap.
 *
 * Run: node tools/crawl-depth.mjs
 * Exit 1 if over-depth or orphan pages exist beyond the known-and-accepted set.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_DEPTH = 3;

/** Directories where depth > 3 is a deliberate tradeoff (tracked here, not hidden). */
const KNOWN_DEEP = []; // e.g. 'species/' if we ever decide the long tail may sit deep

/** Orphans that are deliberate: 301 sources, noindex flow pages, backups. */
const KNOWN_ORPHANS = new Set([
  'gear-recommendations.html', // 301 -> recommended-fishing-gear.html
  'premium-success.html', // post-payment flow page, noindex
  'subscribe.html', // premium flow page, excluded from sitemap
  'community - Copy.html', // editor backup
]);

function urlToFile(href, sourcePage) {
  if (href.startsWith('//')) return null; // protocol-relative external
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return null; // mailto:, https:, etc.
  let p;
  if (href.startsWith('/')) {
    p = href;
  } else {
    if (href.startsWith('#')) return null; // same-page anchor
    const baseDir = sourcePage.includes('/') ? sourcePage.slice(0, sourcePage.lastIndexOf('/') + 1) : '';
    p = '/' + baseDir + href;
  }
  p = p.split('#')[0].split('?')[0];
  if (!p || p === '/') return 'index.html';
  if (p.endsWith('/')) p += 'index.html';
  if (!p.endsWith('.html')) return null; // assets, sitemap.xml, etc.
  // normalize '.' and '..' segments
  const norm = normalize(p.replace(/^\//, '')).replace(/\\/g, '/');
  if (norm.startsWith('..')) return null;
  const fsPath = join(ROOT, norm);
  return existsSync(fsPath) ? norm : `__MISSING__/${norm}`;
}

function collectPages(dir, out = []) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) {
      if (f.name === 'newsletter-issues') continue; // build artifacts, blocked from web
      collectPages(p, out);
    }
    else if (f.name.endsWith('.html') && !f.name.startsWith('index - ') && f.name !== '404.html') out.push(p);
  }
  return out;
}

const allPages = collectPages(ROOT).map((p) => p.slice(ROOT.length + 1).replace(/\\/g, '/'));
const allSet = new Set(allPages);

// BFS
const depth = new Map([['index.html', 0]]);
let frontier = ['index.html'];
const missing = new Set();
while (frontier.length) {
  const next = [];
  for (const page of frontier) {
    const d = depth.get(page);
    let html = '';
    try { html = readFileSync(join(ROOT, page), 'utf8'); } catch { continue; }
    html = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
    for (const m of html.matchAll(/href="([^"]*)"/g)) {
      const target = urlToFile(m[1], page);
      if (!target) continue;
      if (target.startsWith('__MISSING__')) { missing.add(target.slice(11)); continue; }
      if (!allSet.has(target)) continue;
      if (!depth.has(target)) { depth.set(target, d + 1); next.push(target); }
    }
  }
  frontier = next;
}

// Report
const byDepth = {};
for (const [, d] of depth) byDepth[d] = (byDepth[d] || 0) + 1;
console.log('Crawl depth from homepage:');
for (const d of Object.keys(byDepth).map(Number).sort((a, b) => a - b)) {
  console.log(`  depth ${d}: ${byDepth[d]} pages`);
}

const deep = allPages
  .filter((p) => depth.has(p) && depth.get(p) > MAX_DEPTH)
  .filter((p) => !KNOWN_DEEP.some((dir) => p.startsWith(dir)));
const orphans = allPages.filter((p) => !depth.has(p) && !KNOWN_ORPHANS.has(p));
const knownOrphanCount = allPages.filter((p) => !depth.has(p) && KNOWN_ORPHANS.has(p)).length;

if (deep.length) {
  console.log(`\nDeeper than ${MAX_DEPTH} clicks (${deep.length}):`);
  const byDir = new Map();
  for (const p of deep) {
    const dir = p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : '(root)';
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir).push(p);
  }
  for (const [dir, list] of [...byDir.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${dir}${list.length} pages, e.g. ${list[0]} (depth ${depth.get(list[0])})`);
  }
}
if (orphans.length) {
  console.log(`\nOrphans — exist on disk but unreachable from homepage (${orphans.length}):`);
  for (const p of orphans.slice(0, 25)) console.log(`  ${p}`);
  if (orphans.length > 25) console.log(`  …and ${orphans.length - 25} more`);
}
if (missing.size) {
  console.log(`\nInternal links to MISSING files (${missing.size} distinct):`);
  for (const p of [...missing].slice(0, 25)) console.log(`  ${p}`);
}

if (knownOrphanCount) console.log(`(${knownOrphanCount} additional orphans are known/intentional: 301 sources and flow pages.)`);
if (!deep.length && !orphans.length && !missing.size) console.log(`\nAll ${allPages.length} pages reachable within ${MAX_DEPTH} clicks. No orphans, no broken links.`);
else if (!deep.length && !orphans.length) console.log(`\nDepth and orphans OK; fix the ${missing.size} missing link target(s) above.`);
else console.log(`\nSummary: ${deep.length} over-depth, ${orphans.length} orphans, ${missing.size} missing targets.`);
process.exit(deep.length || orphans.length ? 1 : 0);
