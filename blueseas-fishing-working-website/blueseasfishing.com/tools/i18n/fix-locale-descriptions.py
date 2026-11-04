#!/usr/bin/env python3
"""Give locale mirrors a description in their own language.

Measured 2026-11-04: the mirror build translated titles and body copy but left
<meta name="description">, og:description and twitter:description as the English
string. Of 679 destination mirrors, 672 carried the English description. So a
German searcher was shown a German title above an English snippet — a large part
of why 20.5K impressions converted to 97 clicks.

No machine translation is used. Every one of these pages already contains a
translated lead paragraph, so the description is built from the page's own words.

Safety: a page is only touched when its description is byte-identical to the
English original. Anything already translated is left alone.

Run:  python tools/i18n/fix-locale-descriptions.py [--dry-run] [--only SUBSTR]
"""
import os, re, sys, html as H

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOCALES = ['es', 'fr', 'de', 'pt', 'ru', 'el', 'ar']
SECTIONS = ['destinations', 'states', 'whats-biting', 'fish-size-charts', 'guides', '.']
MAXLEN = 155
MINLEN = 70

D = re.compile(r'(<meta\s+name="description"[^>]*content=")([^"]*)(")', re.I)
OG = re.compile(r'(<meta\s+property="og:description"[^>]*content=")([^"]*)(")', re.I)
TW = re.compile(r'(<meta\s+name="twitter:description"[^>]*content=")([^"]*)(")', re.I)
LEDE = re.compile(r'<p class="lede"[^>]*>(.*?)</p>', re.S | re.I)
PARA = re.compile(r'<p[^>]*>(.*?)</p>', re.S | re.I)
TAGS = re.compile(r'<[^>]+>')
SCRIPT = re.compile(r'<(script|style)[\s\S]*?</\1>', re.I)
TITLE = re.compile(r'<title[^>]*>(.*?)</title>', re.S | re.I)


def text_of(fragment):
    s = TAGS.sub(' ', fragment)
    s = H.unescape(s)
    return re.sub(r'\s+', ' ', s).strip()


SENT_END = '.!?؟。'
CLAUSE = ',;:—–\u060c\u061b'


def fit(s):
    """Trim to a natural description length, filling the available space.

    Cutting at the first sentence end wasted the snippet: the German Bahamas
    lead's first sentence is 72 characters, so the description used 72 of the
    ~155 Google displays. Prefer the longest clean break that fits.
    """
    s = re.sub(r'\s+', ' ', s).strip()
    if len(s) <= MAXLEN:
        return s if len(s) >= MINLEN else ''

    window = s[:MAXLEN + 1]
    best = -1
    for i, ch in enumerate(window[:-1]):
        if ch in SENT_END and window[i + 1] == ' ':
            best = max(best, i + 1)
    # A sentence end close to the limit is the nicest answer.
    if best >= MINLEN and best >= MAXLEN * 0.6:
        return window[:best].strip()

    # Otherwise take the longest clause break that fits, and close it off.
    clause = -1
    for i, ch in enumerate(window[:-1]):
        if ch in CLAUSE and window[i + 1] == ' ':
            clause = max(clause, i)
    if clause >= MINLEN and clause > best:
        return window[:clause].rstrip(' ' + CLAUSE) + '.'

    if best >= MINLEN:
        return window[:best].strip()

    cut = s.rfind(' ', 0, MAXLEN)
    if cut < MINLEN:
        return ''
    return s[:cut].rstrip(' ,;:' + CLAUSE) + '…'


def candidate_text(html_text, english_desc):
    """Best translated paragraph for a description, excluding the English one."""
    for m in LEDE.finditer(html_text):
        t = text_of(m.group(1))
        if t and t != english_desc and not looks_english_only(t):
            out = fit(t)
            if out:
                return out
    for m in PARA.finditer(html_text):
        t = text_of(m.group(1))
        if len(t) < MINLEN or t == english_desc:
            continue
        if looks_english_only(t):
            continue
        out = fit(t)
        if out:
            return out
    return ''


ENGLISH_HINT = re.compile(
    r'\b(the|and|with|this|that|from|which|your|you|are|for|our|have|will|'
    r'species|fishing|waters|including|see|below)\b', re.I)


def looks_english_only(t):
    """True when a paragraph reads as untranslated English.

    Titles and bodies on these pages have been translated already, so this only
    guards against picking an English paragraph (e.g. a species list) on a page
    whose description is English for a different reason.
    """
    if re.search(r'[\u0400-\u04ff\u0600-\u06ff\u0370-\u03ff\u0590-\u05ff]', t):
        return False  # Cyrillic / Arabic / Greek — definitely translated
    return len(ENGLISH_HINT.findall(t)) >= 3


def main():
    dry = '--dry-run' in sys.argv
    only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
    fixed = skipped = no_text = 0
    per_locale = {}

    for code in LOCALES:
        for sect in SECTIONS:
            en_dir = os.path.join(ROOT, sect) if sect != '.' else ROOT
            loc_dir = os.path.join(ROOT, code, sect) if sect != '.' else os.path.join(ROOT, code)
            if not os.path.isdir(loc_dir):
                continue
            for cur, dirs, files in os.walk(loc_dir):
                dirs[:] = [d for d in dirs if not d.startswith('.')]
                for f in files:
                    if not f.endswith('.html'):
                        continue
                    lp = os.path.join(cur, f)
                    rel = os.path.relpath(lp, loc_dir).replace(os.sep, '/')
                    if sect == '.' and os.path.dirname(lp) != loc_dir:
                        continue
                    ep = os.path.join(en_dir, rel)
                    if not os.path.exists(ep):
                        continue
                    if only and only not in lp.replace(os.sep, '/'):
                        continue

                    eh = open(ep, encoding='utf-8', errors='replace').read(14000)
                    em = D.search(eh)
                    if not em:
                        continue
                    english_desc = em.group(2).strip()

                    lh = open(lp, encoding='utf-8', errors='replace', newline='').read()
                    lm = D.search(lh[:14000])
                    if not lm:
                        continue
                    if lm.group(2).strip() != english_desc:
                        skipped += 1
                        continue

                    body = SCRIPT.sub(' ', lh)
                    new_desc = candidate_text(body, english_desc)
                    if not new_desc:
                        no_text += 1
                        continue

                    esc = (new_desc.replace('&', '&amp;').replace('"', '&quot;'))
                    out = lh
                    out = D.sub(lambda m: m.group(1) + esc + m.group(3), out, count=1)
                    out = OG.sub(lambda m: m.group(1) + esc + m.group(3), out, count=1)
                    out = TW.sub(lambda m: m.group(1) + esc + m.group(3), out, count=1)
                    if out == lh:
                        continue
                    if not dry:
                        open(lp, 'w', encoding='utf-8', newline='').write(out)
                    fixed += 1
                    per_locale[code] = per_locale.get(code, 0) + 1

    print(f'{"[dry-run] " if dry else ""}locale descriptions:')
    print(f'  rewritten          : {fixed}')
    print(f'  already translated  : {skipped}')
    print(f'  no usable local text: {no_text}')
    for c, n in sorted(per_locale.items()):
        print(f'    {c}: {n}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
