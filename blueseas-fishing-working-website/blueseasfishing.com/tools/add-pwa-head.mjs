#!/usr/bin/env node
/**
 * add-pwa-head.mjs
 *
 * Injects PWA wiring into every HTML page under the site root:
 *   <link rel="manifest" href="/site.webmanifest">
 *   <meta name="theme-color" content="#1d4ed8">
 *   <link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
 * and (once per page) registers /sw.js on window load.
 *
 * Idempotent: pages already containing site.webmanifest are skipped, so it is
 * safe to run on every monthly pipeline pass.
 *
 * Run:  node tools/add-pwa-head.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', 'newsletter-issues', 'tools', 'api']);

const MANIFEST_LINK = '<link rel="manifest" href="/site.webmanifest">';
const THEME_META = '<meta name="theme-color" content="#1d4ed8">';
const APPLE_ICON = '<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">';
const SW_REG = `<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function(){});
    });
  }
</script>`;

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(join(dir, entry.name));
    } else if (extname(entry.name) === '.html') {
      yield join(dir, entry.name);
    }
  }
}

let updated = 0, skipped = 0;
for (const path of walk(ROOT)) {
  const rel = relative(ROOT, path);
  let html;
  try { html = readFileSync(path, 'utf8'); } catch { continue; }

  if (html.includes('site.webmanifest')) { skipped++; continue; }

  const inject = [];
  if (!/rel=["']manifest["']/.test(html)) inject.push(MANIFEST_LINK);
  if (!/name=["']theme-color["']/.test(html)) inject.push(THEME_META);
  if (!/rel=["']apple-touch-icon["']/.test(html)) inject.push(APPLE_ICON);
  if (!html.includes('/sw.js')) inject.push(SW_REG);
  if (!inject.length) { skipped++; continue; }

  const block = '  ' + inject.join('\n  ');
  if (/<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, `${block}\n</head>`);
  } else {
    console.warn(`  ! no </head> in ${rel} — skipped`);
    continue;
  }
  writeFileSync(path, html);
  updated++;
}
console.log(`PWA head: ${updated} pages updated, ${skipped} already wired / skipped`);
