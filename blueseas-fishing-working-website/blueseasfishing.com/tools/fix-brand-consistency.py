#!/usr/bin/env python3
"""Normalise the legacy brand string to the site's real name.

The site identifies itself as "Blue Seas Fishing" in its <title> on 447 pages,
in og:site_name, and in both its WebSite and Organization JSON-LD. Twelve older
hand-written pages and their 103 translations still carried the previous
identity, and the translations had also machine-translated the brand itself:

    BlueSeas Fishing With Serge      (all locales)
    BlueSeas Angeln mit Serge        (de)
    BlueSeas Pesca con Serge         (es)
    BlueSeas Pêcher avec Serge       (fr)
    BlueSeas Pescando com Serge      (pt)

Google builds a site name from consistent signals, so two competing names split
it. A brand name is a proper noun and is not translated.

Run:  python tools/fix-brand-consistency.py [--dry-run]
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = 'Blue Seas Fishing'
VARIANTS = [
    'BlueSeas Fishing With Serge',
    # Each locale's mirror build translated the brand too, and not always the
    # same way twice.
    'BlueSeas Angeln mit Serge',            # de
    'BlueSeas Pesca con Serge',             # es
    'BlueSeas Pescando con Serge',          # es (alt)
    'BlueSeas Pêcher avec Serge',           # fr
    'BlueSeas Pêche avec Serge',            # fr (alt)
    'BlueSeas Pesca com Serge',             # pt
    'BlueSeas Pescando com Serge',          # pt (alt)
    'BlueSeas Pescaria com Serge',          # pt (alt)
    'BlueSeas Рыбалка с Сержем',            # ru
    'BlueSeas Ψάρεμα με τον Serge',         # el
    'BlueSeas الصيد مع سيرج',                # ar
]
# Longest first so no variant is left partially replaced.
VARIANTS.sort(key=len, reverse=True)
RX = re.compile('|'.join(re.escape(v) for v in VARIANTS))

SKIP_DIRS = {'node_modules', 'tools', 'api', 'config', 'includes', 'newsletter-issues',
             '.idxwork', 'images', 'assets', 'icons', 'ios-project', 'android-project',
             '__pycache__', 'backup-p0-20261031-214210'}


def walk(base):
    for cur, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith('.')
                   and not d.startswith('backup')]
        for f in files:
            if f.endswith('.html'):
                yield os.path.join(cur, f)


def main():
    dry = '--dry-run' in sys.argv
    files = changed = hits = 0
    per_file = []
    for p in walk(ROOT):
        files += 1
        with open(p, encoding='utf-8', errors='replace', newline='') as fh:
            html = fh.read()
        # Test against every variant, not the Latin word "Serge": the Arabic,
        # Cyrillic and Greek translations contain no Latin text at all, and a
        # guard on "Serge" silently skipped 40 files.
        n = len(RX.findall(html))
        if not n:
            continue
        new = RX.sub(BRAND, html)
        if new == html:
            continue
        if not dry:
            with open(p, 'w', encoding='utf-8', newline='') as fh:
                fh.write(new)
        changed += 1
        hits += n
        per_file.append((n, os.path.relpath(p, ROOT).replace(os.sep, '/')))

    per_file.sort(reverse=True)
    print(f'{"[dry-run] " if dry else ""}{files} files scanned, '
          f'{changed} updated, {hits} brand strings replaced')
    for n, rel in per_file[:8]:
        print(f'   {n:3d}  {rel}')
    # Anything still containing a brand variant did not converge.
    leftovers = 0
    for p in walk(ROOT):
        with open(p, encoding='utf-8', errors='replace') as fh:
            h = fh.read()
        if RX.search(h):
            leftovers += 1
            print(f'   leftover: {os.path.relpath(p, ROOT).replace(os.sep, "/")}')
    print(f'files still carrying the old brand: {leftovers}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
