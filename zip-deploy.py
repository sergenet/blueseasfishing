#!/usr/bin/env python3
"""
zip-deploy.py - Fast deploy: diff locally, zip changed files, extract on server.

Why: per-file STOR on this host runs ~12 files/min (control-channel latency),
so ~950 changed files would take over an hour. One zip upload + a server-side
extract finishes in minutes.

Steps:
  1. Concurrent SIZE scan against the FTP root -> changed/new files.
  2. Zip exactly those files (paths relative to the site root, same
     exclusions as deploy-site.py).
  3. Upload the zip + a one-shot PHP extractor (random token).
  4. Trigger the extractor over HTTPS; it extracts, then deletes the zip
     and itself.
  5. Verify both are gone (FTP DELE as belt-and-braces).

Credentials come from deploy.py; this script never prints them.

Usage: python zip-deploy.py [--dry-run]
"""
import io
import json
import secrets
import sys
import time
import ftplib
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import deploy  # FTP_HOST / FTP_USER / FTP_PASS
import importlib.util

BASE = Path(__file__).resolve().parent
SITE = BASE / "blueseas-fishing-working-website" / "blueseasfishing.com"
PUBLIC = "https://www.blueseasfishing.com"

# Reuse collect() + exclusions from deploy-site.py so both tools agree.
_spec = importlib.util.spec_from_file_location("deploy_site_mod", BASE / "deploy-site.py")
_ds = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_ds)
collect = _ds.collect

WORKERS = 6  # server rejects with 421 beyond 8 connections from one IP
MAX_ATTEMPTS = 5
ZIP_NAME = "BSF-PKG.zip"


def connect():
    """One FTP session (TLS preferred, plain fallback — same as deploy-site)."""
    for opener in ("tls", "plain"):
        try:
            if opener == "tls":
                ftp = ftplib.FTP_TLS(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS, timeout=60)
                try:
                    ftp.prot_p()
                except ftplib.error_perm:
                    pass
            else:
                ftp = ftplib.FTP(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS, timeout=60)
            try:
                ftp.voidcmd("TYPE I")
            except ftplib.error_perm:
                pass
            return ftp
        except Exception:
            if opener == "plain":
                raise
            time.sleep(1)
    raise RuntimeError("connect failed")


def remote_size(ftp, rel):
    try:
        resp = ftp.sendcmd("SIZE /" + rel.as_posix())
        return int(resp.split()[-1])  # "213 1234" -> 1234 (sendcmd keeps the code)
    except Exception:
        return None


def scan(files):
    """Concurrent size diff. Returns list of changed/new relative paths."""
    changed = []
    per_conn = [files[i::WORKERS] for i in range(WORKERS)]

    def worker(batch):
        # 421 "Too many connections" and transient drops -> back off, retry.
        last = None
        for attempt in range(MAX_ATTEMPTS):
            try:
                ftp = connect()
                out = []
                for rel in batch:
                    local = (SITE / rel).stat().st_size
                    if remote_size(ftp, rel) != local:
                        out.append(rel)
                try:
                    ftp.quit()
                except Exception:
                    pass
                return out
            except Exception as e:  # noqa: BLE001 - retry then surface
                last = e
                time.sleep(2 * (attempt + 1))
        raise RuntimeError(f"scan worker failed after {MAX_ATTEMPTS}: {last}")

    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        for fut in as_completed([ex.submit(worker, b) for b in per_conn if b]):
            changed.extend(fut.result())
    changed.sort()
    return changed


def build_zip(files):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for rel in files:
            zf.write(SITE / rel, rel.as_posix())
    return buf.getvalue()


def php_helper(token):
    # One-shot extractor: token must match query AND embedded constant.
    # Deletes the package and itself immediately after a successful extract.
    return """<?php
@set_time_limit(0);  // a whole-site package (~9k files) outlives the default 30s
$t = '%s';
if (($_GET['t'] ?? '') !== $t) { http_response_code(403); exit('forbidden'); }
$zip = __DIR__ . '/%s';
if (!class_exists('ZipArchive')) { http_response_code(500); exit('no-zip-ext'); }
$z = new ZipArchive();
if ($z->open($zip) !== true) { http_response_code(500); exit('open-failed'); }
$n = $z->numFiles;
$ok = $z->extractTo(__DIR__);
$z->close();
if (!$ok) { http_response_code(500); exit('extract-failed'); }
@unlink($zip);
@unlink(__FILE__);
header('Content-Type: application/json');
echo json_encode(array('ok' => true, 'files' => $n));
""" % (token, ZIP_NAME)


