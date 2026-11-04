#!/usr/bin/env python3
"""audit-links.py — find internal links that point at pages that don't exist (404 sources)."""
import os, re, collections

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BS = chr(92)

existing = set()
for root, dirs, files in os.walk('.'):
    if any(x in root for x in ('.git', 'node_modules', 'tools', '_api-inspect')):
        continue
    for fn in files:
        if fn.endswith('.html') and ' - Copy' not in fn:
            p = os.path.normpath(os.path.join(root, fn)).replace(BS, '/').lstrip('./')
            existing.add(p)
            existing.add(p.replace('.html', ''))
            if p.endswith('index.html'):
                d = os.path.dirname(p)
                existing.add(d if d else '/')

links = collections.Counter()
link_files = collections.defaultdict(set)
href_re = re.compile(r'href="([^"#]+?)(?:[?#][^"]*)?"')

for root, dirs, files in os.walk('.'):
    if any(x in root for x in ('.git', 'node_modules', 'tools', '_api-inspect')):
        continue
    for fn in files:
        if not fn.endswith('.html') or ' - Copy' in fn:
            continue
        p = os.path.join(root, fn)
        base = os.path.dirname(p)
        with open(p, encoding='utf-8', errors='ignore') as f:
            html = f.read()
        for href in href_re.findall(html):
            if href.startswith(('http', 'mailto:', 'tel:', 'javascript:', 'data:', '//')):
                continue
            if href.startswith('/'):
                t = href.lstrip('/')
            else:
                t = os.path.normpath(os.path.join(base, href)).replace(BS, '/').lstrip('./')
            t = t.replace('.html', '')
            links[t] += 1
            link_files[t].add(p.replace(BS, '/').lstrip('./'))

print("=== INTERNAL LINKS TO MISSING PAGES ===")
missing = {t: (c, sorted(link_files[t])) for t, c in links.items() if t not in existing}
for t, (c, srcs) in sorted(missing.items(), key=lambda x: -x[1][0]):
    print(f"{c:5}x  {t}   (e.g. {srcs[0]})")
print(f"\nTotal missing targets: {len(missing)}, total bad links: {sum(c for c, _ in missing.values())}")
