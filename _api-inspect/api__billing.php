<?php
require_once __DIR__ . '/db-config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
session_name('bsf_sess');
session_set_cookie_params(['path'=>'/','secure'=>true,'httponly'=>true,'samesite'=>'Lax']);
session_start();

function billingOut(bool $ok, $value = null, int $status = 200): void {
    http_response_code($status);
    echo json_encode($ok ? ['ok'=>true,'data'=>$value] : ['ok'=>false,'error'=>$value], JSON_UNESCAPED_SLASHES);
    exit;
}

function stripeRequest(string $method, string $path, array $params = []): array {
    $settings = bsfPrivateSettings();
    $secret = $settings['stripe_secret_key'] ?? getenv('STRIPE_SECRET_KEY') ?: '';
    if ($secret === '') throw new RuntimeException('Billing is not configured');
    $ch = curl_init('https://api.stripe.com/v1/' . ltrim($path, '/'));
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_CUSTOMREQUEST => strtoupper($method),
        CURLOPT_USERPWD => $secret . ':',
        CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
    ]);
    if ($params) curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    if ($body === false) throw new RuntimeException('Could not reach billing provider');
    $json = json_decode($body, true);
    if ($status < 200 || $status >= 300 || !is_array($json)) {
        throw new RuntimeException($json['error']['message'] ?? 'Billing provider rejected the request');
    }
    return $json;
}

function signedInUser(PDO $db): array {
    if (!isset($_SESSION['uid'])) billingOut(false, 'Please log in first.', 401);
    $stmt = $db->prepare('SELECT id,email,name,status FROM users WHERE id=? LIMIT 1');
    $stmt->execute([(int)$_SESSION['uid']]);
    $user = $stmt->fetch();
    if (!$user) billingOut(false, 'Please log in again.', 401);
    return $user;
}

function activateSubscription(PDO $db, int $userId, string $subscriptionId, string $status, int $planId): void {
    $active = in_array($status, ['active','trialing'], true);
    $db->beginTransaction();
    $find = $db->prepare("SELECT id FROM subscriptions WHERE external_provider='stripe' AND external_id=? LIMIT 1");
    $find->execute([$subscriptionId]);
    $existing = $find->fetchColumn();
    if ($existing) {
        $stmt = $db->prepare('UPDATE subscriptions SET plan_id=?,status=?,updated_at=NOW() WHERE id=?');
        $stmt->execute([$planId, $active ? $status : 'past_due', $existing]);
    } else {
        $stmt = $db->prepare("INSERT INTO subscriptions (user_id,plan_id,status,started_at,external_provider,external_id,created_at,updated_at)
          VALUES (?,?,?,NOW(),'stripe',?,NOW(),NOW())");
        $stmt->execute([$userId, $planId, $active ? $status : 'past_due', $subscriptionId]);
    }
    $db->prepare("UPDATE users SET status=?,updated_at=NOW() WHERE id=?")
       ->execute([$active ? 'premium' : 'member', $userId]);
    $db->commit();
}

try {
    $db = bsfDb();
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    if ($action === 'checkout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $user = signedInUser($db);
        $plan = $_POST['plan'] ?? '';
        $settings = bsfPrivateSettings();
        $price = $plan === 'year'
            ? ($settings['stripe_price_year'] ?? '')
            : ($plan === 'month' ? ($settings['stripe_price_month'] ?? '') : '');
        if ($price === '') billingOut(false, 'That Premium plan is not available.', 503);
        $session = stripeRequest('POST', 'checkout/sessions', [
            'mode' => 'subscription',
            'line_items[0][price]' => $price,
            'line_items[0][quantity]' => 1,
            'client_reference_id' => (string)$user['id'],
            'customer_email' => $user['email'],
            'subscription_data[metadata][user_id]' => (string)$user['id'],
            'subscription_data[metadata][plan]' => $plan,
            'success_url' => 'https://blueseasfishing.com/premium-success.html?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => 'https://blueseasfishing.com/premium.html?checkout=cancelled',
            'allow_promotion_codes' => 'true',
        ]);
        billingOut(true, ['url'=>$session['url']]);
    }

    if ($action === 'confirm' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $user = signedInUser($db);
        $sessionId = $_GET['session_id'] ?? '';
        if (!preg_match('/^cs_(test_|live_)?[A-Za-z0-9]+$/', $sessionId)) billingOut(false, 'Invalid checkout session.', 400);
        $session = stripeRequest('GET', 'checkout/sessions/' . rawurlencode($sessionId));
        if ((string)($session['client_reference_id'] ?? '') !== (string)$user['id']) billingOut(false, 'Checkout does not belong to this account.', 403);
        if (($session['payment_status'] ?? '') !== 'paid' || empty($session['subscription'])) billingOut(false, 'Payment is not complete.', 409);
        $subscription = stripeRequest('GET', 'subscriptions/' . rawurlencode($session['subscription']));
        $planId = (($subscription['metadata']['plan'] ?? '') === 'year') ? 2 : 1;
        activateSubscription($db, (int)$user['id'], $subscription['id'], $subscription['status'], $planId);
        billingOut(true, ['status'=>'premium']);
    }

    if ($action === 'portal' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $user = signedInUser($db);
        $stmt = $db->prepare("SELECT external_id FROM subscriptions WHERE user_id=? AND external_provider='stripe' ORDER BY id DESC LIMIT 1");
        $stmt->execute([(int)$user['id']]);
        $subscriptionId = (string)($stmt->fetchColumn() ?: '');
        if ($subscriptionId === '') billingOut(false, 'No Stripe subscription was found for this account.', 404);
        $subscription = stripeRequest('GET', 'subscriptions/' . rawurlencode($subscriptionId));
        $customerId = (string)($subscription['customer'] ?? '');
        if ($customerId === '') billingOut(false, 'The billing customer could not be found.', 404);
        $portal = stripeRequest('POST', 'billing_portal/sessions', [
            'customer' => $customerId,
            'return_url' => 'https://blueseasfishing.com/members-area.html',
        ]);
        billingOut(true, ['url'=>$portal['url']]);
    }

    billingOut(false, 'Unknown action.', 400);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('Blue Seas billing failure: ' . $e->getMessage());
    billingOut(false, 'Billing service temporarily unavailable.', 500);
}
