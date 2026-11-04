#!/usr/bin/env python3
"""upload-forum-api.py — FTP-upload api/forum.php to webroot/api/forum.php.

deploy-site.py / deploy-zip.py deliberately exclude api/, but the PHP files
live in BASE/api locally and in webroot/api/ on the server (same pattern as
upload-newsletter-issues.py for the newsletter endpoints).
"""
import ftplib
from pathlib import Path

import deploy  # FTP_HOST / FTP_USER / FTP_PASS

BASE = Path(__file__).resolve().parent
SRC = BASE / "api" / "forum.php"
REMOTE = "api/forum.php"


def main() -> int:
    if not SRC.is_file():
        print(f"missing {SRC}")
        return 1
    ftp = ftplib.FTP_TLS(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS, timeout=60)
    try:
        ftp.prot_p()
    except ftplib.error_perm:
        pass
    ftp.voidcmd("TYPE I")
    with open(SRC, "rb") as fh:
        ftp.storbinary(f"STOR {REMOTE}", fh, blocksize=32768)
    size = ftp.size(REMOTE)
    ftp.quit()
    ok = size == SRC.stat().st_size
    print(f"uploaded {REMOTE}: remote={size} local={SRC.stat().st_size} -> {'OK' if ok else 'MISMATCH'}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
