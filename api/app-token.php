<?php
/**
 * app-token.php — the bearer tokens the mobile app authenticates with.
 *
 * Kept separate from app-auth.php so the signing/verification can be exercised
 * without a database. Format: base64url(JSON {uid, exp}) . '.' . HMAC-SHA256.
 *
 * The signing key is APP_AUTH_SECRET from .blueseasfishing-secrets.php when it is
 * set; otherwise it is derived from the database password, so deployment needs
 * no extra configuration. Changing either one signs every device out.
 */

const APP_TOKEN_TTL = 2592000; // 30 days

function appSecret(): string {
    $settings = bsfPrivateSettings();
    $explicit = trim((string)($settings['app_auth_secret'] ?? ''));
    if (strlen($explicit) >= 16) return $explicit;
    return hash('sha256', 'bsf-app-auth|' . (string)($settings['password'] ?? ''));
}

function appB64(string $raw): string {
    return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
}

function appUnb64(string $encoded): string {
    $padded = strtr($encoded, '-_', '+/');
    while (strlen($padded) % 4) $padded .= '=';
    $raw = base64_decode($padded, true);
    return $raw === false ? '' : $raw;
}

function appMintToken(int $uid, ?int $ttl = null): string {
    $payload = appB64(json_encode(['uid' => $uid, 'exp' => time() + ($ttl ?? APP_TOKEN_TTL)]));
    return $payload . '.' . hash_hmac('sha256', $payload, appSecret());
}

/** @return int|null uid when the token is well-formed and unexpired */
function appTokenUid(string $token): ?int {
    $dot = strrpos($token, '.');
    if ($dot === false || $dot < 1 || $dot === strlen($token) - 1) return null;
    $payload = substr($token, 0, $dot);
    $sig = substr($token, $dot + 1);
    if (!hash_equals(hash_hmac('sha256', $payload, appSecret()), $sig)) return null;
    $json = json_decode(appUnb64($payload), true);
    if (!is_array($json) || !isset($json['uid'], $json['exp'])) return null;
    if ((int)$json['exp'] < time()) return null;
    return (int)$json['uid'];
}
