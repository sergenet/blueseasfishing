#!/usr/bin/env python3
"""Local head/SEO audit across every HTML file in the Blue Seas tree.

Read-only. Reports problems; changes nothing. Run from the site root:
    python tools/audit-site.py
"""
import os, re, sys, json
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCALES = {'es', 'fr', 'de', 'pt', 'ru', 'el', 'ar'}
SKIP_DIRS = {'node_modules', 'tools', 'api', 'config', 'includes', 'newsletter-issues',
             '.idxwork', 'images', 'assets', 'icons', 'ios-project', 'android-project',
             '__pycache__'} | LOCALES

title_re = re.compile(r'<title[^>]*>(.*?)</title>', re.S | re.I)
desc_re = re.compile(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', re.S | re.I)
desc_re2 = re.compile(r'<meta\s+content=["\'](.*?)["\']\s+name=["\']description["\']', re.S | re.I)
canon_re = re.compile(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']', re.I)
robots_re = re.compile(r'<meta\s+name=["\']robots["\']\s+content=["\'](.*?)["\']', re.I)
h1_re = re.compile(r'<h1[^>]*>(.*?)</h1>', re.S | re.I)
hreflang_re = re.compile(r'<link\s+rel=["\']alternate["\']\s+hreflang=["\']([^"\']+)["\']\s+href=["\']([^"\']+)["\']', re.I)
ldjson_re = re.compile(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', re.S | re.I)
ogimg_re = re.compile(r'<meta\s+property=["\']og:image["\']\s+content=["\'](.*?)["\']', re.I)


def walk(base, skip_locales=True):
    for e in sorted(os.scandir(base), key=lambda x: x.name):
        if e.is_dir():
            if e.name.startswith('.'):
                continue
            if skip_locales and e.name in SKIP_DIRS:
                continue
            if re.match(r'^backup', e.name, re.I):
                continue
            yield from walk(e.path, skip_locales)
        elif e.name.endswith('.html'):
            yield e.path


def strip_tags(s):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', s or '')).strip()


def audit(files):
    titles = defaultdict(list)
    descs = defaultdict(list)
    problems = defaultdict(list)
    stats = Counter()

    for path in files:
        rel = os.path.relpath(path, ROOT).replace('\\', '/')
        try:
            html = open(path, encoding='utf-8', errors='replace').read()
        except Exception as ex:
            problems['unreadable'].append(f'{rel}: {ex}')
            continue
        stats['files'] += 1

        is_locale = rel.split('/')[0] in LOCALES
        is_404 = os.path.basename(rel) in ('404.html', 'offline.html')

        m = title_re.search(html)
        title = strip_tags(m.group(1)) if m else ''
        if not title:
            problems['no title'].append(rel)
        else:
            titles[title].append(rel)
            if len(title) > 70:
                problems['title >70 chars'].append(f'{rel} ({len(title)})')
            elif len(title) < 20:
                problems['title <20 chars'].append(f'{rel} ({len(title)})')
            if '|' not in title and ' - ' not in title:
                problems['title has no brand'].append(rel)

        m = desc_re.search(html) or desc_re2.search(html)
        desc = strip_tags(m.group(1)) if m else ''
        if not desc:
            problems['no description'].append(rel)
        else:
            descs[desc].append(rel)
            if len(desc) < 70:
                problems['description <70 chars'].append(f'{rel} ({len(desc)})')
            elif len(desc) > 165:
                problems['description >165 chars'].append(f'{rel} ({len(desc)})')

        m = canon_re.search(html)
        canon = m.group(1).strip() if m else ''
        if not canon:
            problems['no canonical'].append(rel)
        else:
            stats['canonical'] += 1
            if canon.startswith('http://'):
                problems['canonical http'].append(f'{rel} -> {canon}')
            if 'blueseasfishing.com' not in canon:
                problems['canonical offsite'].append(f'{rel} -> {canon}')
            elif '://www.' not in canon:
                problems['canonical non-www'].append(f'{rel} -> {canon}')
            expected = 'https://www.blueseasfishing.com/' + rel
            if canon.rstrip('/') != expected.rstrip('/') and not is_404:
                problems['canonical mismatch'].append(f'{rel} -> {canon}')

        m = robots_re.search(html)
        robots = (m.group(1) or '').lower() if m else ''
        if 'noindex' in robots:
            stats['noindex'] += 1
            problems['_noindex'].append(rel)

        h1s = h1_re.findall(html)
        if not h1s and not is_404:
            problems['no h1'].append(rel)
        elif len(h1s) > 1:
            problems['multiple h1'].append(f'{rel} ({len(h1s)})')

        if not ldjson_re.search(html) and not is_404:
            problems['no json-ld'].append(rel)

        m = ogimg_re.search(html)
        if not m:
            problems['no og:image'].append(rel)

        hl = hreflang_re.findall(html)
        if hl:
            stats['hreflang pages'] += 1
            codes = [c.lower() for c, _ in hl]
            if len(codes) != len(set(codes)):
                problems['duplicate hreflang'].append(rel)
            if canon and 'https://www.blueseasfishing.com' in canon:
                if not any(h.rstrip('/') == canon.rstrip('/') for _, h in hl):
                    problems['hreflang missing self'].append(rel)
        elif not is_404 and not is_locale:
            problems['no hreflang (english)'].append(rel)

    for t, paths in titles.items():
        if len(paths) > 1:
            problems['DUPLICATE titles'].append(f'"{t[:60]}" x{len(paths)}: {", ".join(paths[:4])}')
    for d, paths in descs.items():
        if len(paths) > 1:
            problems['DUPLICATE descriptions'].append(f'x{len(paths)}: {", ".join(paths[:4])}')

    return stats, problems


def main():
    files = list(walk(ROOT))
    stats, problems = audit(files)
    print(f'audited {stats["files"]} HTML files\n')
    print('=== counts ===')
    print(f'  with canonical : {stats["canonical"]}')
    print(f'  noindex        : {stats["noindex"]}')
    print(f'  with hreflang  : {stats["hreflang pages"]}')
    print()
    order = [k for k in problems if k not in ('_noindex',)]
    order.sort(key=lambda k: -len(problems[k]))
    print('=== problems by count ===')
    for k in order:
        v = problems[k]
        print(f'  {len(v):5d}  {k}')
    print()
    for k in order:
        v = problems[k]
        if k.startswith('DUPLICATE') or not v:
            continue
        print(f'--- {k} ({len(v)}) ---')
        for x in v[:12]:
            print(f'    {x}')
        if len(v) > 12:
            print(f'    ... +{len(v)-12} more')
        print()
    for k in ('DUPLICATE titles', 'DUPLICATE descriptions'):
        v = problems.get(k) or []
        if v:
            print(f'--- {k} ({len(v)}) ---')
            for x in v[:15]:
                print(f'    {x}')
            if len(v) > 15:
                print(f'    ... +{len(v)-15} more')
            print()


if __name__ == '__main__':
    main()
