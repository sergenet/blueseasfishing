#!/usr/bin/env node
/**
 * compress-images.mjs
 *
 * Converts images/species/*.{jpg,jpeg,png} and images/destinations/*.{jpg,png}
 * to display-sized WebP (species 900px, destinations 1280px, q=80).
 * Moves originals to _originals-webp/<dir>/ so the web root ships only webp.
 * Emits tools/.webp-renames.json mapping old-rel-path -> new-rel-path.
 *
 * Run:  node tools/compress-images.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BACKUP = join(dirname(ROOT), '_originals-webp');

const DIRS = [
  { dir: join(ROOT, 'images/species'), max: 900 },
  { dir: join(ROOT, 'images/destinations'), max: 1280 },
];

for (const { dir, max } of DIRS) {
  const rel = relative(ROOT, dir).replace(/\\/g, '/');
  const bdir = join(BACKUP, rel);
  mkdirSync(bdir, { recursive: true });
  mkdirSync(dir, { recursive: true });

  const renames = {};
  const mapPath = join(ROOT, 'tools/.webp-renames.json');
  if (existsSync(mapPath)) Object.assign(renames, JSON.parse(readFileSync(mapPath, 'utf8')));

  let done = 0, saved = 0, skipped = 0;
  for (const f of readdirSync(dir)) {
    const src = join(dir, f);
    if (!statSync(src).isFile()) continue;
    const ext = extname(f).toLowerCase();
    const slug = f.slice(0, -ext.length);
    const outName = `${slug}.webp`;
    const out = join(dir, outName);
    const relOld = `/${rel}/${f}`;
    const relNew = `/${rel}/${outName}`;

    if (ext === '.webp') continue; // already webp (2 species files)
    if (existsSync(out)) { skipped++; continue; }

    // Pillow round-trip: convert + resize + strip metadata
    execFileSync('python', ['-c', `
import sys
from PIL import Image
src, dst, mx = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src)
im.load()
if im.mode not in ('RGB', 'L'):
    im = im.convert('RGB')
w, h = im.size
if max(w, h) > mx:
    s = mx / max(w, h)
    im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
im.save(dst, 'WEBP', quality=80, method=6)
`, src, out, String(max)], { stdio: 'pipe' });

    const sb = statSync(src).size, sa = statSync(out).size;
    // move original out of the web root
    writeFileSync(join(bdir, f), readFileSync(src));
    rmSync(src);
    renames[relOld] = relNew;
    done++; saved += sb - sa;
    if (done % 50 === 0) {
      console.log(`  ${rel}: ${done} done, ${(saved / 1048576).toFixed(0)} MB saved`);
      writeFileSync(mapPath, JSON.stringify(renames, null, 1));
    }
  }
  console.log(`${rel}: converted ${done}, skipped(existing webp) ${skipped}, saved ${(saved / 1048576).toFixed(1)} MB`);
  writeFileSync(join(ROOT, 'tools/.webp-renames.json'), JSON.stringify(renames, null, 1));
}
console.log('Backup location: ' + BACKUP);
