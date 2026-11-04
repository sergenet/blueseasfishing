#!/usr/bin/env node
/**
 * add-seo-head.mjs
 *
 * Injects Open Graph tags, Twitter card tags, and JSON-LD structured data
 * into the site's static content pages. Idempotent: pages that already have
 * og:title are skipped, so it is safe to re-run.
 *
 * Run:  node tools/add-seo-head.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.blueseasfishing.com';

// page file -> { jsonLdTypes } (og/twitter derived from existing head content)
const PAGES = {
  'blog.html': ['Blog', 'BreadcrumbList'],
  'gallery.html': ['CollectionPage', 'BreadcrumbList'],
  'fish-id.html': ['WebPage', 'BreadcrumbList'],
  'shop.html': ['CollectionPage', 'BreadcrumbList'],
  'community.html': ['WebPage', 'BreadcrumbList'],
  'recommended-fishing-gear.html': ['CollectionPage', 'BreadcrumbList'],
  'kayak-fish-finder-power-setup.html': ['Article', 'BreadcrumbList'],
  'tips-beginner-knots.html': ['Article', 'BreadcrumbList'],
  'tips-baits-lures.html': ['Article', 'BreadcrumbList'],
  'tips-deep-sea-techniques.html': ['Article', 'BreadcrumbList'],
  'tips-gear-setup.html': ['Article', 'BreadcrumbList'],
  'tips-safety-ethics.html': ['Article', 'BreadcrumbList'],
  'tips-seasonal-guide.html': ['Article', 'BreadcrumbList'],
  'tips-tackle-box-essentials.html': ['Article', 'BreadcrumbList'],
  'rainbow-trout-identification.html': ['BreadcrumbList'],          // already has Article
  'chinook-salmon-identification.html': ['BreadcrumbList'],
  'california-halibut-identification.html': ['BreadcrumbList'],
  'salmon-vs-trout-identification.html': ['BreadcrumbList'],
  'bluegill-vs-green-sunfish-identification.html': ['BreadcrumbList'],
  'walleye-vs-sauger-identification.html': ['BreadcrumbList'],
  'striped-bass-vs-white-bass-identification.html': ['BreadcrumbList'],
};

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function attr(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

function buildBlocks(file, html) {
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || 'Blue Seas Fishing';
  const desc = attr(html, /<meta\s+name="description"\s+content="([^"]*)"/i)
    || attr(html, /<meta\s+content="([^"]*)"\s+name="description"/i)
    || 'AI-assisted fish identification, species guides, and fishing tips.';
  let url = attr(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
  if (!url) url = `${SITE}/${file === 'index.html' ? '' : file}`;

  const og = [
    `  <meta property="og:type" content="website">`,
    `  <meta property="og:site_name" content="Blue Seas Fishing">`,
    `  <meta property="og:title" content="${esc(title)}">`,
    `  <meta property="og:description" content="${esc(desc)}">`,
    `  <meta property="og:url" content="${esc(url)}">`,
    `  <meta name="twitter:card" content="summary">`,
    `  <meta name="twitter:title" content="${esc(title)}">`,
    `  <meta name="twitter:description" content="${esc(desc)}">`,
  ].join('\n');

  const graph = [];
  for (const type of PAGES[file]) {
    if (type === 'BreadcrumbList') {
      const crumb2 = file === 'gallery.html' ? ['Species Database', `${SITE}/gallery.html`]
        : file === 'blog.html' ? ['Fishing Guides', `${SITE}/blog.html`]
        : file === 'fish-id.html' ? ['Identify a Fish', `${SITE}/fish-id.html`]
        : file === 'shop.html' ? ['Tips & Gear', `${SITE}/shop.html`]
        : /^tips-/.test(file) ? ['Fishing Tips', `${SITE}/blog.html`]
        : file.includes('identification') ? ['Species Guides', `${SITE}/gallery.html`]
        : ['Blue Seas Fishing', `${SITE}/`];
      graph.push({
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: crumb2[0], item: crumb2[1] },
          { '@type': 'ListItem', position: 3, name: title.replace(/\s*[|—].*$/, '').trim() },
        ],
      });
    } else if (type === 'Article') {
      graph.push({
        '@type': 'Article',
        headline: title.replace(/\s*[|—].*$/, '').trim(),
        description: desc,
        mainEntityOfPage: url,
        publisher: { '@type': 'Organization', name: 'Blue Seas Fishing', url: `${SITE}/` },
      });
    } else {
      graph.push({ '@type': type, name: title.replace(/\s*[|—].*$/, '').trim(), url });
    }
  }
  const ld = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;

  return { og, ld };
}

let updated = 0, skipped = 0, missing = 0;
for (const [file] of Object.entries(PAGES)) {
  const path = join(ROOT, file);
  let html;
  try {
    html = readFileSync(path, 'utf8');
  } catch {
    console.warn(`  ! ${file} not found`);
    missing++;
    continue;
  }
  if (/property="og:title"/.test(html)) { skipped++; continue; }

  const { og, ld } = buildBlocks(file, html);
  const canonicalRe = /(<link\s+rel="canonical"[^>]*>)/i;
  if (canonicalRe.test(html)) {
    html = html.replace(canonicalRe, `$1\n${og}\n  ${ld}`);
  } else {
    html = html.replace(/<\/head>/i, `${og}\n  ${ld}\n</head>`);
  }
  writeFileSync(path, html);
  updated++;
}
console.log(`SEO head: ${updated} pages updated, ${skipped} already done, ${missing} missing`);
