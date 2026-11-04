#!/usr/bin/env python3
"""
delete-retired-destinations.py - one-off cleanup for the destination merge.

deploy-zip.py extracts over the existing tree, so the 28 retired near-duplicate
destination pages (see tools/region-merges.json and .htaccess) would linger on
the server after the merge deploy. The .htaccess 301s keep them consolidated
anyway, but deleting them makes the merge real on disk too.

Uploads a tiny PHP script (same pattern as deploy-zip.py's unzip step) that
unlinks the list, fetches it once over HTTPS, then removes it.

Usage:  python delete-retired-destinations.py          # delete + verify
        python delete-retired-destinations.py --verify  # check only, no delete
"""

import sys
import time
import ftplib
import urllib.request
import importlib.machinery
from pathlib import Path

import deploy  # FTP_HOST / FTP_USER / FTP_PASS
ds = importlib.machinery.SourceFileLoader("ds", str(Path(__file__).parent / "deploy-site.py")).load_module()

PHP_REMOTE = "bsf-retired-cleanup.php"

# The 28 retired destination slugs (keys of tools/region-merges.json, as
# slugified). Keep in sync with the Redirect block in .htaccess.
RETIRED = [
    "atlantic-coast-runs-us", "atlantic-europe-fr-es-pt", "california-offshore",
    "channel-islands-ca", "chesapeake-md", "chesapeake-tributaries", "chesapeake-va-md",
    "florida-beaches", "florida-coasts", "florida-reefs", "florida-us",
    "georges-bank", "georges-bank-ma", "great-lakes", "great-lakes-bays",
    "great-lakes-tributaries", "gulf-of-mexico-fl-tx", "gulf-of-mexico-fl-tx-la",
    "iwp", "iwp-offshore", "iwp-reefs-aus-pac", "iwp-reefs-aus-pac-ind",
    "mediterranean-estuaries", "monterey-bay-ca", "pacific-northwest",
    "pacific-northwest-beaches-wa-or", "pacific-northwest-deepwater",
    "south-atlantic-reefs-fl-nc",
]

PHP_TEMPLATE = """<?php
@set_time_limit(0);
$files = %s;
$ok = 0; $missing = 0; $fail = 0;
foreach ($files as $f) {
    $p = __DIR__ . '/destinations/' . $f . '.html';
    if (!file_exists($p)) { $missing++; continue; }
    if (@unlink($p)) { $ok++; } else { $fail++; echo "FAIL:$f\\n"; }
}
header('Content-Type: text/plain');
echo "deleted=$ok missing=$missing fail=$fail\\n";
if ($fail === 0) { @unlink(__FILE__); echo "script removed\\n"; }
"""

REMOTE_URL = f"https://www.blueseasfishing.com/{PHP_REMOTE}"


def php_literal_list(items):
    inner = ",\n    ".join("'" + s + "'" for s in items)
    return "[\n    " + inner + ",\n  ]"


def fetch_result(deadline_s=120):
    deadline = time.time() + deadline_s
    last_err = None
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(REMOTE_URL, timeout=60) as r:
                body = r.read().decode("utf-8", "replace")
            if body.strip() or "deleted=" in body:
                return body
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return "(script already gone - cleanup ran)"  # idempotent
            last_err = e
        except Exception as e:
            last_err = e
        time.sleep(3)
    raise RuntimeError(f"cleanup script did not answer: {last_err}")


def main():
    verify_only = "--verify" in sys.argv

    # 1) local truth: none of the retired pages should exist locally
    site = Path(__file__).resolve().parent / "blueseas-fishing-working-website" / "blueseasfishing.com"
    local_left = [s for s in RETIRED if (site / "destinations" / f"{s}.html").exists()]
    print(f"Local check: {len(RETIRED)} retired slugs, {len(local_left)} still on disk"
          + (f" -> {local_left}" if local_left else " (clean)"))

    if verify_only:
        return 0

    # 2) upload the delete script
    php = PHP_TEMPLATE % php_literal_list(RETIRED)
    tmp = Path(__file__).resolve().parent / "_bsf-retired-cleanup.php"
    tmp.write_text(php, encoding="utf-8", newline="\n")
    ftp = ds.connect()
    print(f"Connected to {deploy.FTP_HOST}")
    with open(tmp, "rb") as fh:
        ftp.storbinary(f"STOR {PHP_REMOTE}", fh)
    tmp.unlink()
    print(f"Uploaded cleanup script ({len(RETIRED)} targets), running it...")

    # 3) run + read result
    print(f"  server said: {fetch_result().strip()}")

    # 4) belt-and-braces: confirm the script removed itself
    try:
        urllib.request.urlopen(REMOTE_URL, timeout=30)
        print("WARNING: cleanup script still reachable - remove manually!")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print("Cleanup script removed from server.")
        else:
            print(f"NOTE: unexpected status after cleanup: {e}")
    except Exception as e:
        print(f"NOTE: post-check: {e}")

    try:
        ftp.delete(PHP_REMOTE)
    except Exception:
        pass
    ftp.quit()
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
