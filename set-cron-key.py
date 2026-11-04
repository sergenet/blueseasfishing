#!/usr/bin/env python3
"""set-cron-key.py — one-shot: adds CRON_KEY (+ optional SENDGRID_API_KEY) to the
server Node .env via the established PHP bridge (same mechanism as API deploys),
then verifies the newsletter cron endpoint. The temp PHP deletes itself.

Usage:
  python set-cron-key.py                 # sets CRON_KEY from local BSF_CRON_KEY (setx) value
  python set-cron-key.py --sendgrid SG.xxxx   # also sets SENDGRID_API_KEY
  python set-cron-key.py --sendgrid-file <path>  # read the SendGrid key from a local
                                          # private file (keeps it out of shell history);
                                          # intended for C:\Projects\BlueSeasFishing-Website\.sendgrid-key.txt
"""
import ftplib
import subprocess
import sys
import urllib.request
from pathlib import Path

import deploy

BASE = Path(__file__).resolve().parent
LOCAL_PHP = BASE / "_bsf-env-setup.php"
REMOTE_PHP = "tmp/bsf-env-setup.php"
SITE_URL = "https://www.blueseasfishing.com"


def local_cron_key() -> str:
    r = subprocess.run(
        ["powershell", "-NoProfile", "-Command",
         "[Environment]::GetEnvironmentVariable('BSF_CRON_KEY','User')"],
        capture_output=True, text=True,
    )
    return (r.stdout or "").strip()


def main() -> int:
    cron_key = local_cron_key()
    if not cron_key:
        print("ERROR: BSF_CRON_KEY not found (user env). Run setx first.")
        return 1

    sendgrid = ""
    if "--sendgrid" in sys.argv:
        i = sys.argv.index("--sendgrid")
        if i + 1 < len(sys.argv):
            sendgrid = sys.argv[i + 1].strip()
    if "--sendgrid-file" in sys.argv:
        i = sys.argv.index("--sendgrid-file")
        if i + 1 < len(sys.argv):
            keyFile = Path(sys.argv[i + 1]).expanduser()
            if not keyFile.is_file():
                print(f"ERROR: key file not found: {keyFile}")
                return 1
            sendgrid = keyFile.read_text(encoding="utf-8").strip()
            if not sendgrid.startswith("SG."):
                print("ERROR: key file does not contain a SendGrid API key (expected SG. prefix).")
                return 1
            print(f"Read SendGrid key from {keyFile.name} ({len(sendgrid)} chars, not shown).")

    php = f"""<?php
$envFile = '/home/sergbcqk/api/.env';
$lines = is_file($envFile) ? file($envFile, FILE_IGNORE_NEW_LINES) : [];
$cron = '{cron_key}';
$sg = '{sendgrid}';
$found = ['CRON_KEY' => false, 'SENDGRID_API_KEY' => false];
foreach ($lines as $i => $line) {{
    if (preg_match('/^CRON_KEY\\s*=/', $line)) {{ $lines[$i] = 'CRON_KEY=' . $cron; $found['CRON_KEY'] = true; }}
    if ($sg !== '' && preg_match('/^SENDGRID_API_KEY\\s*=/', $line)) {{ $lines[$i] = 'SENDGRID_API_KEY=' . $sg; $found['SENDGRID_API_KEY'] = true; }}
}}
if (!$found['CRON_KEY']) $lines[] = 'CRON_KEY=' . $cron;
if ($sg !== '' && !$found['SENDGRID_API_KEY']) $lines[] = 'SENDGRID_API_KEY=' . $sg;
file_put_contents($envFile, implode("\\n", $lines) . "\\n", LOCK_EX);
@unlink(__FILE__);
echo 'OK env updated (CRON_KEY' . ($sg !== '' ? ' + SENDGRID_API_KEY' : '') . ')';
"""
    LOCAL_PHP.write_text(php, encoding="utf-8", newline="\n")

    print(f"Connecting to {deploy.FTP_HOST} ...")
    ftp = ftplib.FTP(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS)
    try:
        ftp.cwd("tmp")
    except ftplib.error_perm:
        ftp.mkd("tmp")
        ftp.cwd("tmp")
    ftp.cwd("/")
    with open(LOCAL_PHP, "rb") as fh:
        ftp.storbinary(f"STOR {REMOTE_PHP}", fh)
    ftp.quit()
    LOCAL_PHP.unlink()

    try:
        with urllib.request.urlopen(f"{SITE_URL}/{REMOTE_PHP}", timeout=60) as r:
            body = r.read().decode("utf-8", "replace")
    except Exception as e:
        body = str(e)
    print(f"server said: {body}")
    if not body.startswith("OK"):
        print("WARNING: env update did not confirm; check the tmp/ script manually.")
        return 1

    # Verify: wrong key must 403, right key must return JSON status.
    for key, label in (("wrongkey", "wrong key (expect Forbidden)"), (cron_key, "real key")):
        try:
            with urllib.request.urlopen(f"{SITE_URL}/api/newsletter-cron.php?key={key}", timeout=60) as r:
                out = r.read().decode("utf-8", "replace")
                code = r.status
        except urllib.error.HTTPError as e:
            out, code = e.read().decode("utf-8", "replace"), e.code
        print(f"{label}: HTTP {code} {out[:220]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
