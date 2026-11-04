#!/usr/bin/env python3
"""upload-newsletter-issues.py

FTP-uploads the current month's newsletter issue bundle
(blueseasfishing.com/newsletter-issues/<YYYY-MM>/) to
webroot/newsletter-issues/<YYYY-MM>/ so the PHP cron sender can read the
email bodies. HTTP access to /newsletter-issues/ is blocked in .htaccess.

Run after deploy-zip.py in the monthly run.
"""
import ftplib
import sys
from pathlib import Path

import deploy  # FTP_HOST / FTP_USER / FTP_PASS

BASE = Path(__file__).resolve().parent
SITE = BASE / "blueseas-fishing-working-website" / "blueseasfishing.com"
STAMP = sys.argv[1] if len(sys.argv) > 1 else None


def main() -> int:
    if STAMP:
        stamp = STAMP
    else:
        # current month by default (the cron sends the current month)
        from datetime import date
        stamp = date.today().strftime("%Y-%m")

    src = SITE / "newsletter-issues" / stamp
    if not src.is_dir():
        print(f"ERROR: {src} does not exist. Run the newsletter generator first.")
        return 1

    files = sorted(src.glob("*.html")) + sorted(src.glob("*.subject.txt"))
    if not files:
        print(f"ERROR: no issue files in {src}")
        return 1

    print(f"Connecting to {deploy.FTP_HOST} ...")
    ftp = ftplib.FTP(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS)

    # Keep the newsletter PHP endpoints current (they live in webroot/api/ on
    # the server; the local working copy is BASE/api/, which the site bundle
    # excludes by design).
    api_dir = BASE / "api"
    for php in ("newsletter.php", "newsletter-cron.php", "admin.php", "selfcheck.php"):
        local = api_dir / php
        if local.is_file():
            with open(local, "rb") as fh:
                ftp.storbinary(f"STOR api/{php}", fh)
            print(f"Uploaded api/{php}")

    def ensure_dir(path: str) -> None:
        for part in path.strip("/").split("/"):
            if not part:
                continue
            try:
                ftp.cwd(part)
            except ftplib.error_perm:
                ftp.mkd(part)
            ftp.cwd("..")

    ensure_dir("newsletter-issues")
    remote_dir = f"newsletter-issues/{stamp}"
    try:
        ftp.cwd(remote_dir)
        ftp.cwd("/")
    except ftplib.error_perm:
        ftp.mkd(remote_dir)

    sent = 0
    for f in files:
        with open(f, "rb") as fh:
            ftp.storbinary(f"STOR {remote_dir}/{f.name}", fh)
        sent += 1

    ftp.quit()
    print(f"Uploaded {sent} issue files -> {remote_dir}/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
