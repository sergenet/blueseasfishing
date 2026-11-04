#!/usr/bin/env python3
"""One-off: does this host allow `Options` in .htaccess?

Uploads a throwaway directory containing `.htaccess` with `Options -Indexes`
plus a text file, reads it back over HTTPS, then deletes it.

  GET /_optprobe/          -> 403 == directive honoured (safe to set it at root)
                             500 == directive not allowed (would break the site)
                             200 "Index of" == directive ignored
  GET /_optprobe/probe.txt -> must stay 200; a 500 here means the directory is
                             poisoned, i.e. the directive is rejected outright.
"""
import io
import sys
import time
import ftplib
import urllib.request
import urllib.error
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import deploy  # FTP_HOST / FTP_USER / FTP_PASS

PUBLIC = "https://www.blueseasfishing.com"
DIR = "_optprobe"
FILES = {
    ".htaccess": b"Options -Indexes\n",
    "probe.txt": b"optprobe\n",
}


def connect():
    try:
        ftp = ftplib.FTP_TLS(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS, timeout=60)
        try:
            ftp.prot_p()
        except ftplib.error_perm:
            pass
        return ftp
    except Exception:
        return ftplib.FTP(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS, timeout=60)


def get(url):
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            body = r.read(4096).decode("utf-8", "replace")
            return r.status, body
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:  # noqa: BLE001
        return None, str(e)


def cleanup(ftp):
    for name in FILES:
        try:
            ftp.delete(f"/{DIR}/{name}")
        except ftplib.error_perm:
            pass
    try:
        ftp.rmd(f"/{DIR}")
    except ftplib.error_perm:
        pass


def main():
    ftp = connect()
    try:
        try:
            ftp.rmd(f"/{DIR}")  # clear a stale probe from a previous run
        except ftplib.error_perm:
            pass
        ftp.mkd(f"/{DIR}")
        for name, data in FILES.items():
            ftp.storbinary(f"STOR /{DIR}/{name}", io.BytesIO(data))
        ftp.quit()
        print(f"uploaded /{DIR}/")
        time.sleep(1)

        listing_status, listing_body = get(f"{PUBLIC}/{DIR}/")
        file_status, _ = get(f"{PUBLIC}/{DIR}/probe.txt")
        print(f"  /{DIR}/          -> {listing_status}")
        print(f"  /{DIR}/probe.txt -> {file_status}")
        if listing_status == 403 and file_status == 200:
            print("VERDICT: Options IS permitted in .htaccess (dir now 403, file still 200)")
        elif listing_status == 500 or file_status == 500:
            print("VERDICT: Options is NOT permitted - do not touch the root .htaccess")
        elif listing_status == 200 and "Index of" in listing_body:
            print("VERDICT: directive IGNORED - directory listing still served")
        else:
            print(f"VERDICT: ambiguous (dir={listing_status}, file={file_status})")
    finally:
        try:
            if not ftp.sock:
                ftp = connect()
        except Exception:  # noqa: BLE001
            ftp = connect()
        cleanup(ftp)
        try:
            ftp.quit()
        except Exception:  # noqa: BLE001
            pass
        print(f"cleaned up /{DIR}/")
        s1, b1 = get(f"{PUBLIC}/{DIR}/")
        print(f"  after cleanup /{DIR}/ -> {s1}")


if __name__ == "__main__":
    main()
