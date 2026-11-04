<?php
/**
 * premium-token.php — mints short-lived HMAC tokens for premium members.
 *
 * The client attaches the token as the X-BSF-Premium header on calls to
 * api.blueseasfishing.com/api/identify-fish; the Node API verifies the HMAC
 * with the shared PREMIUM_TOKEN_SECRET and exempts the request from the
 * per-IP daily quota. The secret is read from the Node app's own .env so
 * there is exactly one place it is stored.
 *
 * Token format: base64url(JSON {uid, tier, exp}) + "." + hex HMAC-SHA256(payload)
 * Lifetime: 10 minutes (client refreshes transparently).
 */

require_once __DIR__ . '/db-config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: https://www.blueseasfishing.com');
header('Vary: Origin');
header('Access-Control-Allow-Credentials: true');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

try {
    session_name('bsf_sess');
    session_set_cookie_params(['path' => '/', 'secure' => true, 'httponly' => true, 'samesite' => 'Lax']);
    session_start();

    if (!isset($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Not signed in']);
        exit;
    }

    $st = bsfDb()->prepare('SELECT id,status FROM users WHERE id=? LIMIT 1');
    $st->execute([(int)$_SESSION['uid']]);
    $u = $st->fetch();
    if (!$u || $u['status'] !== 'premium') {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Premium membership required']);
        exit;
    }

    // Shared secret lives in the Node app's .env (single source of truth)
    $secret = '';
    $envFile = '/home/sergbcqk/api/.env';
    if (is_readable($envFile)) {
        foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            if (preg_match('/^PREMIUM_TOKEN_SECRET\s*=\s*"?([^"\r\n]+)"?/', $line, $m)) {
                $secret = trim($m[1]);
                break;
            }
        }
    }
    if (strlen($secret) < 16) {
        http_response_code(503);
        echo json_encode(['ok' => false, 'error' => 'Premium bypass is not configured']);
        exit;
    }

    $payload = rtrim(strtr(base64_encode(json_encode(['uid' => (int)$u['id'], 'tier' => ($u['status'] === 'premium' ? 'premium' : 'free'), 'exp' => time() + 600])), '+/', '-_'), '=');
    $sig = hash_hmac('sha256', $payload, $secret);

    echo json_encode(['ok' => true, 'data' => ['token' => $payload . '.' . $sig, 'expires_in' => 600]], JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    error_log('Blue Seas premium token failure: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Service temporarily unavailable']);
}
