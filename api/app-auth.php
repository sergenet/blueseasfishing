<?php
/**
 * app-auth.php — accounts for the mobile app (iOS/Android), plus the link that
 * turns an App Store subscription into website-side Premium.
 *
 * WHY THIS EXISTS: the app ships with no login, so an App Store subscriber has
 * no identity the website or the AI API can recognise. This endpoint gives the
 * app the same `users` rows the website uses, but authenticates with a bearer
 * token instead of a PHP session cookie (React Native has no cookie jar):
 *
 *   POST action=register       email, password, name      -> user + token
 *   POST action=login          email, password            -> user + token
 *   GET  action=me             Authorization: Bearer ...  -> user + premium
 *   POST action=logout         Authorization: Bearer ...  -> revoke marker
 *   GET  action=premium-token  Authorization: Bearer ...  -> X-BSF-Premium token
 *   POST action=link-purchase  Authorization: Bearer ..., jws
 *                                                          -> verify with Apple,
 *                                                             set users.status
 *
 * Tokens are stateless: base64url(JSON {uid, exp}) + '.' + HMAC-SHA256(payload),
 * signed with APP_AUTH_SECRET when present in .blueseasfishing-secrets.php and
 * otherwise with a value derived from the database password. Rotating either
 * secret signs every device out — logout is therefore also stateless: the app
 * forgets the token. Nothing is stored per session, so there is no schema change.
 *
 * premium-token output is the exact format api.blueseasfishing.com already
 * verifies (HMAC with PREMIUM_TOKEN_SECRET, uid + tier + exp), which is what
 * exempts a paying user from the per-IP AI quota.
 */

require_once __DIR__ . '/db-config.php';
require_once __DIR__ . '/app-token.php';
require_once __DIR__ . '/app-apple.php';

const APP_PREMIUM_TTL = 600;     // 10 minutes, matching api/premium-token.php

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

function appOut(array $payload, int $code = 200): void {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}
function appFail(string $message, int $code = 400, string $code_name = ''): void {
    $out = ['ok' => false, 'error' => $message];
    if ($code_name !== '') $out['code'] = $code_name;
    appOut($out, $code);
}

/* ---- request auth -------------------------------------------------------- */

function appBearer(): string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($header === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) {
            if (strtolower($k) === 'authorization') $header = $v;
        }
    }
    if (preg_match('/^Bearer\s+(\S+)$/i', trim($header), $m)) return $m[1];
    return '';
}

/**
 * The secret api.blueseasfishing.com verifies X-BSF-Premium tokens with. It
 * lives in the Node app's .env; a `premium_token_secret` entry in the private
 * settings file wins when present (that is how local test runs configure it).
 */
function appPremiumSecret(): string {
    $settings = bsfPrivateSettings();
    $fromSettings = trim((string)($settings['premium_token_secret'] ?? ''));
    if (strlen($fromSettings) >= 16) return $fromSettings;
    $fromEnv = trim((string)(getenv('PREMIUM_TOKEN_SECRET') ?: ''));
    if (strlen($fromEnv) >= 16) return $fromEnv;
    $envFile = '/home/sergbcqk/api/.env';
    if (is_readable($envFile)) {
        foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            if (preg_match('/^PREMIUM_TOKEN_SECRET\s*=\s*"?([^"\r\n]+)"?/', $line, $m)) {
                return trim($m[1]);
            }
        }
    }
    return '';
}

/** The signed-in user, or a 401. */
function appRequireUser(PDO $db): array {
    $token = appBearer();
    if ($token === '') appFail('Sign in to continue.', 401, 'unauthenticated');
    $uid = appTokenUid($token);
    if ($uid === null) appFail('Your session has expired. Please sign in again.', 401, 'expired');
    $st = $db->prepare('SELECT id,email,name,status FROM users WHERE id = ? LIMIT 1');
    $st->execute([$uid]);
    $user = $st->fetch();
    if (!$user) appFail('Your session has expired. Please sign in again.', 401, 'expired');
    return $user;
}

