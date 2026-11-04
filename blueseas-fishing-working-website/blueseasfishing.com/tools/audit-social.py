#!/usr/bin/env python3
"""Report social-tag coverage per section. Read-only."""
import os, re
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOC = {'es', 'fr', 'de', 'pt', 'ru', 'el', 'ar'}
SKIP = {'node_modules', 'tools', 'api', 'config', 'includes', 'newsletter-issues',
        '.idxwork', 'images', 'assets', 'icons', 'ios-project', 'android-project',
        '__pycache__'} | LOC

og = re.compile(r'<meta\s+property=["\']og:image["\']', re.I)
tw = re.compile(r'<meta\s+name=["\']twitter:image["\']', re.I)
twc = re.compile(r'<meta\s+name=["\']twitter:card["\']', re.I)


def walk(b):
    for e in sorted(os.scandir(b), key=lambda x: x.name):
        if e.is_dir():
            if e.name.startswith('.') or e.name in SKIP:
                continue
            if re.match(r'^backup', e.name, re.I):
                continue
            yield from walk(e.path)
        elif e.name.endswith('.html'):
            yield e.path


tot, miss, twmiss, cardmiss = Counter(), Counter(), Counter(), Counter()
for p in walk(ROOT):
    rel = os.path.relpath(p, ROOT).replace(os.sep, '/')
    sect = rel.split('/')[0] if '/' in rel else '(root)'
    h = open(p, encoding='utf-8', errors='replace').read()
    tot[sect] += 1
    if not og.search(h):
        miss[sect] += 1
    if not tw.search(h):
        twmiss[sect] += 1
    if not twc.search(h):
        cardmiss[sect] += 1

print(f"{'section':22s} {'files':>6s} {'no og:image':>12s} {'no tw:image':>12s} {'no tw:card':>11s}")
for s in sorted(tot, key=lambda x: (-miss[x], x)):
    print(f"{s:22s} {tot[s]:6d} {miss[s]:12d} {twmiss[s]:12d} {cardmiss[s]:11d}")
print(f"{'TOTAL':22s} {sum(tot.values()):6d} {sum(miss.values()):12d} "
      f"{sum(twmiss.values()):12d} {sum(cardmiss.values()):11d}")
