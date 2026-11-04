#!/usr/bin/env python3
"""
deploy-zip.py — fast deploy: zip everything locally, upload ONE file,
unzip server-side with a temporary PHP script, then clean up.

Reuses the exclusion rules from deploy-site.py so the manifest is identical
to the classic uploader (tools/, api/, .env, " - Copy" files etc. excluded).

Usage:
  python deploy-zip.py            # zip + upload + unzip + verify + cleanup
  python deploy-zip.py --dry-run  # build zip, print manifest summary, no upload
"""

import sys
import time
import zipfile
import importlib.machinery
from pathlib import Path

import deploy  # FTP_HOST / FTP_USER / FTP_PASS
ds = importlib.machinery.SourceFileLoader("ds", str(Path(__file__).parent / "deploy-site.py")).load_module()

BASE = Path(__file__).resolve().parent
SITE = BASE / "blueseas-fishing-working-website" / "blueseasfishing.com"
ZIP_LOCAL = BASE / "deploy-bundle.zip"
ZIP_REMOTE = "deploy-bundle.zip"
UNZIP_REMOTE = "bsf-unzip.php"


SKIP_IMAGE_DIRS = ("images/species/", "images/destinations/")  # already live from the webp deploy


def build_zip(skip_images=False):
    files = [f for f in ds.collect()]
    skipped = 0
    if skip_images:
        before = len(files)
        files = [f for f in files if not f.as_posix().startswith(SKIP_IMAGE_DIRS)]
        skipped = before - len(files)
        print(f"Skipping {skipped} image files already current on the server")
    print(f"Zipping {len(files)} files -> {ZIP_LOCAL.name}")
    with zipfile.ZipFile(ZIP_LOCAL, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for rel in files:
            z.write(SITE / rel, rel.as_posix())
    mb = ZIP_LOCAL.stat().st_size / 1e6
    print(f"Bundle size: {mb:.1f} MB ({mb / 5:.0f}-{mb / 2:.0f} min to upload at the observed FTP rate)")
    return len(files)


def upload_zip(ftp):
    total = ZIP_LOCAL.stat().st_size
    done = [0]
    t0 = time.time()

    def cb(chunk):
        done[0] += len(chunk)
        if done[0] % (5 * 1024 * 1024) < len(chunk):
            print(f"  {done[0] / 1e6:.0f}/{total / 1e6:.0f} MB  ({time.time() - t0:.0f}s)")

    with open(ZIP_LOCAL, "rb") as fh:
        ftp.storbinary(f"STOR {ZIP_REMOTE}", fh, blocksize=256 * 1024, callback=cb)
    print(f"Uploaded {total / 1e6:.1f} MB in {time.time() - t0:.0f}s")


UNZIP_PHP = """<?php
@set_time_limit(0);
$zip = new ZipArchive;
$res = $zip->open(__DIR__ . '/deploy-bundle.zip');
if ($res !== TRUE) { header('Content-Type: text/plain'); echo "OPEN_FAIL:$res"; exit(1); }
$root = __DIR__;
for ($i = 0; $i < $zip->numFiles; $i++) {
    if (strpos($zip->getNameIndex($i), '..') !== false) {
        header('Content-Type: text/plain'); echo 'UNSAFE_ENTRY'; exit(1);
    }
}
if (!$zip->extractTo($root)) { $zip->close(); echo 'EXTRACT_FAIL'; exit(1); }
$n = $zip->numFiles;
$zip->close();
@unlink(__DIR__ . '/deploy-bundle.zip');
@unlink(__DIR__ . '/bsf-unzip.php');
header('Content-Type: text/plain');
echo "OK extracted=$n";
"""


def unzip_server_side(ftp):
    php = BASE / "_bsf-unzip.php"
    php.write_text(UNZIP_PHP, encoding="utf-8", newline="\n")
    with open(php, "rb") as fh:
        ftp.storbinary(f"STOR {UNZIP_REMOTE}", fh)
    php.unlink()
    print("Unzip script staged; extracting server-side (this can take a couple of minutes)...")
    import urllib.request
    url = f"https://www.blueseasfishing.com/{UNZIP_REMOTE}"
    deadline = time.time() + 600
    last_err = None
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=300) as r:
                body = r.read().decode("utf-8", "replace")
            print(f"  server said: {body}")
            if body.startswith("OK"):
                return True
            last_err = body
        except Exception as e:
            last_err = e
        time.sleep(5)
    raise RuntimeError(f"Unzip script did not complete: {last_err}")


def verify_sample():
    import urllib.request
    tests = ["index.html", "sitemap.xml", "species/largemouth-bass.html", "destinations/"]
    ok = 0
    for t in tests:
        try:
            with urllib.request.urlopen(f"https://www.blueseasfishing.com/{t}", timeout=30) as r:
                print(f"  {t}: HTTP {r.status}")
                ok += 1
        except Exception as e:
            print(f"  {t}: {e}")
    # content-level checks: files from THIS bundle
    try:
        with urllib.request.urlopen("https://www.blueseasfishing.com/membership.js", timeout=30) as r:
            body = r.read().decode("utf-8", "replace")
        marker = "v3" in body and "DAILY_MEMBER_LIMIT" in body
        print(f"  membership.js v3 (tiered limits): {'OK' if marker else 'STALE!'}")
        ok += 1 if marker else 0
    except Exception as e:
        print(f"  membership.js: {e}")
    try:
        with urllib.request.urlopen("https://www.blueseasfishing.com/assets/js/nav-back.js", timeout=30) as r:
            print(f"  assets/js/nav-back.js: HTTP {r.status}")
            ok += 1
    except Exception as e:
        print(f"  assets/js/nav-back.js: {e}")
    return ok


def main():
    dry = "--dry-run" in sys.argv
    skip_images = "--skip-images" in sys.argv
    # --skip-verify: run-monthly.ps1 passes this for unattended monthly runs;
    # the sample HTTP checks are advisory only, so skipping them there is safe.
    skip_verify = "--skip-verify" in sys.argv
    n = build_zip(skip_images)
    if dry:
        print("Dry run: bundle built, nothing uploaded. Delete deploy-bundle.zip when done.")
        return 0
    ftp = ds.connect()
    print(f"Connected to {deploy.FTP_HOST}")
    upload_zip(ftp)
    unzip_server_side(ftp)
    if skip_verify:
        print("Skipping live-content sample (--skip-verify).")
    else:
        print("Verifying live content:")
        verify_sample()
    try:
        ftp.delete(ZIP_REMOTE)
    except Exception:
        pass
    ftp.quit()
    print(f"Done — {n} files deployed via single-archive upload.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
