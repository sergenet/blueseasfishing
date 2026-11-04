<?php
/**
 * app-apple.php — App Store Server API helpers for the mobile app.
 *
 * Split out of app-auth.php so the ES256 signing can be unit-tested without a
 * database or a network call. Configuration lives in
 * .blueseasfishing-secrets.php:
 *
 *   'apple_iap_key_id'  => 'ABCD123456'                // In-App Purchase key id
 *   'apple_iap_issuer'  => 'xxxxxxxx-...'             // App Store Connect issuer
 *   'apple_iap_key_path'=> 'C:/keys/AuthKey_ABCD.p8'  // or 'apple_iap_key' => PEM
 *   'apple_bundle_id'   => 'com.blueseasfishing.app'  // optional
 */

require_once __DIR__ . '/app-token.php';

const APP_DEFAULT_BUNDLE = 'com.blueseasfishing.app';

/** ES256 JWT for the App Store Server API (Apple requires DER -> r||s). */
function appAppleJwt(): string {
    $s = bsfPrivateSettings();
    $keyId = trim((string)($s['apple_iap_key_id'] ?? ''));
    $issuer = trim((string)($s['apple_iap_issuer'] ?? ''));
    $pem = trim((string)($s['apple_iap_key'] ?? ''));
    if ($pem === '' && !empty($s['apple_iap_key_path'])) {
        $pem = trim((string)@file_get_contents((string)$s['apple_iap_key_path']));
    }
    if ($keyId === '' || $issuer === '' || $pem === '') {
        throw new RuntimeException('apple-not-configured');
    }
    $header = appB64(json_encode(['alg' => 'ES256', 'kid' => $keyId, 'typ' => 'JWT']));
    $payload = appB64(json_encode([
        'iss' => $issuer,
        'iat' => time(),
        'exp' => time() + 300,
        'aud' => 'appstoreconnect-v1',
        'bid' => (string)($s['apple_bundle_id'] ?? APP_DEFAULT_BUNDLE),
    ]));
    $signing = $header . '.' . $payload;
    $private = openssl_pkey_get_private($pem);
    if ($private === false) throw new RuntimeException('apple-key-invalid');
    $der = '';
    if (!openssl_sign($signing, $der, $private, OPENSSL_ALGO_SHA256)) {
        throw new RuntimeException('apple-sign-failed');
    }
    return $signing . '.' . appB64(appDerToJose($der));
}

/** Convert an ASN.1 DER ECDSA signature into the fixed 64-byte JOSE form. */
function appDerToJose(string $der): string {
    $offset = 2;
    if ($der === '' || ord($der[0]) !== 0x30) return $der;
    if (ord($der[1]) & 0x80) $offset += ord($der[1]) & 0x7f;
    $out = '';
    for ($i = 0; $i < 2; $i++) {
        if (!isset($der[$offset]) || ord($der[$offset]) !== 0x02) return $der;
        $len = ord($der[$offset + 1]);
        $part = substr($der, $offset + 2, $len);
        $offset += 2 + $len;
        $part = ltrim($part, "\x00");
        $out .= str_pad($part, 32, "\x00", STR_PAD_LEFT);
    }
    return $out;
}

/** Convert a JOSE r||s signature back to DER (used by the unit test). */
function appJoseToDer(string $jose): string {
    if (strlen($jose) !== 64) return '';
    $ints = '';
    foreach ([substr($jose, 0, 32), substr($jose, 32)] as $half) {
        $half = ltrim($half, "\x00");
        if ($half === '' || ord($half[0]) & 0x80) $half = "\x00" . $half;
        $ints .= "\x02" . chr(strlen($half)) . $half;
    }
    return "\x30" . chr(strlen($ints)) . $ints;
}

/** Ask Apple about one transaction id; returns the newest transaction state. */
function appAppleSubscription(string $transactionId): array {
    $ch = curl_init('https://api.storekit.itunes.apple.com/inApps/v1/subscriptions/' . rawurlencode($transactionId));
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . appAppleJwt(), 'Accept: application/json'],
    ]);
    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($body === false) throw new RuntimeException('apple-unreachable');
    $json = json_decode((string)$body, true);
    if ($status < 200 || $status >= 300 || !is_array($json)) {
        throw new RuntimeException('apple-rejected-' . $status);
    }
    $groups = $json['data'] ?? [];
    $latest = $groups[0]['lastTransactions'][0] ?? null;
    if (!is_array($latest)) throw new RuntimeException('apple-no-transaction');
    return $latest;
}
