#!/usr/bin/env python3
"""Crawl every URL in the live sitemap and report status / redirect / noindex.

Read-only. Writes tools/crawl-results.json for the repair passes.
"""
import json, re, sys, time
import urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

SITEMAP = 'https://www.blueseasfishing.com/sitemap.xml'
UA = 'Mozilla/5.0 (compatible; BlueSeasAudit/1.0)'
WORKERS = 24


def get(url, method='GET', limit=200000):
    req = urllib.request.Request(url, headers={'User-Agent': UA}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read(limit).decode('utf-8', 'replace') if method == 'GET' else ''
            return r.status, r.geturl(), body, dict(r.headers)
    except urllib.error.HTTPError as e:
        body = ''
        try:
            body = e.read(200000).decode('utf-8', 'replace')
        except Exception:
            pass
        return e.code, url, body, dict(e.headers or {})
    except Exception as e:
        return 0, url, f'ERR {e}', {}


def main():
    # The sitemap is ~2.7 MB; read it whole or only the first ~169 URLs parse.
    st, _, xml, _ = get(SITEMAP, limit=16 * 1024 * 1024)
    if st != 200:
        print(f'sitemap fetch failed: {st}')
        return 1
    urls = re.findall(r'<loc>(.*?)</loc>', xml)
    print(f'sitemap urls: {len(urls)}', flush=True)

    results = []
    done = [0]

    def check(u):
        code, final, body, hdrs = get(u)
        noindex = bool(re.search(
            r'<meta\s+name=["\']robots["\']\s+content=["\'][^"\']*noindex', body, re.I))
        canon = ''
        m = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)', body, re.I)
        if m:
            canon = m.group(1)
        title = ''
        m = re.search(r'<title[^>]*>(.*?)</title>', body, re.S | re.I)
        if m:
            title = re.sub(r'\s+', ' ', m.group(1)).strip()
        done[0] += 1
        if done[0] % 200 == 0:
            print(f'  {done[0]}/{len(urls)}', flush=True)
        return {'url': u, 'status': code, 'final': final, 'noindex': noindex,
                'canonical': canon, 'title': title,
                'redirected': final.rstrip('/') != u.rstrip('/')}

    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        results = list(ex.map(check, urls))

    json.dump(results, open('tools/crawl-results.json', 'w', encoding='utf-8'), indent=0)

    from collections import Counter
    print('\n=== status codes ===')
    for k, v in Counter(r['status'] for r in results).most_common():
        print(f'  {k}: {v}')
    bad = [r for r in results if r['status'] != 200]
    print(f'\n=== non-200 ({len(bad)}) ===')
    for r in bad[:40]:
        print(f"  {r['status']}  {r['url']}  ->  {r['final']}")
    red = [r for r in results if r['status'] == 200 and r['redirected']]
    print(f'\n=== 200 but redirected ({len(red)}) ===')
    for r in red[:20]:
        print(f"  {r['url']}  ->  {r['final']}")
    nidx = [r for r in results if r['noindex']]
    print(f'\n=== noindex but listed in sitemap ({len(nidx)}) ===')
    for r in nidx[:30]:
        print(f"  {r['url']}")
    mism = [r for r in results if r['canonical'] and
            r['canonical'].rstrip('/') != r['url'].rstrip('/')]
    print(f'\n=== canonical points elsewhere ({len(mism)}) ===')
    for r in mism[:30]:
        print(f"  {r['url']}\n      -> {r['canonical']}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
