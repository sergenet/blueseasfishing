#!/usr/bin/env python3
"""Remove the inline brand normaliser from the homepage of every locale.

The block was a client-side patch for the old "BlueSeas Fishing With Serge"
brand. It has three problems:

  1. `document.title = BRAND` replaces the page's real <title> — "Blue Seas
     Fishing: AI Fish ID & 400+ Species Guides" — with just the bare brand as
     soon as the script runs. Googlebot renders JS, so this actively removes the
     homepage's descriptive title from the rendered document.
  2. It overwrites the visible navbar brand text.
  3. Its last statement only ever matched the old brand string, which no longer
     exists in the HTML.

With the HTML now carrying the correct brand everywhere, the block is dead code
whose only remaining effect is to damage the title. Removed.

Run:  python tools/remove-brand-normaliser.py [--dry-run]
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOCK = re.compile(
    r'\n?<script>\s*\n\s*if \(!window\.__bsfBrandOnce\)[\s\S]*?\n</script>',
    re.I)
LOCALES = ['', 'es', 'fr', 'de', 'pt', 'ru', 'el', 'ar']


def main():
    dry = '--dry-run' in sys.argv
    for code in LOCALES:
        p = os.path.join(ROOT, code, 'index.html') if code else os.path.join(ROOT, 'index.html')
        if not os.path.exists(p):
            print(f'  · missing: {os.path.relpath(p, ROOT)}')
            continue
        rel = os.path.relpath(p, ROOT).replace(os.sep, '/')
        html = open(p, encoding='utf-8', newline='').read()
        if 'window.__bsfBrandOnce' not in html:
            print(f'  · {rel}: no normaliser')
            continue
        before_title = re.search(r'<title[^>]*>(.*?)</title>', html, re.S)
        new = BLOCK.sub('', html)
        if new == html:
            # Fall back to a non-greedy slice between the marker and </script>.
            i = html.find('window.__bsfBrandOnce')
            if i < 0:
                print(f'  ! {rel}: could not locate block')
                continue
            start = html.rfind('<script>', 0, i)
            end = html.find('</script>', i)
            if start < 0 or end < 0:
                print(f'  ! {rel}: malformed block')
                continue
            new = html[:start] + html[end + len('</script>'):]
            new = re.sub(r'\n{3,}', '\n\n', new)
        if not dry:
            open(p, 'w', encoding='utf-8', newline='').write(new)
        removed = len(html) - len(new)
        t = before_title.group(1).strip() if before_title else '(none)'
        print(f'  {"[dry-run] " if dry else ""}{rel}: removed {removed} bytes; '
              f'<title> kept intact')
    return 0


if __name__ == '__main__':
    sys.exit(main())
