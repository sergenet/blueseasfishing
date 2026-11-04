#!/usr/bin/env python3
"""Repair social-preview tags across the site. Idempotent.

Measured 2026-11-04 on the checked-in tree:
    states            385 files,  0 og:image,  0 twitter:image
    whats-biting       13 files,  0 og:image,  0 twitter:image
    fish-size-charts    6 files,  0 og:image,  0 twitter:image
    species           549 files,  4 og:image,  4 twitter:image
    root               58 files, 37 og:image,  1 twitter:image
    destinations       97 files, 96 og:image, 96 twitter:image
Only generate-destinations.mjs ever emitted a complete set.

Each page already carries its own species photographs, so the lead <img> on the
page is used as its preview image — relevant to the page rather than one shared
brand card. Pages with no image fall back to the site brand photograph.

Run:  python tools/fix-social-tags.py [--dry-run] [--only SECTION] [--limit N]
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://www.blueseasfishing.com'
BRAND = f'{SITE}/images/deep-sea-marlin-trolling-fishing-action.jpg'
SECTIONS = ['destinations', 'states', 'species', 'whats-biting', 'fish-size-charts', 'guides', '.']
LOCALES = ['es', 'fr', 'de', 'pt', 'ru', 'el', 'ar']

OG_IMG = re.compile(r'<meta\s+property=["\']og:image["\'][^>]*content=["\']([^"\']*)', re.I)
TW_IMG = re.compile(r'<meta\s+name=["\']twitter:image["\'][^>]*content=["\']([^"\']*)', re.I)
TW_CARD = re.compile(r'(<meta\s+name=["\']twitter:card["\']\s+content=["\'])([^"\']*)', re.I)
OG_ALT = re.compile(r'<meta\s+property=["\']og:image:alt["\']', re.I)
LINK_IMG = re.compile(r'<img[^>]+src=["\'](/images/[^"\']+)["\']', re.I)
H1 = re.compile(r'<h1[^>]*>(.*?)</h1>', re.S | re.I)
TITLE = re.compile(r'<title[^>]*>(.*?)</title>', re.S | re.I)
TAGS = re.compile(r'<[^>]+>')


def plain(s):
    return re.sub(r'\s+', ' ', TAGS.sub('', s or '')).strip()


def head_of(html):
    i = html.lower().find('</head>')
    return (html[:i], html[i:]) if i >= 0 else (html, '')


def lead_image(html):
    for m in LINK_IMG.finditer(html):
        path = m.group(1)
        if 'default' in path or 'placeholder' in path:
            continue
        return SITE + path
    return BRAND


def alt_text(head, html):
    m = H1.search(html) or TITLE.search(head)
    t = plain(m.group(1)) if m else ''
    t = re.sub(r'\s*[|·—-]\s*Blue Seas.*$', '', t, flags=re.I)
    return t[:120] or 'Blue Seas Fishing'


def insert_after(head, anchor_re, block, nl='\n'):
    """Insert `block` after the last tag matching anchor_re, else before </head>."""
    last = None
    for last in anchor_re.finditer(head):
        pass
    if last:
        return head[:last.end()] + nl + '  ' + block + head[last.end():]
    return head + '  ' + block + nl


def process(path, dry):
    # newline='' keeps the file's own line endings; without it a CRLF file would
    # be rewritten as LF and every line would show as changed.
    html = open(path, encoding='utf-8', errors='replace', newline='').read()
    nl = '\r\n' if '\r\n' in html else '\n'
    head, rest = head_of(html)
    if not rest:  # no </head>
        return 0

    have_og = OG_IMG.search(head)
    have_tw = TW_IMG.search(head)
    image = have_og.group(1) if have_og else None
    tw_image = have_tw.group(1) if have_tw else None
    if not image:
        image = lead_image(html)
    if not tw_image:
        tw_image = image

    added = []
    if not have_og:
        added.append(f'<meta property="og:image" content="{image}">')
        if not OG_ALT.search(head):
            added.append(f'<meta property="og:image:alt" content="{alt_text(head, html)}">')
    elif not OG_ALT.search(head):
        added.append(f'<meta property="og:image:alt" content="{alt_text(head, html)}">')
    if not have_tw:
        added.append(f'<meta name="twitter:image" content="{tw_image}">')
    if not TW_CARD.search(head):
        added.append('<meta name="twitter:card" content="summary_large_image">')

    new_head = head
    if added:
        anchor = re.compile(r'<meta\s+property=["\']og:(?:url|description)["\'][^>]*>', re.I)
        new_head = insert_after(new_head, anchor, (nl + '  ').join(added), nl)

    m = TW_CARD.search(new_head)
    if m and m.group(2).strip().lower() == 'summary':
        new_head = TW_CARD.sub(lambda mm: mm.group(1) + 'summary_large_image', new_head, count=1)

    if new_head == head:
        return 0
    if not dry:
        open(path, 'w', encoding='utf-8', newline='').write(new_head + rest)
    return 1


def walk(base):
    for cur, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if not d.startswith('.') and not d.startswith('backup')]
        for f in files:
            if f.endswith('.html'):
                yield os.path.join(cur, f)


def main():
    dry = '--dry-run' in sys.argv
    only = None
    if '--only' in sys.argv:
        only = sys.argv[sys.argv.index('--only') + 1]
    limit = None
    if '--limit' in sys.argv:
        limit = int(sys.argv[sys.argv.index('--limit') + 1])

    targets = []
    for sect in SECTIONS:
        base = ROOT if sect == '.' else os.path.join(ROOT, sect)
        if not os.path.isdir(base):
            continue
        for p in walk(base):
            if sect == '.' and os.path.dirname(p) != ROOT:
                continue  # root pass: only top-level files
            targets.append(p)
        for code in LOCALES:
            lb = os.path.join(ROOT, code, sect) if sect != '.' else None
            if lb and os.path.isdir(lb):
                targets.extend(walk(lb))
    if only:
        targets = [p for p in targets if only in p.replace(os.sep, '/')]
    if limit:
        targets = targets[:limit]

    changed = 0
    print(f'{"[dry-run] " if dry else ""}scanning {len(targets)} files')
    for n, p in enumerate(targets, 1):
        try:
            changed += process(p, dry)
        except Exception as e:
            print(f'  ! {os.path.relpath(p, ROOT)}: {e}')
        if n % 500 == 0:
            print(f'  {n}/{len(targets)}  changed {changed}', flush=True)
    print(f'{"[dry-run] " if dry else ""}done: {changed} file(s) updated')
    return 0


if __name__ == '__main__':
    sys.exit(main())
