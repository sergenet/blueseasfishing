#!/usr/bin/env python3
"""deploy-htaccess.py - push .htaccess with automatic rollback on a bad probe.

A root .htaccess edit is the one deploy that can take the whole site down, and a
bulk sync tool gives no clean way back. This uploads the single file, probes the
live host for the behaviours the edit is supposed to change, and if the site is
no longer 200 it immediately re-uploads the staged backup.

Usage:
  python deploy-htaccess.py <backup-file> [--dry-run]
"""
import io
import sys
import time
import ftplib
import urllib.request
import urllib.error
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import deploy  # FTP_HOST / FTP_USER / FTP_PASS

BASE = Path(__file__).resolve().parent
SITE = BASE / "blueseas-fishing-working-website" / "blueseasfishing.com"
LOCAL = SITE / ".htaccess"
PUBLIC = "https://www.blueseasfishing.com"

# (path, expectation) — "ok" means 200, "denied" means 403/404, "any" is logged only.
CHECKS = [
    ("/", "ok"),
    ("/species/largemouth-bass.html", "ok"),
    ("/states/alabama/april.html", "ok"),
    ("/ar/", "ok"),
    ("/sitemap.xml", "ok"),
    ("/robots.txt", "ok"),
    ("/guides/", "denied"),
    ("/states/alabama/", "denied"),
    ("/assets/", "denied"),
    ("/ar/guides/", "denied"),
    ("/icons/", "denied"),
    ("/backup-p0-20261031-214210/", "denied"),
]


def connect():
    try:
        ftp = ftplib.FTP_TLS(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS, timeout=60)
        try:
            ftp.prot_p()
        except ftplib.error_perm:
            pass
        return ftp
    except Exception:
        return ftplib.FTP(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS, timeout=60)


def put(data: bytes):
    ftp = connect()
    try:
        ftp.storbinary("STOR /.htaccess", io.BytesIO(data))
    finally:
        try:
            ftp.quit()
        except Exception:  # noqa: BLE001
            pass


def probe():
    """Return [(path, status, has_listing)]."""
    out = []
    for path, _want in CHECKS:
        try:
            req = urllib.request.Request(PUBLIC + path, headers={"User-Agent": "bsf-deploy-check"})
            with urllib.request.urlopen(req, timeout=30) as r:
                body = r.read(2048).decode("utf-8", "replace")
                out.append((path, r.status, "Index of" in body))
        except urllib.error.HTTPError as e:
            out.append((path, e.code, False))
        except Exception as e:  # noqa: BLE001
            out.append((path, f"ERR {e}", False))
    return out


def report(results):
    bad = []
    for (path, status, has_listing), (_p, want) in zip(results, CHECKS):
        if want == "ok":
            mark = "ok " if status == 200 else "FAIL"
            if status != 200:
                bad.append((path, status))
        elif want == "denied":
            mark = "ok " if status in (403, 404) and not has_listing else "FAIL"
            if not (status in (403, 404) and not has_listing):
                bad.append((path, status))
        else:
            mark = "   "
        print(f"  [{mark}] {path:<34} {status}{' (LISTING!)' if has_listing else ''}")
    return bad


def main():
    dry = "--dry-run" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print("usage: deploy-htaccess.py <backup-file> [--dry-run]")
        return 2
    backup = Path(args[0])
    new = LOCAL.read_bytes()
    old = backup.read_bytes()
    print(f"local .htaccess: {len(new)} B   backup: {backup.name} ({len(old)} B)")
    if new == old:
        print("nothing to do - local file identical to backup")
        return 0

    print("\nbefore:")
    report(probe())
    if dry:
        print("\n--dry-run: not uploading")
        return 0

    put(new)
    print("\nuploaded - waiting for LiteSpeed to pick it up")
    time.sleep(3)
    results = probe()
    print("\nafter:")
    bad = report(results)

    if any(p == "/" for p, _s in bad):
        print("\nSITE DOWN -> restoring backup immediately")
        put(old)
        time.sleep(3)
        print("after rollback:")
        report(probe())
        return 1

    if bad:
        print(f"\n{len(bad)} unexpected result(s); site itself is still up.")
        return 1
    print("\nall probes as expected")
    return 0


if __name__ == "__main__":
    sys.exit(main())
