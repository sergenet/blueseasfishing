#!/usr/bin/env python3
"""migrate-gallery-media.py — add media_type/duration_sec to gallery_submissions.

Deploy-site.py never ships api/, and the DB is only reachable from PHP on the
host, so this uploads a one-shot script to the webroot, calls it over HTTPS,
and deletes it again. The script needs a random token from this process, so it
cannot be replayed; it also unlinks itself after running.
"""
import ftplib
import secrets
import sys
import urllib.request

import deploy  # FTP_HOST / FTP_USER / FTP_PASS

SITE_URL = "https://www.blueseasfishing.com"


def php_source(token: str) -> str:
    return f"""<?php
$token = '{token}';
if (!hash_equals($token, (string)($_GET['t'] ?? ''))) {{ http_response_code(403); exit('forbidden'); }}
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/api/db-config.php';
try {{ $db = bsfDb(); }} catch (Throwable $e) {{ echo 'ERR db: ' . $e->getMessage(); @unlink(__FILE__); exit; }}
$cols = [];
try {{
  $st = $db->prepare("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gallery_submissions'");
  $st->execute();
  foreach ($st as $r) $cols[strtolower($r['COLUMN_NAME'])] = true;
}} catch (Throwable $e) {{ echo 'ERR inspect: ' . $e->getMessage(); @unlink(__FILE__); exit; }}
if (!$cols) {{ echo 'ERR: gallery_submissions table not found'; @unlink(__FILE__); exit; }}
$added = [];
try {{
  if (!isset($cols['media_type'])) {{
    $db->exec("ALTER TABLE gallery_submissions ADD COLUMN media_type VARCHAR(10) NOT NULL DEFAULT 'image'");
    $added[] = 'media_type';
  }}
  if (!isset($cols['duration_sec'])) {{
    $db->exec("ALTER TABLE gallery_submissions ADD COLUMN duration_sec SMALLINT UNSIGNED NULL DEFAULT NULL");
    $added[] = 'duration_sec';
  }}
}} catch (Throwable $e) {{ echo 'ERR alter: ' . $e->getMessage(); @unlink(__FILE__); exit; }}
$total = (int)$db->query('SELECT COUNT(*) FROM gallery_submissions')->fetchColumn();
$videos = (int)$db->query("SELECT COUNT(*) FROM gallery_submissions WHERE media_type='video'")->fetchColumn();
echo 'OK added=' . (implode(',', $added) ?: 'none') . " rows=$total videos=$videos";
@unlink(__FILE__);
"""


def main() -> int:
    token = secrets.token_hex(12)
    remote = f"_bsf-gallery-media-{token}.php"

    ftp = ftplib.FTP_TLS(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS, timeout=60)
    try:
        ftp.prot_p()
    except ftplib.error_perm:
        pass
    body = php_source(token).encode("utf-8")
    ftp.storbinary(f"STOR {remote}", __import__("io").BytesIO(body))
    ftp.quit()
    print(f"uploaded {remote} ({len(body)} bytes)")

    try:
        with urllib.request.urlopen(f"{SITE_URL}/{remote}?t={token}", timeout=60) as r:
            out = r.read().decode("utf-8", "replace").strip()
    except urllib.error.HTTPError as e:
        out = f"HTTP {e.code}: " + e.read().decode("utf-8", "replace").strip()

    # Belt and braces: the PHP unlinks itself, but remove it here too.
    try:
        ftp = ftplib.FTP_TLS(deploy.FTP_HOST, deploy.FTP_USER, deploy.FTP_PASS, timeout=60)
        try:
            ftp.prot_p()
        except ftplib.error_perm:
            pass
        try:
            ftp.delete(remote)
            print("remote script deleted")
        except ftplib.error_perm as e:
            print("remote delete:", e)
        ftp.quit()
    except Exception as e:  # noqa: BLE001
        print("cleanup connection failed:", e)

    print("server said:", out)
    return 0 if out.startswith("OK") else 1


if __name__ == "__main__":
    sys.exit(main())
