#!/usr/bin/env python3
"""Normalise the brand that ends a localised <title>.

Two defects measured 2026-11-04 across the 7 locale trees (7,870 pages):

  * 27 titles ended in a literal " 0" — French state pages rendered
    "Saisons de pêche en Alabama — Quelles espèces mordent et quand ? | 0".
    The brand slot was filled with a number.
  * 83 distinct suffixes had accumulated, because each mirror build translated
    the brand name itself: "Blaue Meere", "Mers bleues", "Голубые моря",
    "Γαλάζιες Θάλασσες", "البحار الزرقاء", "mares azules", "BlueSeasFishing.com",
    "Blue Seas Guides", "BlueSeas Pesca", and so on. Google derives a site name
    from title suffixes, so 83 spellings split that signal; 6,898 pages already
    used "Blue Seas Fishing".

Only the final pipe/dash segment is touched, and only when it is a known brand
variant — subtitles such as "Angeltipps und Blog" or "Graphiques par famille"
are left exactly as they are.

Run:  python tools/i18n/normalise-title-brand.py [--dry-run]
"""
import os, re, sys, html as H

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BRAND = 'Blue Seas Fishing'
LOCALES = ['es', 'fr', 'de', 'pt', 'ru', 'el', 'ar']

TITLE = re.compile(r'(<title[^>]*>)(.*?)(</title>)', re.S | re.I)
SPLIT = re.compile(r'^(.*?)(\s*[|—–]\s*)([^|—–]*)$', re.S)

# Every suffix observed that is a brand, not a subtitle.
VARIANTS = {
    '0',
    'Blue Seas', 'Blue Seas Guides', 'Blue Seas Premium', 'BlueSeasFishing.com',
    'mares azules', 'Mares Azules Premium',
    'Mares Azuis',
    'Mers bleues', 'Mers Bleues', 'Mers bleues Premium', 'Mer Bleue',
    'Blaue Meere', 'Blaues Meer',
    'Голубые моря', 'Голубые моря Премиум', 'Гиды Blue Seas',
    'Γαλάζιες Θάλασσες', 'Γαλάζιες θάλασσες',
    'البحار الزرقاء', 'أدلة البحار الزرقاء', 'بلو سيز بريميوم',
    'Guías de Blue Seas', 'Guias Blue Seas',
    'Guides des mers bleues', 'Guides des Mers Bleues', 'Guides Blue Seas',
    'Οδηγοί Blue Seas',
    'أدلة بلو سيز',
    'Ψάρεμα Blue Seas',
    'BlueSeas Pesca', 'BlueSeas Angeln', 'BlueSeas Рыбалка', 'BlueSeas Ψάρεμα',
    'BlueSeas صيد الأسماك', 'BlueSeas Pêche', 'BlueSeas Ψάρεμα με τον Σερζ',
    'Pêche avec Serge', 'Pêcher avec Serge', 'الصيد مع سيرج',
}


def main():
    dry = '--dry-run' in sys.argv
    changed = 0
    fixed_zero = 0
    per_locale = {}

    for code in LOCALES:
        base = os.path.join(ROOT, code)
        if not os.path.isdir(base):
            continue
        for cur, dirs, files in os.walk(base):
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            for f in files:
                if not f.endswith('.html'):
                    continue
                p = os.path.join(cur, f)
                with open(p, encoding='utf-8', errors='replace', newline='') as fh:
                    html = fh.read()
                m = TITLE.search(html)
                if not m:
                    continue
                raw = m.group(2)
                sm = SPLIT.match(raw)
                if not sm:
                    continue
                head, sep, tail = sm.group(1), sm.group(2), sm.group(3)
                if tail.strip() not in VARIANTS:
                    continue
                was_zero = tail.strip() == '0'
                new_title = head + sep + BRAND
                new_html = html[:m.start()] + m.group(1) + new_title + m.group(3) + html[m.end():]
                if new_html == html:
                    continue
                if not dry:
                    with open(p, 'w', encoding='utf-8', newline='') as fh:
                        fh.write(new_html)
                changed += 1
                if was_zero:
                    fixed_zero += 1
                per_locale[code] = per_locale.get(code, 0) + 1

    print(f'{"[dry-run] " if dry else ""}title brand normalised:')
    print(f'  titles rewritten        : {changed}')
    print(f'  of which "| 0" repaired  : {fixed_zero}')
    for c, n in sorted(per_locale.items()):
        print(f'    {c}: {n}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
