<?php
/** weekly-brief-cron.php — sends the Weekly Regional Bite Brief.
 *
 *  Called weekly by run-weekly.ps1 (Windows Task Scheduler) with ?key=.
 *  Generates each region's brief at send time from assets/data/species.json
 *  using the same season/region rules as assets/js/bsf-plan.js, then emails
 *  every active subscriber of that region. Resumable batches, send-once per
 *  ISO week (tracked in brief_send_log).
 *
 *  GET  ?key=           status (subscribers, week, progress)
 *  POST ?key=           send one batch; loop until data.complete
 *  GET  ?key=&mode=test&email=you@[&region=uk-ireland]
 *       preview: sends the current week's brief to one address, touches nothing.
 */

require_once __DIR__ . '/db-config.php';
require_once __DIR__ . '/smtp-relay.php';
header('Content-Type: application/json; charset=utf-8');

function wOut(bool $ok, $value = null, int $status = 200): void {
    http_response_code($status);
    echo json_encode($ok ? ['ok' => true, 'data' => $value] : ['ok' => false, 'error' => $value], JSON_UNESCAPED_SLASHES);
    exit;
}

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

/* --------------------------------------------------------------- data -- */

/** locate a site data file: server layout (api/ and site are siblings under
 *  the web root) or the local repo layout. */
function siteData(string $rel): ?string {
    $candidates = [__DIR__ . '/../' . $rel];
    // local repo: api/ sits one level above blueseas-fishing-working-website/
    $candidates[] = dirname(__DIR__) . '/blueseas-fishing-working-website/blueseasfishing.com/' . $rel;
    foreach ($candidates as $p) if (is_readable($p)) return $p;
    return null;
}

/* ---- season parsing: port of bsf-plan.js monthsFor() ------------------ */
const MONTH_ALIASES = ['jan'=>1,'january'=>1,'feb'=>2,'february'=>2,'mar'=>3,'march'=>3,'apr'=>4,'april'=>4,
    'may'=>5,'jun'=>6,'june'=>6,'jul'=>7,'july'=>7,'aug'=>8,'august'=>8,
    'sep'=>9,'sept'=>9,'september'=>9,'oct'=>10,'october'=>10,'nov'=>11,'november'=>11,'dec'=>12,'december'=>12];
const SEASON_RANGE = ['spring'=>[3,5],'summer'=>[6,8],'fall'=>[9,11],'autumn'=>[9,11],'winter'=>[12,2]];

function monthsFor(?string $text): ?array {
    $s = strtolower((string)$text);
    if ($s === '') return null;
    if (preg_match('/year[- ]?round|all year|any ?time/', $s)) return range(1, 12);
    $months = [];
    if (preg_match_all('/([a-z]{3,9})\s*(?:-|–|—|to|\.\.)\s*([a-z]{3,9})/', $s, $ms, PREG_SET_ORDER)) {
        foreach ($ms as $m) {
            $a = MONTH_ALIASES[$m[1]] ?? (isset(SEASON_RANGE[$m[1]]) ? SEASON_RANGE[$m[1]][0] : 0);
            $b = MONTH_ALIASES[$m[2]] ?? (isset(SEASON_RANGE[$m[2]]) ? SEASON_RANGE[$m[2]][1] : 0);
            if ($a && $b) { $i = $a; for (;;) { $months[$i] = 1; if ($i === $b) break; $i = $i === 12 ? 1 : $i + 1; } }
        }
    }
    foreach (MONTH_ALIASES as $word => $n) if (preg_match('/\b' . $word . '/', $s)) $months[$n] = 1;
    foreach (['spring'=>[3,4,5],'summer'=>[6,7,8],'fall'=>[9,10,11],'autumn'=>[9,10,11],'winter'=>[12,1,2]] as $word => $list) {
        if (preg_match('/\b' . $word . '/', $s)) foreach ($list as $n) $months[$n] = 1;
    }
    $out = array_keys($months); sort($out);
    return $out ? $out : null;
}

function inSeason(array $row, int $month): bool {
    $months = monthsFor($row['season'] ?? '');
    return $months === null || in_array($month, $months, true);
}

