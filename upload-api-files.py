#!/usr/bin/env python3
"""upload-api-files.py — FTP-upload selected api/*.php files to webroot/api/.

deploy-site.py / deploy-zip.py deliberately exclude api/, but the PHP files live
in BASE/api locally and in webroot/api/ on the server (same pattern as
upload-forum-api.py and upload-newsletter-issues.py).

Usage:
  python upload-api-files.py newsletter-cron.php weekly-brief-cron.php
"""
import ftplib
import sys
from pathlib import Path

import deploy  # FTP_HOST / FTP_USER / FTP_PASS

BASE = Path(__file__).resolve().parent


def upload(name: str) -> bool:
    src = BASE / "api" / name
    if not src.is_file():
        print(f"missing {src}")
        return False
    ftp = ftplib.FTP_TLS(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS, timeout=60)
    try:
        ftp.prot_p()
    except ftplib.error_perm:
        pass
    ftp.voidcmd("TYPE I")
    with open(src, "rb") as fh:
        ftp.storbinary(f"STOR api/{name}", fh, blocksize=32768)
    size = ftp.size(f"api/{name}")
    ftp.quit()
    ok = size == src.stat().st_size
    print(f"uploaded api/{name}: remote={size} local={src.stat().st_size} -> {'OK' if ok else 'MISMATCH'}")
    return ok


def main() -> int:
    names = [a for a in sys.argv[1:] if not a.startswith("-")]
    if not names:
        print(__doc__)
        return 1
    results = [upload(n) for n in names]
    return 0 if all(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
