#!/usr/bin/env python3
"""set-smtp-relay.py — one-shot: adds SMTP_HOST / SMTP_PORT / SMTP_USER /
SMTP_PASS to the server Node .env via the established PHP bridge (same
mechanism as set-cron-key.py), so the newsletter crons deliver through the
Namecheap relay instead of anonymous mail().

Credentials are read from mail_creds.py (same mailbox send-outreach.py uses)
and NEVER printed. The temp PHP deletes itself after running.

Usage:  python set-smtp-relay.py
"""
import base64
import ftplib
import sys
import urllib.request
from pathlib import Path

import deploy  # FTP_HOST / FTP_USER / FTP_PASS

BASE = Path(__file__).resolve().parent
LOCAL_PHP = BASE / "_bsf-smtp-setup.php"
REMOTE_PHP = "tmp/bsf-smtp-setup.php"
SITE_URL = "https://www.blueseasfishing.com"


def main() -> int:
    try:
        from mail_creds import MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD
    except ImportError:
        print("ERROR: mail_creds.py not found next to this script.")
        return 1
    if not str(MAIL_PASSWORD).strip():
        print("ERROR: mail_creds.py has an empty MAIL_PASSWORD.")
        return 1

    # base64 so quotes/backslashes in the password can never break the PHP
    def b64(v: str) -> str:
        return base64.b64encode(str(v).encode("utf-8")).decode("ascii")

    print(f"Source mailbox: {MAIL_USER} @ {MAIL_HOST}:{MAIL_PORT} "
          f"(password read, {len(str(MAIL_PASSWORD))} chars, not shown)")

    php = f"""<?php
$envFile = '/home/sergbcqk/api/.env';
$lines = is_file($envFile) ? file($envFile, FILE_IGNORE_NEW_LINES) : [];
$want = [
    'SMTP_HOST' => base64_decode('{b64(MAIL_HOST)}'),
    'SMTP_PORT' => base64_decode('{b64(MAIL_PORT)}'),
    'SMTP_USER' => base64_decode('{b64(MAIL_USER)}'),
    'SMTP_PASS' => base64_decode('{b64(MAIL_PASSWORD)}'),
];
$found = array_fill_keys(array_keys($want), false);
foreach ($lines as $i => $line) {{
    foreach ($want as $k => $v) {{
        if (preg_match('/^' . $k . '\\\\s*=/', $line)) {{ $lines[$i] = $k . '=' . $v; $found[$k] = true; }}
    }}
}}
foreach ($want as $k => $v) if (!$found[$k]) $lines[] = $k . '=' . $v;
file_put_contents($envFile, implode("\\n", $lines) . "\\n", LOCK_EX);
@unlink(__FILE__);
echo 'OK env updated (' . implode(', ', array_keys($want)) . ')';
"""
    LOCAL_PHP.write_text(php, encoding="utf-8", newline="\n")

    print(f"Connecting to {deploy.FTP_HOST} ...")
    ftp = ftplib.FTP_TLS(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS, timeout=60)
    try:
        ftp.prot_p()
    except ftplib.error_perm:
        pass
    try:
        ftp.cwd("tmp")
    except ftplib.error_perm:
        ftp.mkd("tmp")
        ftp.cwd("tmp")
    ftp.cwd("/")
    with open(LOCAL_PHP, "rb") as fh:
        ftp.storbinary(f"STOR {REMOTE_PHP}", fh, blocksize=32768)
    ftp.quit()
    LOCAL_PHP.unlink()

    try:
        with urllib.request.urlopen(f"{SITE_URL}/{REMOTE_PHP}", timeout=60) as r:
            body = r.read().decode("utf-8", "replace")
    except Exception as e:
        body = str(e)
    print(f"server said: {body}")
    if not body.startswith("OK"):
        print("WARNING: .env update did not confirm; check the tmp/ script manually.")
        return 1

    # confirm the temp script really removed itself
    try:
        with urllib.request.urlopen(f"{SITE_URL}/{REMOTE_PHP}", timeout=30) as r:
            leftover = r.status == 200
    except urllib.error.HTTPError as e:
        leftover = e.code != 404
    except Exception:
        leftover = True
    print("temp script still reachable!" if leftover else "temp script removed (404)")
    return 1 if leftover else 0


if __name__ == "__main__":
    raise SystemExit(main())
