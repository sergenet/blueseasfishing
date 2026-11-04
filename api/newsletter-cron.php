<?php
/**
 * newsletter-cron.php — scheduled sender for the monthly "bite brief".
 *
 * Called monthly by the local scheduled task (run-monthly.ps1) after the
 * content pipeline has deployed. Behavior:
 *   GET  ?key=CRON_KEY           -> status snapshot (subscribers by state,
 *                                   last issue sent, pending issue).
 *   POST ?key=CRON_KEY           -> send the pending month's issue:
 *                                   - personalized per subscriber.state_slug
 *                                     (newsletter-issues/<stamp>/<state>.html)
 *                                   - national fallback for NULL/unknown state
 *                                   - logs the send per month; refuses to
 *                                     re-send a month already logged.
 *
 * The CRON_KEY lives in the Node app .env (CRON_KEY=...). Never committed.
 * Delivery priority: authenticated Namecheap SMTP relay (SMTP_* in .env) →
 * SendGrid HTTP API if SENDGRID_API_KEY set → server mail() as last resort.
 */

require_once __DIR__ . '/db-config.php';
require_once __DIR__ . '/smtp-relay.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function out(bool $ok, $value = null, int $status = 200): void {
    http_response_code($status);
    echo json_encode($ok ? ['ok' => true, 'data' => $value] : ['ok' => false, 'error' => $value], JSON_UNESCAPED_SLASHES);
    exit;
}

/* ------------------------------------------------------------- config -- */
/* Secrets live in the Node app's .env (single source of truth, same pattern
 * as premium-token.php). getenv() is the fallback for other environments. */
function bsfEnv(string $name): string {
    static $env = null;
    if ($env === null) {
        $env = [];
        $envFile = '/home/sergbcqk/api/.env';
        if (is_readable($envFile)) {
            foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                if (preg_match('/^([A-Z0-9_]+)\s*=\s*"?([^"\r\n]*)"?/', $line, $m)) $env[$m[1]] = trim($m[2]);
            }
        }
    }
    return $env[$name] ?? (getenv($name) ?: '');
}

$key = $_GET['key'] ?? '';
$expected = bsfEnv('CRON_KEY');
if (!$expected || !hash_equals($expected, $key)) out(false, 'Forbidden', 403);

$siteUrl = 'https://www.blueseasfishing.com';
$issuesRoot = __DIR__ . '/../newsletter-issues'; // monthly bundles uploaded next to the web root
$fromEmail = bsfEnv('NEWSLETTER_FROM') ?: 'contact@blueseasfishing.com'; // real mailbox = replies land somewhere
$fromName = 'Blue Seas Fishing';
$sendgridKey = bsfEnv('SENDGRID_API_KEY');
// Relay first (authenticated Namecheap SMTP), then SendGrid if keyed, else
// anonymous server mail() — SPF still authorizes this host as last resort.
$sendMode = bsfSmtpReady() ? 'smtp' : ($sendgridKey ? 'sendgrid' : 'mail');
$batchSize = (int)(bsfEnv('NEWSLETTER_BATCH') ?: 50); // throttled batch to stay well under cPanel 200/hr limit

