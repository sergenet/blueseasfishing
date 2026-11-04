#!/usr/bin/env python3
"""Compare hreflang clusters between the English original and its mirrors.

Read-only. For each section, reports how many English pages carry a cluster and
how many of their mirrors do, so an asymmetric (one-directional) cluster shows up.
"""
import os, re
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCALES = ['es', 'fr', 'de', 'pt', 'ru', 'el', 'ar']
ALT = re.compile(r'<link[^>]*rel=["\']alternate["\'][^>]*hreflang=["\']([^"\']+)', re.I)
NOIDX = re.compile(r'<meta\s+name=["\']robots["\'][^>]*content=["\'][^"\']*noindex', re.I)
SECTIONS = ['destinations', 'states', 'species', 'whats-biting', 'fish-size-charts', 'guides', '']


def html_in(d, recursive=True):
    out = []
    if not os.path.isdir(d):
        return out
    if recursive:
        for base, _, files in os.walk(d):
            for f in files:
                if f.endswith('.html'):
                    out.append(os.path.join(base, f))
    else:
        for f in os.listdir(d):
            p = os.path.join(d, f)
            if os.path.isfile(p) and f.endswith('.html'):
                out.append(p)
    return out


def info(path):
    h = open(path, encoding='utf-8', errors='replace').read()
    head = h[:h.lower().find('</head>')] if '</head>' in h.lower() else h
    return set(c for c in ALT.findall(head) if c != 'x-default'), bool(NOIDX.search(head))


print(f"{'section':18s} {'EN pages':>9s} {'EN w/cluster':>13s} {'EN noindex':>11s} "
      f"{'mirrors':>8s} {'mir w/cluster':>14s}")
for sect in SECTIONS:
    en_dir = os.path.join(ROOT, sect) if sect else ROOT
    en_files = [p for p in html_in(en_dir, recursive=bool(sect))
                if os.path.dirname(p) == en_dir or sect]
    en_files = [p for p in en_files
                if not (sect == 'states' and os.path.dirname(p) != en_dir)]
    en_with = en_noidx = 0
    for p in en_files:
        codes, noidx = info(p)
        if codes:
            en_with += 1
        if noidx:
            en_noidx += 1
    mir = mir_with = 0
    for code in LOCALES:
        base = os.path.join(ROOT, code, sect) if sect else None
        if not base:
            continue
        for p in html_in(base):
            rel = os.path.relpath(p, base)
            enp = os.path.join(en_dir, rel)
            if not os.path.exists(enp):
                continue
            mir += 1
            codes, _ = info(p)
            if codes:
                mir_with += 1
    label = sect or '(root html)'
    print(f'{label:18s} {len(en_files):9d} {en_with:13d} {en_noidx:11d} '
          f'{mir:8d} {mir_with:14d}')
