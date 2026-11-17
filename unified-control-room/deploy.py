import os
import json
import ftplib
import sys
from pathlib import Path

LOCAL_DIR = Path(__file__).resolve().parent
CREDS_FILE = LOCAL_DIR / ".control-room-creds.json"

_creds = {}
if CREDS_FILE.exists():
    try:
        with open(CREDS_FILE, "r", encoding="utf-8") as _cf:
            _creds = json.load(_cf)
    except Exception:
        pass

FTP_HOST = _creds.get("FTP_HOST") or os.environ.get("FTP_HOST", "premium303.web-hosting.com")
FTP_USER = _creds.get("FTP_USER") or os.environ.get("FTP_USER", "control@blueseasfishing.com")
FTP_PASS = _creds.get("FTP_PASS") or os.environ.get("FTP_PASS", "")

def upload_dir(ftp, local_path, remote_path=''):
    for item in local_path.iterdir():
        if item.name.startswith(('.', '__pycache__', 'sync-ga4.py', 'deploy.py')):
            continue
        
        target_remote = f"{remote_path}/{item.name}" if remote_path else item.name
        
        if item.is_dir():
            # Check or create remote directory
            try:
                ftp.mkd(target_remote)
                print(f"Created remote dir: {target_remote}")
            except ftplib.error_perm:
                pass  # Directory already exists
            upload_dir(ftp, item, target_remote)
        else:
            print(f"Uploading: {target_remote} ...")
            with open(item, 'rb') as f:
                ftp.storbinary(f"STOR {target_remote}", f)

def main():
    print(f"Connecting to {FTP_HOST} as {FTP_USER}...")
    try:
        ftp = ftplib.FTP(FTP_HOST, timeout=30)
        ftp.login(FTP_USER, FTP_PASS)
        print("Logged in successfully! PWD:", ftp.pwd())
        
        upload_dir(ftp, LOCAL_DIR)
        
        print("\nAll files uploaded successfully!")
        print("Remote files:", ftp.nlst())
        ftp.quit()
        print("\nDeployment COMPLETE! Check https://control.blueseasfishing.com")
    except Exception as e:
        print("Deployment failed:", e)
        sys.exit(1)

if __name__ == '__main__':
    main()
