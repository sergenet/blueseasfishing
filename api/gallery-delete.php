<?php
// api/gallery-delete.php — a member removes one of their OWN uploads (any
// status), together with the stored image files. The owner's admin dashboard
// can delete any submission and orphaned files.

require_once __DIR__ . '/db-config.php';

const DELETE_ORIGIN = 'https://www.blueseasfishing.com';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === DELETE_ORIGIN) {
    header('Access-Control-Allow-Origin: ' . DELETE_ORIGIN);
    header('Vary: Origin');
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function jd(bool $ok, $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($ok ? ['ok' => true, 'data' => $data] : ['ok' => false, 'error' => $data], JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jd(false, 'POST required', 405);

$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
session_name('bsf_sess');
session_set_cookie_params(['path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Lax']);
session_start();
if (!isset($_SESSION['uid'])) jd(false, 'Not logged in', 401);
$uid = (int)$_SESSION['uid'];

$id = (int)($_POST['id'] ?? 0);
if ($id <= 0) jd(false, 'Missing photo id', 422);

try {
    $pdo = bsfDb();
} catch (Throwable $e) {
    jd(false, 'DB connection failed', 500);
}

try {
    // Ownership is enforced in the WHERE clause, never by trusting the client.
    $st = $pdo->prepare('SELECT image_url, thumb_url FROM gallery_submissions WHERE id = ? AND user_id = ? LIMIT 1');
    $st->execute([$id, $uid]);
    $row = $st->fetch();
    if (!$row) jd(false, 'Photo not found', 404);

    $pdo->prepare('DELETE FROM gallery_submissions WHERE id = ? AND user_id = ?')->execute([$id, $uid]);

    // Remove the stored files, but only inside uploads/gallery (path guard).
    $docroot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/');
    $base = realpath($docroot . '/uploads/gallery');
    $removed = 0;
    foreach (['image_url', 'thumb_url'] as $c) {
        $p = (string)($row[$c] ?? '');
        if ($p === '' || $p[0] !== '/') continue;
        $real = realpath($docroot . $p);
        if ($real && $base && strpos($real, $base . DIRECTORY_SEPARATOR) === 0 && is_file($real) && @unlink($real)) {
            $removed++;
        }
    }

    jd(true, ['deleted' => $id, 'files_removed' => $removed]);
} catch (Throwable $e) {
    error_log('Blue Seas gallery delete: ' . $e->getMessage());
    jd(false, 'Delete failed', 500);
}
