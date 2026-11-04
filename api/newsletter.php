<?php
require_once __DIR__ . '/db-config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function newsletterOut(bool $ok, $value = null, int $status = 200): void {
    http_response_code($status);
    echo json_encode($ok ? ['ok' => true, 'data' => $value] : ['ok' => false, 'error' => $value], JSON_UNESCAPED_SLASHES);
    exit;
}

function newsletterTable(PDO $db): void {
    $db->exec("CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(190) NOT NULL,
        status ENUM('active','unsubscribed') NOT NULL DEFAULT 'active',
        consent_text VARCHAR(255) NOT NULL,
        consent_at DATETIME NOT NULL,
        source VARCHAR(100) NOT NULL DEFAULT 'homepage',
        unsubscribe_token CHAR(64) NOT NULL,
        unsubscribed_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_newsletter_email (email),
        UNIQUE KEY uq_newsletter_token (unsubscribe_token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

try {
    $db = bsfDb();
    newsletterTable($db);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Honeypot check: bot traps
        if (!empty($_POST['website']) || !empty($_POST['hp_name'])) {
            // Fake success response to spambots so they think it went through
            newsletterOut(true, ['message' => 'You are subscribed.']);
        }

        $email = strtolower(trim($_POST['email'] ?? ''));
        $consent = $_POST['consent'] ?? '';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) newsletterOut(false, 'Enter a valid email address.', 422);
        if ($consent !== 'yes') newsletterOut(false, 'Please agree to receive the newsletter.', 422);

        $token = hash('sha256', random_bytes(32));
        $consentText = 'Agreed to receive Blue Seas Fishing email updates; unsubscribe available at any time.';
        $source = substr(preg_replace('/[^a-zA-Z0-9_.-]/', '', $_POST['source'] ?? 'homepage'), 0, 100) ?: 'homepage';
        // Optional state for the personalized monthly brief (slug, e.g. "texas").
        $state = strtolower(trim($_POST['state'] ?? ''));
        if ($state !== '' && !preg_match('/^[a-z][a-z-]{1,39}$/', $state)) $state = '';
        $stmt = $db->prepare("INSERT INTO newsletter_subscribers
            (email,status,consent_text,consent_at,source,state_slug,unsubscribe_token,unsubscribed_at)
            VALUES (?,'active',?,NOW(),?,?,?,NULL)
            ON DUPLICATE KEY UPDATE status='active',consent_text=VALUES(consent_text),
              consent_at=NOW(),source=VALUES(source),state_slug=COALESCE(NULLIF(VALUES(state_slug),''),state_slug),
              unsubscribe_token=VALUES(unsubscribe_token),unsubscribed_at=NULL");
        $stmt->execute([$email, $consentText, $source, $state, $token]);
        newsletterOut(true, ['message' => $state !== ''
            ? 'You are subscribed — your first state brief arrives at the start of next month.'
            : 'You are subscribed.']);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['unsubscribe'])) {
        $token = trim($_GET['unsubscribe']);
        if (!preg_match('/^[a-f0-9]{64}$/', $token)) newsletterOut(false, 'Invalid unsubscribe link.', 400);
        $stmt = $db->prepare("UPDATE newsletter_subscribers SET status='unsubscribed',unsubscribed_at=NOW() WHERE unsubscribe_token=?");
        $stmt->execute([$token]);
        newsletterOut(true, ['message' => 'You have been unsubscribed.']);
    }

    /* Read-only status probe for the subscribe page's "You are subscribed"
     * state (same privacy posture as brief-subscribe.php?action=status:
     * returns a value only for an exact address the caller already knows). */
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['check'])) {
        $email = strtolower(trim($_GET['check']));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) newsletterOut(false, 'Invalid email.', 422);
        $stmt = $db->prepare("SELECT status FROM newsletter_subscribers WHERE email=? LIMIT 1");
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        newsletterOut(true, ['email' => $email, 'status' => $row['status'] ?? 'none']);
    }

    newsletterOut(false, 'Method not allowed.', 405);
} catch (Throwable $e) {
    error_log('Blue Seas newsletter failure: ' . $e->getMessage());
    newsletterOut(false, 'Subscription service temporarily unavailable.', 500);
}