/* --------------------------------------------------------------- db ---- */
try {
    $db = bsfDb();
} catch (Throwable $e) {
    error_log('newsletter-cron db fail: ' . $e->getMessage());
    out(false, 'Database unavailable.', 500);
}
$db->exec("CREATE TABLE IF NOT EXISTS newsletter_send_log (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    stamp VARCHAR(7) NOT NULL,
    issue VARCHAR(100) NOT NULL,
    recipients INT UNSIGNED NOT NULL DEFAULT 0,
    last_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_send (stamp, issue)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

/* add state column if the table predates personalization */
$col = $db->query("SHOW COLUMNS FROM newsletter_subscribers LIKE 'state_slug'")->fetch();
if (!$col) {
    $db->exec("ALTER TABLE newsletter_subscribers ADD COLUMN state_slug VARCHAR(40) NULL AFTER source,
               ADD INDEX ix_state_slug (state_slug)");
}
/* send-log: add the resumable-send cursor if the table predates it */
$col = $db->query("SHOW COLUMNS FROM newsletter_send_log LIKE 'last_id'")->fetch();
if (!$col) {
    $db->exec("ALTER TABLE newsletter_send_log ADD COLUMN last_id BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER recipients");
}

/* ------------------------------------------------------------ helpers -- */
function monthStamp(int $back = 0): string {
    $t = (new DateTime('first day of this month'))->modify("-{$back} months");
    return $t->format('Y-m');
}

function issuePath(string $issuesRoot, string $stamp, string $issue): ?string {
    $p = rtrim($issuesRoot, '/') . '/' . $stamp . '/' . $issue . '.html';
    return is_file($p) ? $p : null;
}

/** CAN-SPAM postal address, appended to every outbound email whatever the
 *  transport. Previously only sendViaMail() added it, so switching to SendGrid
 *  (or adding it later) would have silently dropped the required address. */
function bsfPostalFooter(string $html): string {
    $postal = trim(bsfEnv('NEWSLETTER_POSTAL'));
    if ($postal === '') return $html;
    $line = '<div style="color:#94a3b8;font-size:11px;margin-top:10px">' . htmlspecialchars($postal, ENT_QUOTES, 'UTF-8') . '</div>';
    if (strpos($html, '</body>') !== false) return str_replace('</body>', $line . '</body>', $html);
    return $html . $line;
}

function sendViaSendgrid(string $apiKey, string $toEmail, string $subject, string $html, string $fromEmail, string $fromName): array {
    $html = bsfPostalFooter($html);
    $payload = [
        'personalizations' => [[ 'to' => [['email' => $toEmail]] ]],
        'from' => ['email' => $fromEmail, 'name' => $fromName],
        'subject' => $subject,
        'content' => [
            ['type' => 'text/plain', 'value' => buildTextVersion($html)],
            ['type' => 'text/html', 'value' => $html],
        ],
        'categories' => ['bite-brief'],
    ];
    $group = (int)(bsfEnv('SENDGRID_UNSUB_GROUP') ?: 0);
    if ($group > 0) $payload['asm'] = ['group_id' => $group];
    $ch = curl_init('https://api.sendgrid.com/v3/mail/send');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $apiKey, 'Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_TIMEOUT => 20,
    ]);
    $resp = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($resp === false) return [0, 'curl: ' . $err];
    return [$status, ''];
}

/** Local MTA fallback: the domain's SPF record authorizes the web server IPs
 *  (66.29.153.5/6 via spf.web-hosting.com), so PHP mail() from this host is
 *  SPF-aligned. Lower deliverability than SendGrid (no dedicated DKIM signing
 *  feedback), but it means the first sends can go out with zero setup. Used
 *  automatically when SENDGRID_API_KEY is absent. */
/** Plain-text alternative derived from the issue HTML — spam filters trust
 *  multipart/alternative far more than bare HTML from a new sender. */
