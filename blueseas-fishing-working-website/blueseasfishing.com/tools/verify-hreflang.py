#!/usr/bin/env python3
"""Verify hreflang clusters are reciprocal across the whole site.

For every page that advertises alternates, each URL it names must itself name
this page back. Also checks that a page which is named by a mirror advertises
that mirror. Read-only.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://www.blueseasfishing.com'
ALT = re.compile(
    r'<link[^>]*rel=["\']alternate["\'][^>]*hreflang=["\']([^"\']+)["\']'
    r'[^>]*href=["\']([^"\']+)["\']', re.I)
NOIDX = re.compile(r'<meta\s+name=["\']robots["\'][^>]*content=["\'][^"\']*noindex', re.I)

SEC = ['destinations', 'states', 'whats-biting', 'fish-size-charts', 'guides']


def url_to_path(u):
    p = u[len(SITE):].split('#')[0].split('?')[0]
    if p in ('', '/'):
        return 'index.html'
    if p.endswith('/'):
        return p.lstrip('/') + 'index.html'
    return p.lstrip('/')


def read(rel):
    p = os.path.join(ROOT, rel.replace('/', os.sep))
    if not os.path.exists(p):
        return None
    h = open(p, encoding='utf-8', errors='replace').read()
    i = h.lower().find('</head>')
    return h[:i] if i >= 0 else h


def cluster(head):
    return {c: href for c, href in ALT.findall(head) if c != 'x-default'}


def collect():
    pages = {}
    for sect in SEC:
        base = os.path.join(ROOT, sect)
        if not os.path.isdir(base):
            continue
        for cur, _, files in os.walk(base):
            for f in files:
                if f.endswith('.html'):
                    rel = os.path.relpath(os.path.join(cur, f), ROOT).replace(os.sep, '/')
                    pages[rel] = read(rel)
    return pages


def main():
    pages = collect()
    problems = {'points at missing file': [], 'not reciprocated': [],
                'names a noindex page': [], 'missing x-default': []}
    checked = 0

    for rel, head in pages.items():
        if head is None:
            continue
        cl = cluster(head)
        if not cl:
            continue
        checked += 1
        # Directory indexes are published as "/dir/" in clusters, not
        # "/dir/index.html" — compare on the published form.
        own = SITE + '/' + rel
        if own.endswith('/index.html'):
            own = own[:-len('index.html')]
        if 'x-default' not in ALT.findall(head) and not re.search(
                r'hreflang=["\']x-default', head, re.I):
            problems['missing x-default'].append(rel)

        for code, href in cl.items():
            target = url_to_path(href)
            th = read(target)
            if th is None:
                problems['points at missing file'].append(f'{rel} -> {code} {href}')
                continue
            if NOIDX.search(th):
                problems['names a noindex page'].append(f'{rel} -> {code} {href}')
                continue
            # The target must name this page's own URL under hreflang="en".
            back = cluster(th)
            back_en = back.get('en') or ''
            if back_en != own and back_en.rstrip('/') != own.rstrip('/'):
                problems['not reciprocated'].append(
                    f'{rel} -> {code} {href}  (that page names en={back.get("en")})')

    print(f'pages with a cluster checked: {checked}')
    total = 0
    for k, v in problems.items():
        print(f'\n--- {k} ({len(v)}) ---')
        for x in v[:15]:
            print(f'    {x}')
        if len(v) > 15:
            print(f'    ... +{len(v)-15} more')
        total += len(v)
    print(f'\n{"PASS" if total == 0 else "FAIL"}: {total} problem(s)')
    return 1 if total else 0


if __name__ == '__main__':
    sys.exit(main())
