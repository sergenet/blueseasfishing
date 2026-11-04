<?php
/** brief-subscribe.php — opt-in/out for the Weekly Regional Bite Brief.
 *
 *  Table: weekly_brief_subscribers
 *    (id, email, region, status, consent_text, consent_at, source,
 *     unsubscribe_token, unsubscribed_at, created_at, updated_at)
 *
 *  Actions:
 *    POST action=subscribe   email, region, consent='yes', source?
 *    GET  action=unsubscribe token=
 *    GET  action=status      (optional email= to check one address)
 */

require_once __DIR__ . '/db-config.php';
header('Content-Type: application/json; charset=utf-8');

function bOut(bool $ok, $value = null, int $status = 200): void {
    http_response_code($status);
    echo json_encode($ok ? ['ok' => true, 'data' => $value] : ['ok' => false, 'error' => $value], JSON_UNESCAPED_SLASHES);
    exit;
}

function briefTable(PDO $db): void {
    $db->exec("CREATE TABLE IF NOT EXISTS weekly_brief_subscribers (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(190) NOT NULL,
        region VARCHAR(40) NOT NULL DEFAULT 'global-fresh',
        status ENUM('active','unsubscribed') NOT NULL DEFAULT 'active',
        consent_text VARCHAR(255) NOT NULL,
        consent_at DATETIME NOT NULL,
        source VARCHAR(100) NOT NULL DEFAULT 'members-area',
        unsubscribe_token CHAR(64) NOT NULL,
        unsubscribed_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_brief_email (email),
        UNIQUE KEY uq_brief_token (unsubscribe_token),
        KEY ix_brief_region_status (region, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

/* valid regions come from the same file the site matcher uses */
function validRegions(): array {
    $p = dirname(__DIR__, 2) . '/blueseas-fishing-working-website/blueseasfishing.com/assets/data/brief-regions.json';
    // server layout: api/ and the site folder are siblings under the web root
    foreach ([$p, __DIR__ . '/../assets/data/brief-regions.json'] as $file) {
        if (is_readable($file)) {
            $j = json_decode((string)file_get_contents($file), true);
            if (is_array($j) && !empty($j['regions'])) {
                return array_map(fn($r) => $r['key'] ?? '', $j['regions']);
            }
        }
    }
    return ['europe-east','europe-west','europe-north','europe-south','med','uk-ireland','global-fresh','global-salt'];
}

$action = $_GET['action'] ?? $_POST['action'] ?? 'status';

try {
    $db = bsfDb();
    briefTable($db);

    if ($action === 'subscribe') {
        // Honeypot check: bot traps
        if (!empty($_POST['website']) || !empty($_POST['hp_name'])) {
            bOut(true, [
                'email' => 'bot@discarded.local',
                'region' => 'global-fresh',
                'status' => 'active',
                'unsubscribe_url' => '#'
            ]);
        }

        $email  = strtolower(trim($_POST['email'] ?? ''));
        $region = trim($_POST['region'] ?? '');
        $consent = $_POST['consent'] ?? '';
        $source = substr(trim($_POST['source'] ?? 'members-area'), 0, 100);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) bOut(false, 'Enter a valid email address.', 422);
        if ($consent !== 'yes') bOut(false, 'Please agree to receive the weekly brief.', 422);
        if (!in_array($region, validRegions(), true)) bOut(false, 'Unknown region.', 422);

        $token = bin2hex(random_bytes(32));
        $consentText = 'Weekly Regional Bite Brief opt-in (' . $region . ')';
        $st = $db->prepare("INSERT INTO weekly_brief_subscribers
                (email, region, status, consent_text, consent_at, source, unsubscribe_token)
                VALUES (?,?,'active',?,NOW(),?,?)
                ON DUPLICATE KEY UPDATE region=VALUES(region), status='active',
                consent_text=VALUES(consent_text), consent_at=VALUES(consent_at),
                source=VALUES(source), unsubscribed_at=NULL");
        $st->execute([$email, $region, $consentText, $source, $token]);

        // fetch the token that is actually stored (existing row keeps its token)
        $st = $db->prepare("SELECT region, status, unsubscribe_token FROM weekly_brief_subscribers WHERE email=? LIMIT 1");
        $st->execute([$email]);
        $row = $st->fetch() ?: null;
        bOut(true, [
            'email' => $email,
            'region' => $row['region'] ?? $region,
            'status' => $row['status'] ?? 'active',
            'unsubscribe_url' => '/api/brief-subscribe.php?action=unsubscribe&token=' . ($row['unsubscribe_token'] ?? $token),
        ]);
    }

    if ($action === 'unsubscribe') {
        $token = trim($_GET['token'] ?? '');
        if (!preg_match('/^[a-f0-9]{64}$/', $token)) bOut(false, 'Bad token.', 422);
        $st = $db->prepare("UPDATE weekly_brief_subscribers SET status='unsubscribed', unsubscribed_at=NOW() WHERE unsubscribe_token=?");
        $st->execute([$token]);
        bOut(true, ['unsubscribed' => $st->rowCount() > 0]);
    }

    if ($action === 'status') {
        $email = strtolower(trim($_GET['email'] ?? ''));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) bOut(false, 'Enter a valid email address.', 422);
        $st = $db->prepare("SELECT email, region, status FROM weekly_brief_subscribers WHERE email=? LIMIT 1");
        $st->execute([$email]);
        $row = $st->fetch() ?: null;
        bOut(true, $row ?: ['email' => $email, 'region' => null, 'status' => 'none']);
    }

    bOut(false, 'Unknown action', 400);
} catch (Throwable $e) {
    error_log('Blue Seas brief-subscribe failure: ' . $e->getMessage());
    bOut(false, 'Service temporarily unavailable', 500);
}
