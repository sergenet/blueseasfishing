#!/usr/bin/env python3
"""add-adsense.py — inject the Google AdSense verification snippet into the
<head> of every deployable HTML page (idempotent: safe to re-run).

Uses deploy-site.py's collect() so the file set exactly matches what goes
live (tools/, api/, " - Copy" backups, etc. excluded). Newsletter issue
bodies under /newsletter-issues/ are email content and are skipped.
"""
import importlib.machinery
import re
import sys
from pathlib import Path

SNIPPET = (
    '<script async src="https://pagead2.googlesyndication.com/pagead/js/'
    'adsbygoogle.js?client=ca-pub-0467059729557007"\n'
    '     crossorigin="anonymous"></script>'
)

ds = importlib.machinery.SourceFileLoader("ds", str(Path(__file__).parent / "deploy-site.py")).load_module()


def main() -> int:
    files = [f for f in ds.collect() if f.suffix.lower() in (".html", ".htm")]
    injected = already = skipped = 0
    problems = []
    for rel in files:
        if rel.parts and rel.parts[0] == "newsletter-issues":
            skipped += 1
            continue
        path = ds.SITE / rel
        text = path.read_text(encoding="utf-8")
        if "adsbygoogle" in text:
            already += 1
            continue
        m = re.search(r"<head[^>]*>", text, re.IGNORECASE)
        if not m:
            problems.append(rel.as_posix())
            continue
        nl = "\r\n" if "\r\n" in text[:m.end() + 2] else "\n"
        ins = SNIPPET.replace("\n", nl)
        new = text[:m.end()] + nl + ins + text[m.end():]
        path.write_text(new, encoding="utf-8", newline="")
        injected += 1
    print(f"HTML files: {len(files)}  injected: {injected}  already present: {already}  "
          f"skipped (newsletter): {skipped}  problems: {len(problems)}")
    for p in problems:
        print("  NO <head>:", p)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
