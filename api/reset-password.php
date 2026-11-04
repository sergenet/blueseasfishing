<?php
/**
 * reset-password.php — ONE-TIME admin script (2026-09-27)
 * Resets sergenet@yahoo.com's password to the password provided in ?p=
 * (called once, then deleted from the server).
 */

require_once __DIR__ . '/db-config.php';
header('Content-Type: text/plain; charset=utf-8');

$email = 'sergenet@yahoo.com';
$newPassword = isset($_POST['p']) ? (string)$_POST['p'] : (isset($_GET['p']) ? (string)$_GET['p'] : '');

if (strlen($newPassword) < 8) {
    echo 'ERROR: password too short or missing.';
    exit;
}

try {
    $db = bsfDb();
    $st = $db->prepare('SELECT id, email, status FROM users WHERE email = ? LIMIT 1');
    $st->execute([$email]);
    $u = $st->fetch();

    if (!$u) {
        echo "USER NOT FOUND for $email\n";
        exit;
    }

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);

    $up = $db->prepare('UPDATE users SET password_hash=?, updated_at=NOW() WHERE id=?');
    $up->execute([$hash, $u['id']]);

    // verify it round-trips
    $st2 = $db->prepare('SELECT password_hash FROM users WHERE id=?');
    $st2->execute([$u['id']]);
    $row = $st2->fetch();

    echo password_verify($newPassword, $row['password_hash'])
        ? "OK: password updated for id={$u['id']} ({$u['email']}) and verified.\n"
        : "ERROR: update ran but verification failed.\n";
} catch (Throwable $e) {
    http_response_code(500);
    echo 'ERROR: ' . $e->getMessage() . "\n";
}
