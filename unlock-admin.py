#!/usr/bin/env python3
"""unlock-admin.py — clear the /admin sign-in lockout.

The brute-force guard in api/admin.php keeps its counters in
<sys_get_temp_dir()>/bsf-admin-throttle.json on the server (3 misses from one
address = 24h lock; 60 misses site-wide = 10min pause). That file is outside
the webroot, so it can only be reached by PHP running on the site.

This uploads a tiny self-deleting PHP shim to the webroot, calls it, then
signs in with the key to prove the lockout is gone.

    python unlock-admin.py                 # clear the lockout
    python unlock-admin.py --check         # only read the throttle state
    python unlock-admin.py --key PASSWORD  # clear it, then verify that key signs in

The key is never hard-coded: a stale value here would burn one of the three
allowed attempts and could lock the owner out again.
"""
import http.cookiejar
import secrets
import sys
import urllib.error
import urllib.parse
import urllib.request

import ftplib

import deploy  # FTP_HOST / FTP_USER / FTP_PASS

SITE = "https://www.blueseasfishing.com"
CHECK_ONLY = "--check" in sys.argv
CANDIDATE = ""
if "--key" in sys.argv:
    i = sys.argv.index("--key")
    if i + 1 < len(sys.argv):
        CANDIDATE = sys.argv[i + 1].strip()


def shim_source(check_only: bool) -> str:
    clear = "" if check_only else """
$removed = @unlink($f);
$after = is_file($f) ? 'still present' : 'gone';
"""
    return f"""<?php
header('Content-Type: text/plain; charset=utf-8');
$f = rtrim(sys_get_temp_dir(), '/') . '/bsf-admin-throttle.json';
$before = is_file($f) ? (string)file_get_contents($f) : '(no file)';
{clear}
echo "OK\\n";
echo 'file=' . $f . "\\n";
echo 'before=' . substr($before, 0, 600) . "\\n";
""" + ("" if check_only else """echo 'after=' . $after . "\\n";
""") + """@unlink(__FILE__);
"""


def upload(name: str, body: str) -> None:
    ftp = ftplib.FTP_TLS(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS, timeout=60)
    try:
        try:
            ftp.prot_p()
        except ftplib.error_perm:
            pass
        ftp.voidcmd("TYPE I")
        tmp = f"{name}.tmp"
        with open(tmp, "wb") as fh:
            fh.write(body.encode("utf-8"))
        with open(tmp, "rb") as fh:
            ftp.storbinary(f"STOR {name}", fh)
        ftp.quit()
    finally:
        try:
            import os
            os.unlink(f"{name}.tmp")
        except OSError:
            pass


def get(url: str) -> tuple[int, str]:
    try:
        with urllib.request.urlopen(url, timeout=60) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def main() -> int:
    name = f"bsf-unlock-{secrets.token_hex(8)}.php"
    upload(name, shim_source(CHECK_ONLY))
    code, body = get(f"{SITE}/{name}")
    print(f"shim {name}: HTTP {code}")
    print(body.strip())
    if not body.startswith("OK"):
        print("WARNING: shim did not confirm; remove it by hand if it is still there.")
        return 1
    code, body = get(f"{SITE}/{name}")
    print(f"shim after self-delete: HTTP {code} (404 = removed)")
    if CHECK_ONLY:
        return 0
    if not CANDIDATE:
        print("lockout cleared; pass --key PASSWORD to also test a sign-in (skipped).")
        return 0

    # Confirm the owner key still signs in and lands on the dashboard.
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(jar),
        urllib.request.HTTPRedirectHandler(),
    )
    data = urllib.parse.urlencode(
        {"action": "login", "access_key": CANDIDATE, "back": "/admin"}
    ).encode()
    req = urllib.request.Request(f"{SITE}/api/admin.php", data=data, method="POST")
    try:
        with opener.open(req, timeout=60) as r:
            page = r.read().decode("utf-8", "replace")
            final = r.geturl()
            status = r.status
    except urllib.error.HTTPError as e:
        page, final, status = e.read().decode("utf-8", "replace"), e.geturl(), e.code
    signed_in = "Admin stats" in page and "all members" in page.lower()
    print(f"sign-in with the owner key: HTTP {status} at {final} -> "
          f"{'dashboard' if signed_in else 'NOT signed in'}")
    if "paused" in page:
        print("still locked: the page reports a sign-in pause")
        return 1
    return 0 if signed_in else 1


if __name__ == "__main__":
    raise SystemExit(main())
