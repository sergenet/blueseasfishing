<?php
/**
 * grant-premium.php — ONE-TIME admin script (2026-09-27)
 * Sets sergenet@yahoo.com to status='premium' in the users table.
 * Delete this file after running.
 */

require_once __DIR__ . '/db-config.php';
header('Content-Type: text/plain; charset=utf-8');

$email = 'sergenet@yahoo.com';

try {
    $db = bsfDb();
    $st = $db->prepare('SELECT id, email, status FROM users WHERE email = ? LIMIT 1');
    $st->execute([$email]);
    $u = $st->fetch();

    if (!$u) {
        echo "USER NOT FOUND for $email — no row in users table.\n";
        exit;
    }

    echo "Found: id={$u['id']} email={$u['email']} status={$u['status']}\n";

    if ($u['status'] === 'premium') {
        echo "Already premium. Nothing to do.\n";
        exit;
    }

    $up = $db->prepare("UPDATE users SET status='premium', updated_at=NOW() WHERE id=?");
    $up->execute([$u['id']]);
    echo "UPDATED: status is now 'premium' (unlimited identifications, 5/day gate removed).\n";
} catch (Throwable $e) {
    http_response_code(500);
    echo 'ERROR: ' . $e->getMessage() . "\n";
}
