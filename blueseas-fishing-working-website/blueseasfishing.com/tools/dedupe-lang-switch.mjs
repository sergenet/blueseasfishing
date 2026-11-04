#!/usr/bin/env node
// One-off cleanup: collapse duplicated lang-switch.js script tags injected by
// pre-rewrite transform runs (the old guard allowed repeats across runs).
// Keeps exactly one copy per file. Idempotent.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', 'tools', 'api', 'config', 'includes', 'newsletter-issues', '.idxwork']);
const TAG = '<script src="/assets/js/lang-switch.js?v=4" defer></script>';

let fixed = 0, scanned = 0;
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP.has(e.name) || e.name.startsWith('.')) continue;
      walk(join(dir, e.name));
    } else if (extname(e.name) === '.html') {
      const p = join(dir, e.name);
      const html = readFileSync(p, 'utf8');
      scanned++;
      const n = html.split(TAG).length - 1;
      if (n > 1) {
        // keep first occurrence, remove the rest
        let out = html;
        let seen = 0;
        out = out.replace(new RegExp(TAG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), () => (++seen === 1 ? TAG : ''));
        // tidy any blank lines left behind
        out = out.replace(/\n[ \t]*\n[ \t]*\n+/g, '\n');
        writeFileSync(p, out);
        fixed++;
      }
    }
  }
}
walk(ROOT);
console.log(`scanned ${scanned} html files, deduped ${fixed}`);
