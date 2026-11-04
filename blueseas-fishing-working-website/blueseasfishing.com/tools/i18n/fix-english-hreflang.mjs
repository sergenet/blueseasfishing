#!/usr/bin/env node
// tools/i18n/fix-english-hreflang.mjs — give the English originals the same
// hreflang cluster their mirrors already advertise.
//
// Why this exists (2026-11-04):
//   Every locale mirror of a destinations / states / whats-biting /
//   fish-size-charts page emitted a full eight-language cluster, but the
//   English original emitted none:
//       destinations      97 EN pages, 0 with a cluster; 679 mirrors, all 679
//       whats-biting      13 EN pages, 0;                91 mirrors, all 91
//       fish-size-charts   6 EN pages, 0;                42 mirrors, all 42
//       states            52 EN pages, 0;               833 mirrors with one
//   hreflang is reciprocal by definition: Google only honours a cluster when
//   every URL in it confirms the others. A cluster that the English page never
//   answers is discarded, so those 2,000-odd annotations were doing nothing.
//
//   apply-locale-indexing.mjs does write English clusters, but it walks the
//   whole 8,989-file tree (~10 min on this filesystem) and it trusts
//   isPathIndexable() alone. That is not enough here: a URL must not be
//   advertised unless the mirror file actually exists, and it must not be
//   advertised when the mirror is itself noindex (species). So this pass walks
//   only the sections named on the command line and confirms each mirror on
//   disk before naming it.
//
// Run:  node tools/i18n/fix-english-hreflang.mjs [--dry-run] [sections...]
//       node tools/i18n/fix-english-hreflang.mjs            # default sections
//       node tools/i18n/fix-english-hreflang.mjs .          # root-level pages
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALES, isPathIndexable } from './config.mjs';
import { hreflangFor, hasNoindex } from './head.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const DRY = process.argv.includes('--dry-run');
const ARGS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const SECTIONS = ARGS.length
    ? ARGS
    : ['destinations', 'states', 'whats-biting', 'fish-size-charts', 'guides'];

const ALT_RE = /<link[^>]*rel=["']alternate["'][^>]*hreflang=["'][^"']+["'][^>]*>/gi;
const PAIR_RE = /<link[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
const CODES = LOCALES.map((l) => l.code).filter((c) => c !== 'en');

/** Mirror path for an English relative path, and whether it may be advertised. */
function mirrorUsable(rel, code) {
    if (!isPathIndexable(rel, code)) return false;
    const abs = join(ROOT, code, rel);
    if (!existsSync(abs)) return false;
    // A noindex mirror must never be named in a cluster.
    return !hasNoindex(readFileSync(abs, 'utf8'));
}

/** Cluster codes for `rel`: English plus every mirror that is real and indexable. */
function clusterCodes(rel) {
    const codes = ['en', ...CODES.filter((c) => mirrorUsable(rel, c))];
    return codes;
}

function desiredPairs(rel, codes) {
    const pairs = codes.map((c) => [c, hreflangFor(rel, c)]);
    pairs.push(['x-default', hreflangFor(rel, 'en')]);
    return pairs;
}

function buildBlock(pairs) {
    return pairs
        .map(([c, href]) => `<link rel="alternate" hreflang="${c}" href="${href}">`)
        .join('\n  ');
}

/** True when the page already advertises exactly this cluster (order-insensitive). */
function alreadyCorrect(head, pairs) {
    const have = [...head.matchAll(PAIR_RE)].map((m) => `${m[1]}|${m[2]}`).sort();
    const want = pairs.map(([c, href]) => `${c}|${href}`).sort();
    return have.length === want.length && have.every((v, i) => v === want[i]);
}

function walk(dir) {
    const out = [];
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) {
            if (e.name.startsWith('.') || e.name.startsWith('backup')) continue;
            out.push(...walk(join(dir, e.name)));
        } else if (e.name.endsWith('.html')) {
            out.push(join(dir, e.name));
        }
    }
    return out;
}

let scanned = 0, changed = 0, skippedNoindex = 0, skippedTooFew = 0, fileErrors = 0;
const relOf = (abs) => abs.slice(ROOT.length + 1).replace(/\\/g, '/');

for (const sect of SECTIONS) {
    const dir = sect === '.' ? ROOT : join(ROOT, sect);
    if (!existsSync(dir)) { console.log(`  · ${sect}: no such directory, skipped`); continue; }
    // A section walk is recursive; the root walk is not (it must not re-enter
    // the locale trees, which already carry their clusters).
    const files = sect === '.' ? walk(dir).filter((f) => dirname(f) === ROOT) : walk(dir);

    let sChanged = 0, sScanned = 0;
    for (const abs of files) {
        const rel = relOf(abs);
        sScanned++; scanned++;
        let html;
        try {
            html = readFileSync(abs, 'utf8');
        } catch (e) {
            console.error(`  ! ${rel}: ${e.message}`);
            fileErrors++;
            continue;
        }
        if (hasNoindex(html)) { skippedNoindex++; continue; }

        const codes = clusterCodes(rel);
        if (codes.length < 2) { skippedTooFew++; continue; }

        const pairs = desiredPairs(rel, codes);

        const i = html.search(/<\/head>/i);
        if (i < 0) { console.error(`  ! ${rel}: no </head>`); fileErrors++; continue; }
        const head = html.slice(0, i);
        // Leave an already-correct cluster byte-for-byte alone: rewriting it
        // only for indentation would churn 239 files on every run.
        if (alreadyCorrect(head, pairs)) continue;
        const block = buildBlock(pairs);

        // Replace the existing run if there is one, else insert before </head>.
        let nextHead;
        if (ALT_RE.test(head)) {
            let first = true;
            nextHead = head.replace(/(?:<link[^>]*rel=["']alternate["'][^>]*hreflang=["'][^"']+["'][^>]*>[ \t]*\r?\n?[ \t]*)+/i,
                () => {
                    if (!first) return '';
                    first = false;
                    return `${block}\n  `;
                });
        } else {
            const nl = head.endsWith('\n') ? '' : '\n';
            nextHead = `${head}${nl}  ${block}\n`;
        }
        const out = nextHead + html.slice(i);
        if (out === html) continue;
        if (!DRY) writeFileSync(abs, out);
        changed++; sChanged++;
    }
    console.log(`  ${sect.padEnd(18)} scanned ${String(sScanned).padStart(5)}  `
        + `rewritten ${String(sChanged).padStart(5)}`);
}

console.log(`\n${DRY ? '[dry-run] ' : ''}reciprocal hreflang:`);
console.log(`  scanned                    : ${scanned}`);
console.log(`  rewritten                  : ${changed}`);
console.log(`  skipped (page is noindex)  : ${skippedNoindex}`);
console.log(`  skipped (no usable mirror) : ${skippedTooFew}`);
if (fileErrors) console.log(`  failed                     : ${fileErrors}`);
process.exit(fileErrors ? 1 : 0);
