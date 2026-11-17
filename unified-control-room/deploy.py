import os
import ftplib
import sys
from pathlib import Path

FTP_HOST = 'premium303.web-hosting.com'
FTP_USER = 'control@blueseasfishing.com'
FTP_PASS = 'Sako!!BSFControl2026'

LOCAL_DIR = Path(__file__).resolve().parent

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