function regionScore(array $row, array $def): int {
    if (isset($def['env']) && $def['env'] !== '' && stripos($row['env'] ?? '', $def['env']) !== false) return 2;
    $hay = strtolower(implode(' ', array_merge($row['regions'] ?? [], [$row['habitat'] ?? '', $row['name'] ?? ''])));
    $score = 0;
    foreach (($def['match'] ?? []) as $kw) if ($kw !== '' && strpos($hay, strtolower($kw)) !== false) $score += 2;
    return $score;
}

function buildBrief(array $species, array $def, int $month, int $limit = 6): array {
    $scored = [];
    foreach ($species as $row) {
        $score = regionScore($row, $def);
        if ($score === 0) continue;
        $in = inSeason($row, $month);
        if (!$in) $score -= 1;
        if ($score <= 0) continue;
        $scored[] = ['row' => $row, 'score' => $score, 'inSeason' => $in];
    }
    usort($scored, function ($a, $b) {
        if ($b['score'] !== $a['score']) return $b['score'] <=> $a['score'];
        if ($b['inSeason'] !== $a['inSeason']) return $b['inSeason'] ? 1 : -1;
        return strcmp($a['row']['name'], $b['row']['name']);
    });
    return array_slice($scored, 0, $limit);
}

/* ------------------------------------------------------------ transport -- */
function buildTextVersion(string $html): string {
    $t = preg_replace('/<br\s*\/?>/i', "\n", $html);
    $t = preg_replace('/<\/(p|div|tr|h[1-6]|li)>/i', "\n", $t);
    $t = preg_replace_callback('/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/is', function ($m) {
        return trim(preg_replace('/\s+/', ' ', strip_tags($m[2]))) . ' <' . $m[1] . '>';
    }, $t);
    $t = strip_tags($t);
    $t = html_entity_decode($t, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $t = preg_replace('/[ \t]+/', ' ', $t);
    $t = preg_replace('/\n{3,}/', "\n\n", $t);
    return trim($t);
}

/** CAN-SPAM postal address, appended to every outbound email whatever the
 *  transport. Only sendViaMail() used to add it, so the SendGrid path shipped
 *  without the required address. */
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
        'personalizations' => [['to' => [['email' => $toEmail]]]],
        'from' => ['email' => $fromEmail, 'name' => $fromName],
        'subject' => $subject,
        'content' => [
            ['type' => 'text/plain', 'value' => buildTextVersion($html)],
            ['type' => 'text/html', 'value' => $html],
        ],
        'categories' => ['weekly-brief'],
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

function sendViaMail(string $toEmail, string $subject, string $html, string $fromEmail, string $fromName, string $unsubUrl = ''): array {
    $html = bsfPostalFooter($html);
    $text = buildTextVersion($html);
    $boundary = 'bsf_' . bin2hex(random_bytes(12));
    $headers = ['MIME-Version: 1.0', 'From: ' . $fromName . ' <' . $fromEmail . '>', 'Reply-To: ' . $fromEmail,
        'X-Mailer: BSF-weekly-brief'];
    if ($unsubUrl !== '') $headers[] = 'List-Unsubscribe: <' . $unsubUrl . '>';
    $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';
    // quoted-printable (RFC 2045) keeps every transport line <=76 chars via
    // soft breaks. This brief's HTML is one multi-thousand-char line, which
    // strict receivers permanently reject (Yahoo: "lines too long", 4096
    // limit) — decode() returns the exact original bytes, so rendering is
    // unchanged.
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

/* --------------------------------------------------------------- email -- */
function e(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

function briefHtml(array $rows, string $regionLabel, string $weekLabel, string $unsubUrl): string {
    $items = '';
    foreach ($rows as $p) {
        $r = $p['row'];
        $spots = implode(' · ', array_slice($r['regions'] ?? [], 0, 3));
        $items .= '<tr><td style="padding:10px;border-bottom:1px solid #e2e8f0;vertical-align:top">' .
            '<strong>' . e($r['name']) . '</strong>' . ($p['inSeason'] ? ' <span style="color:#15803d;font-size:12px">IN SEASON</span>' : '') .
            ($spots ? '<div style="color:#64748b;font-size:13px">' . e($spots) . '</div>' : '') . '</td>' .
            '<td style="padding:10px;border-bottom:1px solid #e2e8f0;vertical-align:top">' . e($r['baits'] ?? '') . '</td>' .
            '<td style="padding:10px;border-bottom:1px solid #e2e8f0;vertical-align:top">' . e($r['season'] ?? '') . '</td></tr>';
    }
    return '<div style="font-family:Segoe UI,Arial,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">' .
        '<h2 style="margin-bottom:4px">Your weekly bite brief — ' . e($regionLabel) . '</h2>' .
        '<p style="color:#64748b;margin-top:0">Week of ' . e($weekLabel) . ' · generated from our 548-species database</p>' .
        '<table style="width:100%;border-collapse:collapse;font-size:15px">' .
        '<tr style="text-align:left"><th style="padding:8px 10px">Target species</th><th style="padding:8px 10px">Baits &amp; lures</th><th style="padding:8px 10px">Season</th></tr>' .
        $items . '</table>' .
        '<p style="margin-top:16px"><a href="https://www.blueseasfishing.com/trip-planner.html">Build a full printable trip plan →</a></p>' .
        '<p style="color:#94a3b8;font-size:12px">You receive this because you opted in on Blue Seas Fishing. ' .
        '<a href="' . e($unsubUrl) . '">Unsubscribe</a></p></div>';
}

/* ---------------------------------------------------------------- main -- */

$key = trim($_GET['key'] ?? '');
/* Same server-side secret as newsletter-cron (named CRON_KEY in the .env);
 * BSF_CRON_KEY accepted as a fallback for local/dev setups. */
$expected = bsfEnv('CRON_KEY') ?: bsfEnv('BSF_CRON_KEY');
if ($expected === '' || $key === '' || !hash_equals($expected, $key)) wOut(false, 'Bad key', 401);

try {
    $db = bsfDb();
    $db->exec("CREATE TABLE IF NOT EXISTS brief_send_log (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        week VARCHAR(16) NOT NULL,
        region VARCHAR(40) NOT NULL,
        recipients INT NOT NULL DEFAULT 0,
        last_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
        sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_week_region (week, region)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
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

    $speciesPath = siteData('assets/data/species.json');
    $regionsPath = siteData('assets/data/brief-regions.json');
    if (!$speciesPath || !$regionsPath) wOut(false, 'Species dataset not on server yet (run the deploy).', 503);
    $species = json_decode((string)file_get_contents($speciesPath), true)['species'] ?? [];
    $regionDefs = json_decode((string)file_get_contents($regionsPath), true)['regions'] ?? [];
    if (!$species || !$regionDefs) wOut(false, 'Species dataset unreadable.', 503);

    $week = (new DateTime('now'))->format('o-\WW');   // e.g. 2026-W42
    $weekLabel = (new DateTime('now'))->format('M j, Y');
    $month = (int)(new DateTime('now'))->format('n');

    $fromEmail = bsfEnv('NEWSLETTER_FROM') ?: 'contact@blueseasfishing.com';
    $fromName  = bsfEnv('NEWSLETTER_FROM_NAME') ?: 'Blue Seas Fishing';
    $apiKey    = bsfEnv('SENDGRID_API_KEY');
    $transport = bsfSmtpReady() ? 'smtp' : ($apiKey !== '' ? 'sendgrid' : 'mail');
    $batch     = max(1, min(200, (int)(bsfEnv('BRIEF_BATCH') ?: 25)));

    /* -------- test mode: one preview send, no logs, no cursors -------- */
    if (($_GET['mode'] ?? '') === 'test') {
        $to = trim($_GET['email'] ?? '');
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) wOut(false, 'Test mode needs a valid email=', 422);
        $regionKey = trim($_GET['region'] ?? '') ?: ($regionDefs[0]['key'] ?? '');
        $def = null;
        foreach ($regionDefs as $d) if (($d['key'] ?? '') === $regionKey) $def = $d;
        if (!$def) wOut(false, 'Unknown region=' . $regionKey, 422);
        $rows = buildBrief($species, $def, $month);
        $unsub = 'https://www.blueseasfishing.com/api/brief-subscribe.php?action=unsubscribe&token=' . str_repeat('0', 64);
        $html = briefHtml($rows, $def['label'] ?? $regionKey, $weekLabel, $unsub);
        $subject = 'Weekly bite brief — ' . ($def['label'] ?? $regionKey);
        if ($apiKey !== '' && !bsfSmtpReady()) [$code, $err] = sendViaSendgrid($apiKey, $to, $subject, $html, $fromEmail, $fromName);
        else [$code, $err] = sendViaMail($to, $subject, $html, $fromEmail, $fromName);
        wOut(true, ['mode' => 'test', 'transport' => bsfTransport() ?: $transport,
            'http' => $code, 'error' => $err, 'region' => $regionKey, 'targets' => count($rows)]);
    }

    /* -------- status -------- */
    $subs = (int)$db->query("SELECT COUNT(*) FROM weekly_brief_subscribers WHERE status='active'")->fetchColumn();
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        $progress = $db->prepare("SELECT region, recipients, last_id FROM brief_send_log WHERE week=?");
        $progress->execute([$week]);
        wOut(true, ['subscribers' => $subs, 'week' => $week, 'batch_size' => $batch,
            'transport' => $transport,
            'progress' => $progress->fetchAll()]);
    }

    /* -------- send one batch across regions, resumable -------- */
    $sent = 0; $failed = 0; $touchedRegions = [];
    foreach ($regionDefs as $def) {
        $regionKey = $def['key'] ?? '';
        if ($regionKey === '') continue;

        $st = $db->prepare("SELECT recipients, last_id FROM brief_send_log WHERE week=? AND region=? LIMIT 1");
        $st->execute([$week, $regionKey]);
        $log = $st->fetch();
        $lastId = (int)($log['last_id'] ?? 0);

        $st = $db->prepare("SELECT id, email, unsubscribe_token FROM weekly_brief_subscribers
                            WHERE status='active' AND region=? AND id > ? ORDER BY id ASC LIMIT " . $batch);
        $st->execute([$regionKey, $lastId]);
        $rows = $st->fetchAll();
        if (!$rows) continue;

        $brief = buildBrief($species, $def, $month);
        $subject = 'Weekly bite brief — ' . ($def['label'] ?? $regionKey);
        $maxId = $lastId; $done = 0;
        foreach ($rows as $sub) {
            $unsub = 'https://www.blueseasfishing.com/api/brief-subscribe.php?action=unsubscribe&token=' . $sub['unsubscribe_token'];
            $html = briefHtml($brief, $def['label'] ?? $regionKey, $weekLabel, $unsub);
            if ($apiKey !== '' && !bsfSmtpReady()) [$code, $err] = sendViaSendgrid($apiKey, $sub['email'], $subject, $html, $fromEmail, $fromName);
            else [$code, $err] = sendViaMail($sub['email'], $subject, $html, $fromEmail, $fromName);
            if ($code >= 200 && $code < 300) { $sent++; $done++; }
            else { $failed++; error_log("weekly-brief send failed {$sub['email']} [$code] $err"); }
            $maxId = max($maxId, (int)$sub['id']);
        }

        $up = $db->prepare("INSERT INTO brief_send_log (week, region, recipients, last_id)
                            VALUES (?,?,?,?)
                            ON DUPLICATE KEY UPDATE recipients=recipients+VALUES(recipients), last_id=VALUES(last_id), sent_at=NOW()");
        $up->execute([$week, $regionKey, $done, $maxId]);
        $touchedRegions[] = $regionKey;
    }

    /* complete when every active subscriber is covered by a log cursor */
    $left = 0;
    foreach ($regionDefs as $def) {
        $regionKey = $def['key'] ?? '';
        $st = $db->prepare("SELECT COUNT(*) FROM weekly_brief_subscribers
                            WHERE status='active' AND region=? AND id > COALESCE((SELECT last_id FROM brief_send_log WHERE week=? AND region=?),0)");
        $st->execute([$regionKey, $week, $regionKey]);
        $left += (int)$st->fetchColumn();
    }

    wOut(true, ['sent' => $sent, 'failed' => $failed, 'week' => $week,
        'remaining' => $left, 'complete' => $left === 0, 'regions' => $touchedRegions]);
} catch (Throwable $e) {
    error_log('Blue Seas weekly-brief failure: ' . $e->getMessage());
    wOut(false, 'Service temporarily unavailable', 500);
}