function appUserPayload(array $user): array {
    return [
        'id' => (int)$user['id'],
        'email' => (string)($user['email'] ?? ''),
        'name' => (string)($user['name'] ?? ''),
        'status' => (string)($user['status'] ?? 'member'),
        'premium' => (($user['status'] ?? '') === 'premium'),
    ];
}

/* ---- request body -------------------------------------------------------- */

function appInput(): array {
    $ctype = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
    if (strpos($ctype, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $json = json_decode((string)$raw, true);
        return is_array($json) ? $json : [];
    }
    return $_POST;
}

/* ---- router -------------------------------------------------------------- */

$action = strtolower((string)($_GET['action'] ?? $_POST['action'] ?? ''));
$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$input = appInput();
if ($action === '' && isset($input['action'])) $action = strtolower((string)$input['action']);

try {
    $db = bsfDb();
} catch (Throwable $e) {
    appFail('Service temporarily unavailable.', 503, 'db');
}

try {
    if ($action === 'register') {
        if ($method !== 'POST') appFail('Use POST for registration.', 405);
        $email = strtolower(trim((string)($input['email'] ?? '')));
        $password = (string)($input['password'] ?? '');
        $name = trim((string)($input['name'] ?? ''));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) appFail('Enter a valid email address.', 422, 'email');
        if (strlen($password) < 8) appFail('Password must be at least 8 characters.', 422, 'password');

        $exists = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $exists->execute([$email]);
        if ($exists->fetch()) appFail('That email already has an account — sign in instead.', 409, 'email_taken');

        // The legacy schema needs a unique username even though people sign in
        // with their email; generate an opaque one instead of asking for it.
        $insert = $db->prepare('INSERT INTO users (username, email, password_hash, name, status, created_at, updated_at)
            VALUES (?,?,?,?,?,NOW(),NOW())');
        $insert->execute([
            'member_' . bin2hex(random_bytes(8)),
            $email,
            password_hash($password, PASSWORD_DEFAULT),
            $name,
            'member',
        ]);
        $uid = (int)$db->lastInsertId();
        $user = ['id' => $uid, 'email' => $email, 'name' => $name, 'status' => 'member'];
        appOut(['ok' => true, 'data' => ['user' => appUserPayload($user), 'token' => appMintToken($uid)]]);
    }

    if ($action === 'login') {
        if ($method !== 'POST') appFail('Use POST to sign in.', 405);
        $email = strtolower(trim((string)($input['email'] ?? '')));
        $password = (string)($input['password'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) appFail('Enter a valid email address.', 422, 'email');
        $st = $db->prepare('SELECT id,email,name,status,password_hash FROM users WHERE email = ? LIMIT 1');
        $st->execute([$email]);
        $user = $st->fetch();
        if (!$user || empty($user['password_hash']) || !password_verify($password, $user['password_hash'])) {
            // Deliberately identical for unknown email and wrong password.
            appFail('Wrong email or password.', 401, 'credentials');
        }
        $db->prepare('UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = ?')->execute([(int)$user['id']]);
        appOut(['ok' => true, 'data' => [
            'user' => appUserPayload($user),
            'token' => appMintToken((int)$user['id']),
        ]]);
    }

    if ($action === 'me') {
        $user = appRequireUser($db);
        appOut(['ok' => true, 'data' => ['user' => appUserPayload($user)]]);
    }

    if ($action === 'logout') {
        // Tokens are stateless; forgetting it on the device is the logout.
        appRequireUser($db);
        appOut(['ok' => true, 'data' => ['message' => 'Signed out']]);
    }

    if ($action === 'premium-token') {
        $user = appRequireUser($db);
        if (($user['status'] ?? '') !== 'premium') {
            appFail('Premium membership required.', 403, 'not_premium');
        }
        // Same wire format api.blueseasfishing.com verifies.
        $secret = appPremiumSecret();
        if (strlen($secret) < 16) appFail('Premium is not configured on the server.', 503, 'not_configured');
        $payload = appB64(json_encode([
            'uid' => (int)$user['id'],
            'tier' => 'premium',
            'exp' => time() + APP_PREMIUM_TTL,
        ]));
        appOut(['ok' => true, 'data' => [
            'token' => $payload . '.' . hash_hmac('sha256', $payload, $secret),
            'expires_in' => APP_PREMIUM_TTL,
        ]]);
    }

    if ($action === 'link-purchase') {
        if ($method !== 'POST') appFail('Use POST to link a purchase.', 405);
        $user = appRequireUser($db);
        $jws = trim((string)($input['jws'] ?? ''));
        $original = trim((string)($input['original_transaction_id'] ?? $input['transaction_id'] ?? ''));
        if ($jws === '' && $original === '') appFail('A StoreKit transaction is required.', 422, 'missing_transaction');

        // The transaction id is the only value Apple accepts in this endpoint;
        // the JWS itself is verified by Apple before we trust any claim in it.
        $txId = $original;
        if ($txId === '' && $jws !== '') {
            $parts = explode('.', $jws);
            $claims = json_decode(appUnb64($parts[1] ?? ''), true);
            $txId = trim((string)($claims['originalTransactionId'] ?? $claims['transactionId'] ?? ''));
        }
        if ($txId === '') appFail('That transaction could not be read.', 422, 'unreadable_transaction');

        try {
            $latest = appAppleSubscription($txId);
        } catch (Throwable $e) {
            $reason = $e->getMessage();
            if ($reason === 'apple-not-configured') {
                appFail('App Store verification is not configured yet.', 503, 'not_configured');
            }
            error_log('Blue Seas app purchase link failed: ' . $reason);
            appFail('Could not verify that purchase with the App Store.', 502, 'verify_failed');
        }

        $status = (int)($latest['status'] ?? 0);
        $active = in_array($status, [1, 4], true); // 1 active, 4 billing retry (grace)
        $productId = (string)($latest['productId'] ?? '');
        $planId = stripos($productId, 'year') !== false ? 2 : 1;
        $expires = isset($latest['expiresDate']) ? (int)$latest['expiresDate'] : 0;

        $db->beginTransaction();
        $find = $db->prepare("SELECT id FROM subscriptions WHERE external_provider='apple' AND external_id=? LIMIT 1");
        $find->execute([$txId]);
        $existing = $find->fetchColumn();
        if ($existing) {
            $db->prepare('UPDATE subscriptions SET plan_id=?, status=?, updated_at=NOW(), canceled_at=? WHERE id=?')
               ->execute([$planId, $active ? 'active' : 'expired', $active ? null : date('Y-m-d H:i:s', time()), $existing]);
        } else {
            $db->prepare("INSERT INTO subscriptions (user_id,plan_id,status,started_at,external_provider,external_id,created_at,updated_at)
                VALUES (?,?,?,NOW(),'apple',?,NOW(),NOW())")
               ->execute([(int)$user['id'], $planId, $active ? 'active' : 'expired', $txId]);
        }
        $db->prepare('UPDATE users SET status=?, updated_at=NOW() WHERE id=?')
           ->execute([$active ? 'premium' : 'member', (int)$user['id']]);
        $db->commit();

        $st = $db->prepare('SELECT id,email,name,status FROM users WHERE id = ? LIMIT 1');
        $st->execute([(int)$user['id']]);
        appOut(['ok' => true, 'data' => [
            'user' => appUserPayload($st->fetch() ?: $user),
            'active' => $active,
            'product_id' => $productId,
            'expires_at' => $expires > 0 ? gmdate('c', (int)($expires / 1000)) : null,
        ]]);
    }

    appFail('Unknown action.', 400, 'unknown_action');
} catch (Throwable $e) {
    if (isset($db) && $db instanceof PDO && $db->inTransaction()) $db->rollBack();
    error_log('Blue Seas app-auth failure: ' . $e->getMessage());
    appFail('Service temporarily unavailable.', 500, 'server');
}