def put(ftp, name, data):
    try:
        ftp.delete("/" + name)  # clear any stale copy
    except ftplib.error_perm:
        pass
    ftp.storbinary("STOR /" + name, io.BytesIO(data))


def read_file_list(path):
    """Relative paths (one per line) to deploy unconditionally.

    The SIZE diff below cannot see a change that keeps a file the same length —
    swapping "Blaue Meere" for "Blue Seas Fishing" in one title and another
    string elsewhere can net out to the same byte count. When the caller knows
    exactly which files were rewritten, this skips the guess instead of hoping
    every edit shifted a byte.
    """
    with open(path, encoding="utf-8") as fh:
        return {Path(line.strip().replace("\\", "/")) for line in fh if line.strip()}


def main():
    dry = "--dry-run" in sys.argv
    t0 = time.time()

    files = collect()
    print(f"{len(files)} deployable files", flush=True)

    explicit = None
    if "--files-from" in sys.argv:
        explicit = read_file_list(sys.argv[sys.argv.index("--files-from") + 1])
        changed = [rel for rel in files if rel in explicit]
        missing = explicit - set(files)
        print(f"explicit list: {len(explicit)} named, {len(changed)} deployable"
              f"{f', {len(missing)} excluded by collect()' if missing else ''}", flush=True)
    else:
        changed = scan(files)
    if not changed:
        print("Nothing changed remotely - no upload needed.")
        return 0
    print(f"changed/new: {len(changed)} files ({time.time() - t0:.0f}s scan)", flush=True)
    # Non-page changes are worth naming: they are the files a bulk page edit
    # (e.g. an indexing-policy re-stamp) should never touch.
    others = [p for p in changed if p.suffix.lower() != ".html"]
    if others:
        print(f"non-HTML changes: {len(others)}", flush=True)
        for rel in others[:400]:
            print("  ", rel.as_posix())
        if len(others) > 400:
            print(f"   ... and {len(others) - 400} more")
    if dry:
        for rel in changed[:50]:
            print("  ", rel.as_posix())
        if len(changed) > 50:
            print(f"   ... and {len(changed) - 50} more")
        return 0

    pkg = build_zip(changed)
    print(f"zip: {len(pkg) / 1048576:.1f} MiB", flush=True)

    token = secrets.token_urlsafe(24)
    helper_name = "bsf-unzip-%s.php" % token[:12]

    ftp = connect()
    put(ftp, ZIP_NAME, pkg)
    put(ftp, helper_name, php_helper(token).encode())
    ftp.quit()
    print("uploaded package + helper", flush=True)

    url = f"{PUBLIC}/{helper_name}?t={token}"
    try:
        with urllib.request.urlopen(url, timeout=300) as r:
            body = r.read().decode()
            print("extract:", body, flush=True)
    except Exception as e:
        print("EXTRACT FAILED:", e)
        return 1

    # Belt-and-braces cleanup if the helper did not self-delete.
    ftp = connect()
    for name in (ZIP_NAME, helper_name):
        try:
            ftp.delete("/" + name)
        except ftplib.error_perm:
            pass
    try:
        ftp.quit()
    except Exception:
        pass

    try:
        with urllib.request.urlopen(f"{PUBLIC}/{ZIP_NAME}", timeout=30) as r:
            print("WARNING: zip still fetchable:", r.status)
    except urllib.error.HTTPError as e:
        print("zip gone:", e.code)
    try:
        with urllib.request.urlopen(f"{PUBLIC}/{helper_name}?t={token}", timeout=30) as r:
            print("WARNING: helper still alive:", r.status)
    except urllib.error.HTTPError as e:
        print("helper gone:", e.code)

    print(f"done in {time.time() - t0:.0f}s - {len(changed)} files extracted")
    return 0


if __name__ == "__main__":
    sys.exit(main())
