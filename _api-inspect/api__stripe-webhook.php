<?php
require_once __DIR__ . '/db-config.php';
header('Content-Type: application/json; charset=utf-8');

function webhookOut(int $status): void { http_response_code($status); echo json_encode(['received'=>$status===200]); exit; }

try {
    $payload = file_get_contents('php://input');
    $header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
    $settings = bsfPrivateSettings();
    $secret = $settings['stripe_webhook_secret'] ?? getenv('STRIPE_WEBHOOK_SECRET') ?: '';
    if ($secret === '' || $payload === '' || $header === '') webhookOut(400);
    $parts = [];
    foreach (explode(',', $header) as $piece) {
        [$key,$value] = array_pad(explode('=', trim($piece), 2), 2, '');
        $parts[$key][] = $value;
    }
    $timestamp = $parts['t'][0] ?? '';
    if (!ctype_digit($timestamp) || abs(time() - (int)$timestamp) > 300) webhookOut(400);
    $expected = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
    $valid = false;
    foreach ($parts['v1'] ?? [] as $signature) if (hash_equals($expected, $signature)) $valid = true;
    if (!$valid) webhookOut(400);
    $event = json_decode($payload, true);
    if (!is_array($event)) webhookOut(400);
    $object = $event['data']['object'] ?? [];
    $type = $event['type'] ?? '';
    if (in_array($type, ['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'], true)) {
        $userId = (int)($object['metadata']['user_id'] ?? 0);
        if ($userId > 0) {
            $status = $object['status'] ?? 'canceled';
            $active = in_array($status, ['active','trialing'], true);
            $planId = (($object['metadata']['plan'] ?? '') === 'year') ? 2 : 1;
            $db = bsfDb();
            $db->beginTransaction();
            $find = $db->prepare("SELECT id FROM subscriptions WHERE external_provider='stripe' AND external_id=? LIMIT 1");
            $find->execute([$object['id']]);
            $existing = $find->fetchColumn();
            if ($existing) {
                $stmt = $db->prepare('UPDATE subscriptions SET plan_id=?,status=?,updated_at=NOW(),canceled_at=? WHERE id=?');
                $stmt->execute([$planId, $active ? $status : 'canceled', $active ? null : date('Y-m-d H:i:s'), $existing]);
            } else {
                $stmt = $db->prepare("INSERT INTO subscriptions (user_id,plan_id,status,started_at,external_provider,external_id,created_at,updated_at)
                  VALUES (?,?,?,NOW(),'stripe',?,NOW(),NOW())");
                $stmt->execute([$userId, $planId, $active ? $status : 'canceled', $object['id']]);
            }
            $db->prepare('UPDATE users SET status=?,updated_at=NOW() WHERE id=?')->execute([$active ? 'premium' : 'member', $userId]);
            $db->commit();
        }
    }
    webhookOut(200);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('Blue Seas Stripe webhook failure: ' . $e->getMessage());
    webhookOut(500);
}
