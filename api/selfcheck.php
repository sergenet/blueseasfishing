<?php
/**
 * selfcheck.php — server-side watchdog for the autopilot.
 *
 * Called by run-monthly.ps1 after the pipeline + send (and safe to call anytime):
 *   GET /api/selfcheck.php?key=CRON_KEY
 *
 * Checks: DB reachable, active subscribers countable, this month's issue bundle
 * present, Node API healthy. If anything is wrong, emails contact@ immediately
 * (mail() from this host is SPF-aligned) and returns HTTP 500 so the calling
 * PowerShell step can also log the failure. Healthy = HTTP 200 JSON.
 * Read-only diagnostics — changes nothing.
 */

require_once __DIR__ . '/db-config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

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

function scOut(bool $ok, array $data, int $status): void {
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'status' => $ok ? 'healthy' : 'unhealthy', 'data' => $data], JSON_UNESCAPED_SLASHES);
    exit;
}

$key = $_GET['key'] ?? '';
$expected = bsfEnv('CRON_KEY');
if (!$expected || !hash_equals($expected, $key)) scOut(false, ['error' => 'Forbidden'], 403);

$problems = [];
$details = [];

/* 1) Database + subscriber count */
try {
    $db = bsfDb();
    $active = (int)$db->query("SELECT COUNT(*) FROM newsletter_subscribers WHERE status='active'")->fetchColumn();
    $details['active_subscribers'] = $active;
    if ($active < 1) $problems[] = 'Subscriber table reachable but 0 active subscribers (list wiped or DB pointed wrong?)';
} catch (Throwable $e) {
    $problems[] = 'DATABASE UNREACHABLE: ' . substr($e->getMessage(), 0, 120);
    $details['active_subscribers'] = null;
}

/* 2) This month's issue bundle (needs state + national at minimum) */
$stamp = (new DateTime('now'))->format('Y-m');
$issuesRoot = __DIR__ . '/../newsletter-issues/' . $stamp;
$details['issue_bundle'] = $stamp;
if (!is_file($issuesRoot . '/national.html')) {
    $problems[] = "Issue bundle for {$stamp} missing national.html (upload-newsletter-issues did not run?)";
} elseif (!is_dir($issuesRoot)) {
    $problems[] = "Issue directory for {$stamp} missing entirely.";
}

/* 3) Node API health */
$api = @file_get_contents('https://api.blueseasfishing.com/api/health', false, stream_context_create(['http' => ['timeout' => 10]]));
if ($api === false) {
    $problems[] = 'Node API /api/health did not respond (site down or Passenger stuck).';
} else {
    $j = json_decode($api, true);
    if (empty($j['quota_active'])) $problems[] = 'Node API responded but quota_active is falsy: ' . substr($api, 0, 120);
    $details['api'] = $j['status'] ?? 'unknown';
}

/* 4) Cron key validity is implied (we passed hash_equals). Report mode. */
$details['send_mode'] = (bsfEnv('SMTP_HOST') && bsfEnv('SMTP_PASS')) ? 'smtp'
    : (bsfEnv('SENDGRID_API_KEY') ? 'sendgrid' : 'mail');

if ($problems) {
    $body = "Blue Seas autopilot self-check found problems:\n\n"
          . implode("\n", array_map(fn($p) => ' - ' . $p, $problems))
          . "\n\nDetails: " . json_encode($details) . "\nTime: " . date('r') . "\n"
          . "Run 'node tools/monthly-pipeline.mjs' + deploy locally, or check cPanel/stderr.log.\n";
    @mail(
        'contact@blueseasfishing.com',
        '=?UTF-8?B?' . base64_encode('[ACTION NEEDED] Blue Seas autopilot self-check failed') . '?=',
        $body,
        "From: Blue Seas Autopilot <contact@blueseasfishing.com>\r\nContent-Type: text/plain; charset=UTF-8"
    );
    scOut(false, ['problems' => $problems, 'details' => $details, 'emailed' => 'contact@blueseasfishing.com'], 500);
}

scOut(true, ['checks' => 'db+subscribers+issues+api', 'details' => $details], 200);
