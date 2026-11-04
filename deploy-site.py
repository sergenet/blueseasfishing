#!/usr/bin/env python3
"""
deploy-site.py - Deploy the static site to blueseasfishing.com via FTP.

The FTP login root IS the web root (verified by FTP recon), so paths map 1:1.

Reads credentials from deploy.py (single source of truth; this script never
prints them). Excludes local-only/secret/backend files:
  - .env, server.js, package*.json, the SQLite DB  (backend / secrets)
  - tools/ (build scripts), ' - Copy' / gallery-solid backups
Nothing is deleted on the server; files are only added/overwritten.

Usage:
  python deploy-site.py             # deploy
  python deploy-site.py --dry-run   # list what would be uploaded
"""
import sys
import time
import ftplib
from pathlib import Path

import deploy  # FTP_HOST / FTP_USER / FTP_PASS

BASE = Path(__file__).resolve().parent
SITE = BASE / "blueseas-fishing-working-website" / "blueseasfishing.com"

# android-project: the Android Studio project moved to C:/Projects/BlueSeasFishing-App
# (2026-10-14) — never let it ship with the website again.
EXCLUDE_DIRS = {"tools", "api", "config", "includes", "node_modules", "__pycache__", "android-project"}
EXCLUDE_FILES = {
    ".env",
    "server.js",
    "package.json",
    "package-lock.json",
    "blueseas_fishing.db",
    "deploy.py",
    "deploy-site.py",
}
EXCLUDE_PATTERNS = (" - Copy", "gallery-solid", "~$")  # ~$ = MS Office lock files (e.g. Excel open)


def is_excluded(rel: Path) -> bool:
    parts = rel.parts
    if any(p in EXCLUDE_DIRS for p in parts[:-1]):
        return True
    name = rel.name
    if name.startswith('.') and name != '.htaccess':
        return True  # internal tooling state (.env, .destinations-map.json, ...) — .htaccess must deploy
    if name in EXCLUDE_FILES:
        return True
    if any(pat in name for pat in EXCLUDE_PATTERNS):
        return True
    return False


def collect():
    files = []
    for path in sorted(SITE.rglob("*")):
        if path.is_file():
            rel = path.relative_to(SITE)
            if not is_excluded(rel):
                files.append(rel)
    return files


def connect():
    last_err = None
    for attempt in (1, 2):
        try:
            try:
                ftp = ftplib.FTP_TLS(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS, timeout=60)
                try:
                    ftp.prot_p()  # encrypt data channel too, if the server allows
                except ftplib.error_perm:
                    pass  # control channel still encrypted; proceed
            except (ftplib.error_perm, ConnectionRefusedError, EOFError):
                ftp = ftplib.FTP(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS, timeout=60)
            try:
                ftp.voidcmd('TYPE I')  # binary mode so SIZE matches local sizes
            except ftplib.error_perm:
                pass
            return ftp
        except Exception as e:  # noqa: BLE001 - retry then surface
            last_err = e
            time.sleep(2 * attempt)
    raise RuntimeError(f"Could not connect to {deploy.FTP_HOST}: {last_err}")


def remote_size(ftp, remote):
    """Return remote file size in bytes, or None if missing/unknown."""
    try:
        # sendcmd returns the full response line, e.g. "213 126081" — parse
        # past the status code (int() on the raw string always throws, which
        # silently disabled the skip and re-uploaded every file).
        resp = ftp.sendcmd(f"SIZE {remote}")
        return int(resp.split()[-1])
    except Exception:  # noqa: BLE001
        return None


def upload(ftp, rel: Path) -> str:
    """Upload rel. Returns 'skipped' if remote already matches, else 'uploaded'."""
    remote = "/" + rel.as_posix()
    local = SITE / rel
    # resume: skip files already fully uploaded (size match)
    if remote_size(ftp, remote) == local.stat().st_size:
        return "skipped"
    # ensure parent dirs exist
    parent = rel.parent
    made = ""
    for part in parent.parts:
        made += "/" + part
        try:
            ftp.mkd(made)
        except ftplib.error_perm:
            pass  # already exists
    with open(local, "rb") as f:
        ftp.storbinary(f"STOR {remote}", f, blocksize=32768)
    return "uploaded"


def main() -> int:
    dry = "--dry-run" in sys.argv
    files = collect()
    print(f"{len(files)} files to upload (secrets/backend excluded)")
    if dry:
        for rel in files:
            print("  ", rel.as_posix())
        return 0

    ftp = connect()
    print(f"Connected to {deploy.FTP_HOST}")
    failures = []
    uploaded = skipped = 0
    for i, rel in enumerate(files, 1):
        for attempt in (1, 2, 3):
            try:
                result = upload(ftp, rel)
                if result == "skipped":
                    skipped += 1
                else:
                    uploaded += 1
                break
            except Exception as e:  # noqa: BLE001
                if attempt == 3:
                    failures.append((rel.as_posix(), str(e)))
                else:
                    time.sleep(1.5 * attempt)
                    try:
                        ftp.quit()
                    except Exception:  # noqa: BLE001
                        pass
                    ftp = connect()
        if i % 25 == 0 or i == len(files):
            print(f"  ... {i}/{len(files)} ({uploaded} uploaded, {skipped} already current)", flush=True)
    try:
        ftp.quit()
    except Exception:  # noqa: BLE001
        pass

    if failures:
        print(f"\nFAILED ({len(failures)}):")
        for name, err in failures:
            print(f"  {name}: {err}")
        return 1
    print(f"\nDeployment complete: {uploaded} uploaded, {skipped} already current.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
