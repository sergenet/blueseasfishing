#!/usr/bin/env python3
"""Find locale mirrors whose <title> or description is still the English text.

Read-only. Reports per locale and section, and lists indices for the worst cases.
"""
import os, re, html as H
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCALES = ['es', 'fr', 'de', 'pt', 'ru', 'el', 'ar']
SECTIONS = ['destinations', 'states', 'whats-biting', 'fish-size-charts', 'guides', 'species', '']
TITLE = re.compile(r'<title[^>]*>(.*?)</title>', re.S | re.I)
DESC = re.compile(r'<meta\s+name=["\']description["\'][^>]*content=["\']([^"\']*)', re.I)


HEAD_BYTES = 12000

def get(path, rx):
    # The head always sits in the first few KB; reading whole 40 KB pages for
    # 9,000 files takes minutes on this filesystem for no benefit.
    if not os.path.exists(path):
        return None
    with open(path, encoding='utf-8', errors='replace') as fh:
        h = fh.read(HEAD_BYTES)
    i = h.lower().find('</head>')
    head = h[:i] if i >= 0 else h
    m = rx.search(head)
    return H.unescape(re.sub(r'\s+', ' ', m.group(1))).strip() if m else ''


def norm(s):
    return re.sub(r'\s+', ' ', (s or '')).strip().lower()


stats = defaultdict(Counter)
examples = defaultdict(list)
by_section = defaultdict(Counter)

for code in LOCALES:
    for sect in SECTIONS:
        en_dir = os.path.join(ROOT, sect) if sect else ROOT
        loc_dir = os.path.join(ROOT, code, sect) if sect else os.path.join(ROOT, code)
        if not os.path.isdir(loc_dir):
            continue
        for cur, dirs, files in os.walk(loc_dir):
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            for f in files:
                if not f.endswith('.html'):
                    continue
                lp = os.path.join(cur, f)
                rel = os.path.relpath(lp, loc_dir).replace(os.sep, '/')
                ep = os.path.join(en_dir, rel)
                if sect == '' and os.path.dirname(lp) != loc_dir:
                    continue
                if not os.path.exists(ep):
                    continue
                lt, et = get(lp, TITLE), get(ep, TITLE)
                ld, ed = get(lp, DESC), get(ep, DESC)
                key = sect or '(root)'
                stats[code]['checked'] += 1
                by_section[key]['checked'] += 1
                if lt and et and norm(lt) == norm(et):
                    stats[code]['title english'] += 1
                    by_section[key]['title english'] += 1
                    if len(examples[code]) < 4:
                        examples[code].append(f'{key}/{rel}')
                if ld and ed and norm(ld) == norm(ed):
                    stats[code]['desc english'] += 1
                    by_section[key]['desc english'] += 1

print(f"{'locale':8s} {'checked':>8s} {'title EN':>9s} {'desc EN':>9s}")
for code in LOCALES:
    s = stats[code]
    print(f"{code:8s} {s['checked']:8d} {s['title english']:9d} {s['desc english']:9d}")

print(f"\n{'section':18s} {'checked':>8s} {'title EN':>9s} {'desc EN':>9s}")
for sect in SECTIONS:
    s = by_section[sect or '(root)']
    print(f"{sect or '(root)':18s} {s['checked']:8d} {s['title english']:9d} {s['desc english']:9d}")

print('\n=== examples of untranslated titles ===')
for code in LOCALES:
    if examples[code]:
        print(f'  {code}: ' + ', '.join(examples[code]))
