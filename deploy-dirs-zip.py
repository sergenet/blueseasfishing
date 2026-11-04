#!/usr/bin/env python3
"""
deploy-dirs-zip.py — deploy a scoped set of directories as ONE archive.

deploy-zip.py bundles the entire site (~9.8k files), which is right for a full
release. tools/upload-changed.mjs does one FTP STOR per file, which is right for
a handful of pages but takes far too long for a few hundred: the ad-slot rollout
touched 646 pages (97 destinations + 549 species) and per-file upload exceeded
ten minutes.

This does what the user asked for in between: zip only the named directories,
upload one file, extract server-side with PHP, then clean up.

Usage (from blueseasfishing/):
  python deploy-dirs-zip.py destinations species
  python deploy-dirs-zip.py states --files a.html b.html
  python deploy-dirs-zip.py destinations --dry-run

Directories are walked recursively: states/ holds one subdirectory per state
(state/month pages) and each locale mirror (es/, de/, ...) repeats the whole
site, so a non-recursive listing would silently deploy a fraction of the pages.
"""
import sys
import time
import zipfile
import urllib.request
from pathlib import Path

import deploy  # FTP_HOST / FTP_USER / FTP_PASS

BASE = Path(__file__).resolve().parent
SITE = BASE / "blueseas-fishing-working-website" / "blueseasfishing.com"

ZIP_LOCAL = BASE / "_dirs-bundle.zip"
ZIP_REMOTE = "bsf-dirs-bundle.zip"
UNZIP_REMOTE = "bsf-dirs-unzip.php"

UNZIP_PHP = """<?php
@set_time_limit(0);
$zip = new ZipArchive;
$res = $zip->open(__DIR__ . '/bsf-dirs-bundle.zip');
if ($res !== TRUE) { header('Content-Type: text/plain'); echo "OPEN_FAIL:$res"; exit(1); }
for ($i = 0; $i < $zip->numFiles; $i++) {
    if (strpos($zip->getNameIndex($i), '..') !== false) {
        header('Content-Type: text/plain'); echo 'UNSAFE_ENTRY'; exit(1);
    }
}
if (!$zip->extractTo(__DIR__)) { $zip->close(); echo 'EXTRACT_FAIL'; exit(1); }
$n = $zip->numFiles;
$zip->close();
@unlink(__DIR__ . '/bsf-dirs-bundle.zip');
@unlink(__DIR__ . '/bsf-dirs-unzip.php');
header('Content-Type: text/plain');
echo "OK extracted=$n";
"""


def files_for(dirs, files=()):
    out = []
    for d in dirs:
        abs_dir = SITE / d
        if not abs_dir.is_dir():
            print(f"  skip {d}: not found")
            continue
        out.extend(sorted(p for p in abs_dir.rglob("*.html") if p.is_file()))
    # Individual files, relative to the site root (root-level content pages that
    # do not live in a directory of their own).
    for rel in files:
        p = SITE / rel
        if not p.is_file():
            print(f"  skip {rel}: not found")
            continue
        out.append(p)
    # A page can be reachable both directly and via a directory argument.
    seen, uniq = set(), []
    for p in out:
        if p not in seen:
            seen.add(p)
            uniq.append(p)
    return uniq


def connect():
    import ftplib
    ftp = ftplib.FTP(deploy.FTP_HOST, timeout=180)
    ftp.login(deploy.FTP_USER, deploy.FTP_PASS)
    ftp.set_pasv(True)
    return ftp


def main():
    argv = sys.argv[1:]
    dry = "--dry-run" in argv
    explicit = []
    if "--files" in argv:
        i = argv.index("--files")
        j = i + 1
        while j < len(argv) and not argv[j].startswith("--"):
            explicit.append(argv[j])
            j += 1
        del argv[i:j]
    args = [a for a in argv if not a.startswith("--")]
    if not args and not explicit:
        print(__doc__)
        return 1

    files = files_for(args, explicit)
    if not files:
        print("nothing to deploy")
        return 1
    label = ', '.join(args) or '(explicit files)'
    print(f"Zipping {len(files)} files from {label}")
    with zipfile.ZipFile(ZIP_LOCAL, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for p in files:
            z.write(p, p.relative_to(SITE).as_posix())
    mb = ZIP_LOCAL.stat().st_size / 1e6
    print(f"Bundle: {ZIP_LOCAL.name} {mb:.1f} MB")
    if dry:
        print("Dry run: bundle built, nothing uploaded.")
        return 0

    ftp = connect()
    print(f"Connected to {deploy.FTP_HOST}")
    t0 = time.time()
    with open(ZIP_LOCAL, "rb") as fh:
        ftp.storbinary(f"STOR {ZIP_REMOTE}", fh, blocksize=256 * 1024)
    print(f"Uploaded in {time.time() - t0:.0f}s")

    php_local = BASE / "_dirs-unzip.php"
    php_local.write_text(UNZIP_PHP, encoding="utf-8", newline="\n")
    with open(php_local, "rb") as fh:
        ftp.storbinary(f"STOR {UNZIP_REMOTE}", fh)
    php_local.unlink()

    url = f"https://www.blueseasfishing.com/{UNZIP_REMOTE}"
    body, deadline = None, time.time() + 420
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=300) as r:
                body = r.read().decode("utf-8", "replace")
            if body.startswith("OK"):
                break
        except Exception as e:
            body = f"retry ({e})"
        time.sleep(5)
    print(f"Server said: {body}")
    if not (body or "").startswith("OK"):
        ftp.quit()
        raise SystemExit("unzip failed")

    for name in (ZIP_REMOTE, UNZIP_REMOTE):
        try:
            ftp.delete(name)
        except Exception:
            pass
    ftp.quit()
    print(f"Done — {len(files)} files deployed from one archive.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
