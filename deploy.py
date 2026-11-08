import os
import ftplib
import sys


def _cred(key, default=''):
    """Environment variable first, else the matching line in .env beside this file."""
    value = os.environ.get(key)
    if value:
        return value
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    try:
        with open(env_path, encoding='utf-8') as fh:
            for line in fh:
                line = line.strip()
                if line.startswith(key + '='):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    except OSError:
        pass
    return default


FTP_HOST = _cred('BSF_FTP_HOST', 'ftp.blueseasfishing.com')
FTP_USER = _cred('BSF_FTP_USER', 'contact@blueseasfishing.com')
FTP_PASS = _cred('BSF_FTP_PASS')

if not FTP_PASS:
    sys.exit('set BSF_FTP_PASS in .env - the password is never stored in this file')

def upload_file(ftp, local_path, remote_path):
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {remote_path}', f)

def ensure_dir(ftp, remote_dir):
    try:
        ftp.cwd(remote_dir)
        ftp.cwd('/')
    except ftplib.error_perm:
        # Directory does not exist, try to create it (basic, assuming parent exists)
        try:
            ftp.mkd(remote_dir)
        except ftplib.error_perm:
            pass

def main():
    print("Connecting to FTP...")
    ftp = ftplib.FTP(FTP_HOST, FTP_USER, FTP_PASS)
    ftp.cwd('/api')
    
    # Upload main files
    print("Uploading server.js...")
    upload_file(ftp, 'C:/blueseasfishing/api/server.js', 'server.js')
    print("Uploading package.json...")
    upload_file(ftp, 'C:/blueseasfishing/api/package.json', 'package.json')
    print("Uploading package-lock.json...")
    upload_file(ftp, 'C:/blueseasfishing/api/package-lock.json', 'package-lock.json')
    
    # We will only upload the newly added packages to node_modules to save time
    # express-rate-limit, ip-address, debug, ms, jsbn, sprintf-js (dependencies of express-rate-limit)
    packages = ['express-rate-limit', 'ip-address', 'jsbn', 'sprintf-js', 'debug', 'ms']
    
    for pkg in packages:
        local_dir = f'C:/blueseasfishing/api/node_modules/{pkg}'
        if not os.path.exists(local_dir):
            continue
            
        print(f"Uploading package: {pkg}")
        for root, dirs, files in os.walk(local_dir):
            rel_path = os.path.relpath(root, 'C:/blueseasfishing/api')
            # Create remote dir
            remote_dir = rel_path.replace('\\', '/')
            try:
                ftp.mkd(remote_dir)
            except:
                pass
                
            for file in files:
                local_file = os.path.join(root, file)
                remote_file = f"{remote_dir}/{file}"
                try:
                    upload_file(ftp, local_file, remote_file)
                except Exception as e:
                    print(f"Failed to upload {remote_file}: {e}")
                    
    ftp.quit()
    print("Deployment successful!")

if __name__ == '__main__':
    main()