function buildTextVersion(string $html): string {
    $t = preg_replace('/<br\s*\/?>/i', "\n", $html);
    $t = preg_replace('/<\/(p|div|tr|h[1-6]|li)>/i', "\n", $t);
    $t = preg_replace_callback('/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/is', function ($m) {
        $text = trim(preg_replace('/\s+/', ' ', strip_tags($m[2])));
        return $text . ' <' . $m[1] . '>';
    }, $t);
    $t = strip_tags($t);
    $t = html_entity_decode($t, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $t = preg_replace('/[ \t]+/', ' ', $t);
    $t = preg_replace('/\n{3,}/', "\n\n", $t);
    return trim($t);
}

function sendViaMail(string $toEmail, string $subject, string $html, string $fromEmail, string $fromName, string $unsubUrl = ''): array {
    $html = bsfPostalFooter($html);
    $text = buildTextVersion($html);
    $boundary = 'bsf_' . bin2hex(random_bytes(12));
    $headers = [
        'MIME-Version: 1.0',
        'From: ' . $fromName . ' <' . $fromEmail . '>',
        'Reply-To: ' . $fromEmail,
        'X-Mailer: BSF-bite-brief',
    ];
    if ($unsubUrl !== '') $headers[] = 'List-Unsubscribe: <' . $unsubUrl . '>';
    $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';
    // quoted-printable (RFC 2045) keeps every transport line <=76 chars via
    // soft breaks. Raw 8bit HTML can contain a single multi-thousand-char line,
    // which strict receivers permanently reject (Yahoo: "lines too long",
    // 4096 limit) — decode() returns the exact original bytes, so rendering
    // is unchanged.
    $body = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n" . quoted_printable_encode($text) . "\r\n--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n" . quoted_printable_encode($html) . "\r\n--$boundary--";
    $encSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    if (bsfSmtpReady()) {
        // Authenticated relay; on failure fall back to server mail() so a
        // transient SMTP error never silently drops a subscriber's copy.
        [$code, $err] = bsfSmtpSend($toEmail, $subject, implode("\r\n", $headers), $body);
        if ($code >= 200 && $code < 300) { bsfTransport('smtp'); return [$code, '']; }
        error_log("BSF SMTP relay failed for $toEmail ($err) — falling back to mail()");
        bsfTransport('smtp-fallback-mail');
    } else {
        bsfTransport('mail');
    }
    $ok = @mail($toEmail, $encSubject, $body, implode("\r\n", $headers));
    return $ok ? [250, ''] : [0, 'mail() returned false'];
}

/* ------------------------------------------------------------- status -- */
/* Test mode: GET &mode=test&email=you@example.com[&state=texas]
 * Sends the CURRENT month's issue (state or national) to one address.
 * Never touches the send log, the subscriber table, or the lead history —
 * a pure preview so the owner can see exactly what subscribers receive. */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['mode'] ?? '') === 'test') {
    $stamp = monthStamp();
    $to = trim($_GET['email'] ?? '');
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) out(false, 'Valid &email= required.', 422);
    $state = preg_replace('/[^a-z-]/', '', strtolower($_GET['state'] ?? ''));
    $issue = $state !== '' && issuePath($issuesRoot, $stamp, $state) ? $state : 'national';
    $html = (string)file_get_contents(issuePath($issuesRoot, $stamp, $issue));
    $html = str_replace('{{UNSUB_TOKEN}}', 'test-preview', $html);
    $sf = $issuesRoot . '/' . $stamp . '/' . $issue . '.subject.txt';
    $testSubject = (is_file($sf) ? trim((string)file_get_contents($sf)) : "What's biting this month") . ' [TEST]';
    if ($sendMode === 'sendgrid') {
        [$status, $err] = sendViaSendgrid($sendgridKey, $to, $testSubject, $html, $fromEmail, $fromName);
    } else {
        [$status, $err] = sendViaMail($to, $testSubject, $html, $fromEmail, $fromName,
            $siteUrl . '/api/newsletter.php?unsubscribe=test-preview');
    }
    out($status >= 200 && $status < 300, [
        'mode' => $sendMode, 'transport' => bsfTransport() ?: $sendMode,
        'issue' => $issue, 'subject' => $testSubject,
        'http_status' => $status, 'error' => $err ?: null,
        'note' => 'Preview only - not logged, subscribers unaffected.',
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $byState = $db->query("SELECT COALESCE(NULLIF(state_slug,''),'(none)') s, COUNT(*) n
                           FROM newsletter_subscribers WHERE status='active' GROUP BY s ORDER BY n DESC")->fetchAll();
    $log = $db->query("SELECT stamp, issue, recipients, sent_at FROM newsletter_send_log ORDER BY sent_at DESC LIMIT 6")->fetchAll();
    $stamp = monthStamp();
    $hasIssues = is_dir($issuesRoot . '/' . $stamp);
    out(true, [
        'subscribers' => $db->query("SELECT COUNT(*) FROM newsletter_subscribers WHERE status='active'")->fetchColumn(),
        'by_state' => $byState,
        'pending_stamp' => $stamp,
        'issues_uploaded' => $hasIssues,
        'recent_sends' => $log,
        'send_mode' => $sendMode,
        'from' => $fromEmail,
        'batch_size' => $batchSize,
    ]);
}

/* -------------------------------------------------------------- send -- */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(false, 'Method not allowed.', 405);

$stamp = monthStamp();
if (issuePath($issuesRoot, $stamp, 'national') === null) {
    out(false, "Issues for {$stamp} not uploaded yet. Run the monthly pipeline and upload newsletter-issues/{$stamp}/ first.", 409);
}

// Resumable send: (stamp,'monthly') row tracks how far we got. A cron re-run
// continues after last_id instead of re-sending the same batch.
$cur = $db->prepare("SELECT recipients, last_id FROM newsletter_send_log WHERE stamp=? AND issue='monthly'");
$cur->execute([$stamp]);
$cursor = $cur->fetch() ?: ['recipients' => 0, 'last_id' => 0];

$stmt = $db->prepare("SELECT id, email, COALESCE(NULLIF(state_slug,''),'') AS state_slug, unsubscribe_token
                      FROM newsletter_subscribers WHERE status='active' AND id > ? ORDER BY id ASC LIMIT ?");
$stmt->bindValue(1, (int)$cursor['last_id'], PDO::PARAM_INT);
$stmt->bindValue(2, $batchSize, PDO::PARAM_INT);
$stmt->execute();
$recipients = $stmt->fetchAll();
if (!$recipients) {
    $msg = $cursor['recipients'] > 0
        ? "Issue for {$stamp} complete: {$cursor['recipients']} recipients total."
        : 'No active subscribers; nothing to send.';
    out(true, ['message' => $msg, 'sent' => 0, 'complete' => true]);
}

// Subject line from the national issue's subject file.
$subject = "What's biting this month — " . (new DateTime())->format('F Y');
$subjFile = $issuesRoot . '/' . $stamp . '/national.subject.txt';
if (is_file($subjFile)) $subject = trim((string)file_get_contents($subjFile));

try {
$sent = 0; $failed = 0; $errors = []; $maxId = (int)$cursor['last_id'];
foreach ($recipients as $r) {
    $issue = $r['state_slug'] !== '' && issuePath($issuesRoot, $stamp, $r['state_slug']) ? $r['state_slug'] : 'national';
    $html = (string)file_get_contents(issuePath($issuesRoot, $stamp, $issue));
    // personal per-recipient unsubscribe link
    $html = str_replace('{{UNSUB_TOKEN}}', $r['unsubscribe_token'], $html);
    if (!isset($stateSubjects[$issue])) {
        $sf = $issuesRoot . '/' . $stamp . '/' . $issue . '.subject.txt';
        $stateSubjects[$issue] = is_file($sf) ? trim((string)file_get_contents($sf)) : $subject;
    }
    $unsubUrl = $siteUrl . '/api/newsletter.php?unsubscribe=' . $r['unsubscribe_token'];
    if ($sendMode === 'sendgrid') {
        [$status, $err] = sendViaSendgrid($sendgridKey, $r['email'], $stateSubjects[$issue], $html, $fromEmail, $fromName);
    } else {
        [$status, $err] = sendViaMail($r['email'], $stateSubjects[$issue], $html, $fromEmail, $fromName, $unsubUrl);
    }
    if ($status >= 200 && $status < 300) $sent++;
    else { $failed++; if (count($errors) < 5) $errors[] = $r['email'] . ': HTTP ' . $status . ($err ? " {$err}" : ''); }
    $maxId = (int)$r['id'];

    // Gentle 0.5s pause between emails so outgoing mail server is not flooded
    usleep(500000);
}

$up = $db->prepare("INSERT INTO newsletter_send_log (stamp, issue, recipients, last_id) VALUES (?,'monthly',?,?)
    ON DUPLICATE KEY UPDATE recipients = recipients + VALUES(recipients), last_id = VALUES(last_id)");
$up->execute([$stamp, $sent, $maxId]);

$left = (int)$db->query("SELECT COUNT(*) FROM newsletter_subscribers WHERE status='active' AND id > {$maxId}")->fetchColumn();
} catch (Throwable $e) {
    error_log('Blue Seas newsletter send failure: ' . $e->getMessage());
    out(false, 'Send failed: ' . $e->getMessage(), 500);
}

out(true, [
    'stamp' => $stamp, 'sent' => $sent, 'failed' => $failed, 'complete' => $left === 0,
    'remaining' => $left,
    'errors' => $errors,
]);
