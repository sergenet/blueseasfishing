#!/usr/bin/env python3
"""
set-newsletter-settings.py — writes NEWSLETTER_POSTAL / NEWSLETTER_FROM into the
server Node .env (/home/sergbcqk/api/.env) via the same self-deleting PHP bridge
that set-cron-key.py uses.

Why a separate script: set-cron-key.py always rewrites CRON_KEY from the local
user env; this one touches only the two newsletter values, so it is safe to run
without touching the cron key.

The PHP reports back only which keys exist and how long each value is — never
the values themselves.

Usage:
  python set-newsletter-settings.py --postal "20249 Livorno Way, Porter Ranch, CA 91326" \
                                    --from contact@blueseasfishing.com
"""

import ftplib
import sys
import urllib.request
from pathlib import Path

import deploy

BASE = Path(__file__).resolve().parent
LOCAL_PHP = BASE / "_bsf-env-postal.php"
REMOTE_PHP = "tmp/bsf-env-postal.php"
SITE_URL = "https://www.blueseasfishing.com"


def arg(name: str) -> str:
    if name not in sys.argv:
        return ""
    i = sys.argv.index(name)
    if i + 1 >= len(sys.argv):
        raise SystemExit(f"ERROR: {name} needs a value")
    return sys.argv[i + 1].strip()


def php_string(value: str) -> str:
    """Embed a value as a PHP single-quoted literal."""
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def main() -> int:
    postal = arg("--postal")
    from_email = arg("--from")
    if not postal:
        print("ERROR: --postal is required")
        return 1

    php = f"""<?php
$envFile = '/home/sergbcqk/api/.env';
$lines = is_file($envFile) ? file($envFile, FILE_IGNORE_NEW_LINES) : [];
$want = ['NEWSLETTER_POSTAL' => {php_string(postal)}];
$from = {php_string(from_email)};
if ($from !== '') $want['NEWSLETTER_FROM'] = $from;
$seen = [];
foreach ($want as $key => $val) {{
    $seen[$key] = false;
    foreach ($lines as $i => $line) {{
        if (preg_match('/^' . $key . '\\\\s*=/', $line)) {{
            $lines[$i] = $key . '="' . $val . '"';
            $seen[$key] = true;
        }}
    }}
    if (!$seen[$key]) $lines[] = $key . '="' . $val . '"';
}}
file_put_contents($envFile, implode("\\n", $lines) . "\\n", LOCK_EX);

// Re-read and report presence + length only, never the value itself.
$check = [];
foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {{
    if (preg_match('/^([A-Z0-9_]+)\\\\s*=\\\\s*"?([^"\\\\r\\\\n]*)"?/', $line, $m)) {{
        $check[$m[1]] = strlen(trim($m[2]));
    }}
}}
@unlink(__FILE__);
header('Content-Type: text/plain');
$out = ['OK'];
foreach (array_keys($want) as $k) {{
    $out[] = $k . '=' . (isset($check[$k]) ? 'set(' . $check[$k] . ' chars)' : 'MISSING');
}}
echo implode(' ', $out);
"""

    LOCAL_PHP.write_text(php, encoding="utf-8", newline="\n")

    print(f"Connecting to {deploy.FTP_HOST} ...")
    ftp = ftplib.FTP(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS)
    try:
        ftp.cwd("tmp")
    except ftplib.error_perm:
        ftp.mkd("tmp")
    ftp.cwd("/")
    with open(LOCAL_PHP, "rb") as fh:
        ftp.storbinary(f"STOR {REMOTE_PHP}", fh)
    ftp.quit()
    LOCAL_PHP.unlink()
    print(f"Staged {REMOTE_PHP}; running it server-side ...")

    try:
        with urllib.request.urlopen(f"{SITE_URL}/{REMOTE_PHP}", timeout=60) as r:
            body = r.read().decode("utf-8", "replace").strip()
    except Exception as e:
        print(f"ERROR: could not run the bridge: {e}")
        return 1

    print(f"server said: {body}")
    if not body.startswith("OK"):
        print("WARNING: env update did not confirm — inspect the PHP output above.")
        return 1
    if "MISSING" in body:
        print("WARNING: at least one key did not land in the .env file.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
