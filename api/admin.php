<?php
/**
 * admin.php — owner-only stats dashboard + member management.
 *
 * URL: https://www.blueseasfishing.com/admin  (also /api/admin.php)
 * Auth: CRON_KEY (the machine key, same secret as newsletter-cron.php) or the
 *   optional ADMIN_PIN set in the same .env — the short owner key, accepted by
 *   this page only. Failed sign-ins are throttled per address and site-wide.
 *   - No session: renders a sign-in card; POSTing the key sets a signed,
 *     HttpOnly, Secure, SameSite=Strict cookie for 30 days, so /admin can be
 *     bookmarked without the key in the URL.
 *   - ?key=CRON_KEY still works for scripts and old bookmarks: it is traded
 *     for the cookie and then 303s to the clean URL.
 * GET  = read-only stats: member/account totals & growth, signups, logins,
 *        newsletter totals, breakdowns by state/source, recent sends,
 *        subscriber table, row counts for every table.
 * POST = mutations (members, bans, gallery moderation, orphan purge). They
 *        need either a valid session + CSRF token or the key in the body;
 *        every GET is side-effect free (safe against prefetch, crawlers,
 *        link previews).
 * noindex + no-store.
 */

require_once __DIR__ . '/db-config.php';

/* reuse the same .env loader + key check as newsletter-cron.php */
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

$key = trim((string)($_GET['key'] ?? '')); // paste often carries a trailing newline
$expected = bsfEnv('CRON_KEY');            // machine key: cron scripts, old bookmarks
$adminPin = trim(bsfEnv('ADMIN_PIN'));     // legacy plaintext owner key (1894)
$pinHash = trim(bsfEnv('ADMIN_PIN_HASH')); // owner key as a password_hash(), set from /admin
$epoch = trim(bsfEnv('ADMIN_SESSION_EPOCH')); // bumped by "sign out everywhere"
/* Session signatures and CSRF tokens are keyed on every credential and on the
   epoch, so changing a key or bumping the epoch invalidates every session. */
$signKey = hash('sha256', 'bsf-admin|' . $expected . '|' . $adminPin . '|' . $pinHash . '|' . $epoch);

/* Replace (or append) one NAME=value line in the server .env. Values written
   here are hex or a quoted bcrypt hash, so no quoting/expansion surprises. */
function bsfAdminEnvSet(string $name, string $value): bool {
    $file = '/home/sergbcqk/api/.env';
    $lines = is_file($file) ? file($file, FILE_IGNORE_NEW_LINES) : [];
    if (!is_array($lines)) return false;
    $found = false;
    foreach ($lines as $i => $line) {
        if (preg_match('/^' . preg_quote($name, '/') . '\s*=/', $line)) {
            $lines[$i] = $name . '=' . $value;
            $found = true;
        }
    }
    if (!$found) $lines[] = $name . '=' . $value;
    return @file_put_contents($file, implode("\n", $lines) . "\n", LOCK_EX) !== false;
}

/* Rewrites ADMIN_PIN_HASH in the server .env and drops the legacy plaintext
   ADMIN_PIN line, so a chosen passphrase is never stored in the clear. */
function bsfAdminSavePinHash(string $hash): bool {
    $file = '/home/sergbcqk/api/.env';
    $lines = is_file($file) ? file($file, FILE_IGNORE_NEW_LINES) : [];
    if (!is_array($lines)) return false;
    $lines = array_values(array_filter($lines, fn($l) => !preg_match('/^ADMIN_PIN\s*=/', $l)));
    $replaced = false;
    foreach ($lines as $i => $line) {
        if (preg_match('/^ADMIN_PIN_HASH\s*=/', $line)) {
            $lines[$i] = 'ADMIN_PIN_HASH="' . $hash . '"';
            $replaced = true;
        }
    }
    if (!$replaced) $lines[] = 'ADMIN_PIN_HASH="' . $hash . '"';
    return @file_put_contents($file, implode("\n", $lines) . "\n", LOCK_EX) !== false;
}
$isPost = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';

/* Where to land after a POST. Forms target the real script path (/api/admin.php)
   rather than the rewritten /admin — the host's request throttle treats POSTs
   to the rewrite differently — and send this whitelisted path back instead. */
$back = (string)($_POST['back'] ?? $_GET['back'] ?? '');
if (!in_array($back, ['/admin', '/admin/', '/api/admin.php'], true)) $back = '/admin';

/* ---- Owner session -------------------------------------------------------
   GET ?key=CRON_KEY still works (scripts and old bookmarks) but the browser
   is handed a signed HttpOnly cookie and redirected to the clean URL, so the
   key stops living in the address bar. The cookie is an HMAC of its expiry
   under the same secret: nothing is stored server-side, and rotating
   CRON_KEY invalidates every outstanding session.                          */
const BSF_ADMIN_COOKIE = 'bsf_admin';
const BSF_ADMIN_TTL = 2592000; // 30 days

function bsfAdminCookieValue(int $expires, string $secret): string {
    return $expires . '.' . hash_hmac('sha256', 'admin|' . $expires, $secret);
}
function bsfAdminCookieOk(string $raw, string $secret): bool {
    if ($secret === '' || !preg_match('/^(\d{9,12})\.([0-9a-f]{64})$/', $raw, $m)) return false;
    if ((int)$m[1] < time()) return false;
    return hash_equals(hash_hmac('sha256', 'admin|' . $m[1], $secret), $m[2]);
}
function bsfAdminCookieSend(?string $value): void {
    setcookie(BSF_ADMIN_COOKIE, (string)$value, [
        'expires'  => $value === null ? time() - 3600 : time() + BSF_ADMIN_TTL,
        'path'     => '/',
        'secure'   => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}
function bsfAdminLoginPage(string $error = '', ?int $status = null, string $info = ''): void {
    global $back;
    if ($status !== null) http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Robots-Tag: noindex, nofollow');
    header('X-Frame-Options: DENY');
    ?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Blue Seas — Admin sign in</title>
<style>
  :root{--bg:#f1f5f9;--card:#fff;--text:#0f172a;--muted:#64748b;--line:#e2e8f0;--brand:#1d4ed8;--bad:#991b1b}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:20px}
  .card{width:100%;max-width:400px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:26px 24px}
  h1{font-size:19px;margin:0 0 4px}
  .sub{color:var(--muted);font-size:13px;margin:0 0 18px}
  label{display:block;font-size:12.5px;font-weight:600;color:var(--muted)}
  input{display:block;width:100%;margin-top:6px;padding:11px 12px;border:1px solid #cbd5e1;border-radius:10px;font:inherit;color:var(--text);background:#fff}
  input:focus{outline:2px solid #bfdbfe;border-color:var(--brand)}
  button{margin-top:14px;width:100%;background:var(--brand);color:#fff;border:0;border-radius:10px;padding:11px;font:inherit;font-weight:700;cursor:pointer}
  .err{background:#fee2e2;color:var(--bad);border:1px solid #fecaca;border-radius:9px;padding:9px 11px;font-size:13px;font-weight:600;margin:0 0 14px}
  .ok{background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:9px;padding:9px 11px;font-size:13px;font-weight:600;margin:0 0 14px}
  .foot{margin-top:16px;color:var(--muted);font-size:12px;text-align:center}
  .foot a{color:var(--brand)}
</style>
</head>
<body>
<div class="card">
  <h1>Blue Seas — Admin</h1>
  <p class="sub">Owner sign in. Enter your admin password once — this browser stays signed in for 30 days.</p>
  <?php if ($info !== ''): ?><p class="ok"><?= htmlspecialchars($info, ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?>
  <?php if ($error !== ''): ?><p class="err"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?>
  <form method="post" action="/api/admin.php">
    <input type="hidden" name="action" value="login">
    <input type="hidden" name="back" value="<?= htmlspecialchars($back, ENT_QUOTES, 'UTF-8') ?>">
    <label for="k">Admin password</label>
    <input id="k" type="password" name="access_key" required autofocus
           autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"
           inputmode="text" data-lpignore="true" data-1p-ignore="true"
           placeholder="your admin password">
    <button type="submit">Sign in</button>
  </form>
  <p class="foot"><a href="https://www.blueseasfishing.com/">&larr; Back to the site</a></p>
</div>
</body>
</html>
<?php
    exit;
}

/* Any of the machine key, the hashed owner key or the legacy plaintext plain
   key is accepted — but never an empty candidate. */
function bsfAdminKeyMatches(string $candidate, string $machineKey, string $pin, string $pinHash): bool {
    if ($candidate === '') return false;
    if ($machineKey !== '' && hash_equals($machineKey, $candidate)) return true;
    if ($pinHash !== '' && password_verify($candidate, $pinHash)) return true;
    return $pin !== '' && hash_equals($pin, $candidate);
}

$cookieRaw = (string)($_COOKIE[BSF_ADMIN_COOKIE] ?? '');
$cookieOk  = bsfAdminCookieOk($cookieRaw, $signKey);
$csrf      = $cookieOk ? hash_hmac('sha256', 'csrf|' . $cookieRaw, $signKey) : '';
$keyOk     = bsfAdminKeyMatches($key, $expected, $adminPin, $pinHash);

/* ---- Brute-force guard --------------------------------------------------
   A short key is guessable, so failures are counted per address and site-wide
   in a small state file: 3 misses from one address lock that address for 24
   hours, 60 misses anywhere in 10 minutes pause all sign-ins for 10 minutes.
   A correct key clears the address. If the file cannot be written the guard
   fails open (availability over lockout) and records it in the error log.  */
const BSF_LOCK_IP_MAX = 3;
const BSF_LOCK_IP_WINDOW = 900;   // failures must fall inside this window to count together
const BSF_LOCK_IP_LOCK = 86400;   // lockout duration: 24 hours
const BSF_LOCK_GLOBAL_MAX = 60;
const BSF_LOCK_GLOBAL_WINDOW = 600;

function bsfAdminWaitLabel(int $seconds): string {
    if ($seconds >= 7200) return (string)(int)ceil($seconds / 3600) . ' hours';
    if ($seconds >= 3600) return '1 hour';
    return max(1, (int)ceil($seconds / 60)) . ' minutes';
}

function bsfAdminThrottleOpen() {
    $f = @fopen(rtrim(sys_get_temp_dir(), '/') . '/bsf-admin-throttle.json', 'c+');
    if (!$f) { error_log('Blue Seas admin: throttle file not writable'); return null; }
    return $f;
}
function bsfAdminThrottleRead($f): array {
    rewind($f);
    $d = json_decode((string)stream_get_contents($f), true);
    if (!is_array($d)) $d = [];
    return $d + ['ips' => [], 'global' => ['n' => 0, 'first' => 0, 'until' => 0]];
}
function bsfAdminThrottleWrite($f, array $d): void {
    ftruncate($f, 0);
    rewind($f);
    fwrite($f, json_encode($d));
    fflush($f);
}
function bsfAdminLockRemaining(string $ipKey): int {
    $f = bsfAdminThrottleOpen();
    if (!$f) return 0;
    flock($f, LOCK_EX);
    $d = bsfAdminThrottleRead($f);
    $until = (int)($d['global']['until'] ?? 0);
    $ip = $d['ips'][$ipKey] ?? null;
    if ($ip && (int)($ip['until'] ?? 0) > $until) $until = (int)$ip['until'];
    flock($f, LOCK_UN);
    fclose($f);
    return max(0, $until - time());
}
function bsfAdminRecordFailure(string $ipKey): void {
    $f = bsfAdminThrottleOpen();
    if (!$f) return;
    $now = time();
    flock($f, LOCK_EX);
    $d = bsfAdminThrottleRead($f);

    $ip = $d['ips'][$ipKey] ?? ['n' => 0, 'first' => $now, 'until' => 0];
    if ($now - (int)$ip['first'] > BSF_LOCK_IP_WINDOW) $ip = ['n' => 0, 'first' => $now, 'until' => 0];
    $ip['n'] = (int)$ip['n'] + 1;
    if ($ip['n'] >= BSF_LOCK_IP_MAX) $ip['until'] = $now + BSF_LOCK_IP_LOCK;
    $d['ips'][$ipKey] = $ip;

    $g = $d['global'];
    if ($now - (int)$g['first'] > BSF_LOCK_GLOBAL_WINDOW) $g = ['n' => 0, 'first' => $now, 'until' => 0];
    $g['n'] = (int)$g['n'] + 1;
    if ($g['n'] >= BSF_LOCK_GLOBAL_MAX) $g['until'] = $now + BSF_LOCK_GLOBAL_WINDOW;
    $d['global'] = $g;

    foreach ($d['ips'] as $k => $v) {
        if ((int)($v['until'] ?? 0) <= $now && (int)($v['first'] ?? 0) < $now - BSF_LOCK_IP_WINDOW) unset($d['ips'][$k]);
    }
    bsfAdminThrottleWrite($f, $d);
    flock($f, LOCK_UN);
    fclose($f);
}
function bsfAdminClearFailures(string $ipKey): void {
    $f = bsfAdminThrottleOpen();
    if (!$f) return;
    flock($f, LOCK_EX);
    $d = bsfAdminThrottleRead($f);
    unset($d['ips'][$ipKey]);
    bsfAdminThrottleWrite($f, $d);
    flock($f, LOCK_UN);
    fclose($f);
}

/* A key in the URL is an attempt too: GET ?key=guess used to sidestep the
   POST throttle entirely, so it is counted and locked the same way. */
if (!$isPost && $key !== '') {
    $ipKey = substr(hash('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? '')), 0, 20);
    $wait = bsfAdminLockRemaining($ipKey);
    if ($wait > 0) {
        bsfAdminLoginPage('Too many failed attempts. Sign-in is paused here for about ' . bsfAdminWaitLabel($wait) . '.', 429);
    }
    if (!$keyOk) {
        bsfAdminRecordFailure($ipKey);
        bsfAdminLoginPage('That key is not correct. Check it and try again.');
    }
    bsfAdminClearFailures($ipKey);
}

/* ====== Mutations: POST only, authenticated by the session cookie (CSRF
   token) or by the key in the POST body. PRG: act, then 303 back. ====== */
function bsfAdminRedirect(string $query): void {
    global $cookieOk, $back;
    if ($cookieOk) { header('Location: ' . $back . '?' . $query, true, 303); exit; }
    $k = $_POST['key'] ?? ($_GET['key'] ?? '');
    header('Location: ' . $back . '?key=' . rawurlencode($k) . '&' . $query, true, 303);
    exit;
}

$paction = $isPost ? (string)($_POST['action'] ?? '') : '';

/* Sign in / sign out are POST-only, so a prefetcher or crawler can never log
   anyone in, and a wrong key is answered with a delay and a generic message. */
if ($isPost && $paction === 'login') {
    // field is access_key (keeps password managers from filling the member
    // password); key is still accepted for older forms and scripts.
    $attempt = trim((string)($_POST['access_key'] ?? $_POST['key'] ?? ''));
    $ipKey = substr(hash('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? '')), 0, 20);

    $wait = bsfAdminLockRemaining($ipKey);
    if ($wait > 0) {
        bsfAdminLoginPage(
            'Too many failed attempts. Sign-in is paused here for about '
            . bsfAdminWaitLabel($wait) . '.',
            429
        );
    }
    if (bsfAdminKeyMatches($attempt, $expected, $adminPin, $pinHash)) {
        bsfAdminClearFailures($ipKey);
        bsfAdminCookieSend(bsfAdminCookieValue(time() + BSF_ADMIN_TTL, $signKey));
        header('Location: ' . $back, true, 303);
        exit;
    }
    bsfAdminRecordFailure($ipKey);
    usleep(400000);
    header('Location: ' . $back . '?e=badkey', true, 303);
    exit;
}

if ($isPost && $paction === 'logout') {
    $logoutOk = $keyOk || ($cookieOk && $csrf !== '' && hash_equals($csrf, (string)($_POST['csrf'] ?? '')));
    if (!$logoutOk) {
        http_response_code(403);
        header('Content-Type: text/plain; charset=utf-8');
        exit('Forbidden');
    }
    bsfAdminCookieSend(null);
    header('Location: ' . $back, true, 303);
    exit;
}

if ($isPost) {
    $pkey = trim((string)($_POST['key'] ?? ''));
    $postKeyOk  = bsfAdminKeyMatches($pkey, $expected, $adminPin, $pinHash);
    $postCsrfOk = $cookieOk && $csrf !== '' && hash_equals($csrf, (string)($_POST['csrf'] ?? ''));
    if (!$postKeyOk && !$postCsrfOk) {
        http_response_code(403);
        header('Content-Type: text/plain; charset=utf-8');
        exit('Forbidden');
    }

    if ($paction === 'signout_all') {
        $epochNew = bin2hex(random_bytes(16));
        if (!bsfAdminEnvSet('ADMIN_SESSION_EPOCH', $epochNew)) bsfAdminRedirect('err=epoch_write');
        error_log('Blue Seas admin: all sessions revoked from ' . (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
        bsfAdminCookieSend(null);
        header('Location: /admin?signedout=1', true, 303);
        exit;
    }

    if ($paction === 'change_key') {
        $cur = trim((string)($_POST['current_key'] ?? ''));
        $new = (string)($_POST['new_key'] ?? '');
        $rep = (string)($_POST['repeat_key'] ?? '');
        if (!bsfAdminKeyMatches($cur, $expected, $adminPin, $pinHash)) bsfAdminRedirect('err=key_current');
        if (strlen($new) < 12) bsfAdminRedirect('err=key_short');
        if ($new !== $rep) bsfAdminRedirect('err=key_repeat');
        if (bsfAdminKeyMatches($new, $expected, $adminPin, $pinHash)) bsfAdminRedirect('err=key_same');
        if (!bsfAdminSavePinHash(password_hash($new, PASSWORD_DEFAULT))) bsfAdminRedirect('err=key_write');
        error_log('Blue Seas admin: owner key changed from ' . (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
        bsfAdminCookieSend(null);
        header('Location: /admin?changed=1', true, 303);
        exit;
    }

    if ($paction === 'add_member') {
        $email  = strtolower(trim($_POST['email'] ?? ''));
        $pass   = (string)($_POST['password'] ?? '');
        $name   = trim($_POST['name'] ?? '');
        $status = (($_POST['status'] ?? '') === 'premium') ? 'premium' : 'member';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) bsfAdminRedirect('err=invalid_email');
        if (strlen($pass) < 8) bsfAdminRedirect('err=short_password');
        try {
            $db = bsfDb();
            $st = $db->prepare('SELECT id FROM users WHERE email=? LIMIT 1');
            $st->execute([$email]);
            if ($st->fetch()) bsfAdminRedirect('err=exists');
            // same convention as membership.php: opaque internal username
            $username = 'member_' . bin2hex(random_bytes(8));
            $db->prepare('INSERT INTO users (username,email,password_hash,name,status,created_at,updated_at) VALUES (?,?,?,?,?,NOW(),NOW())')
               ->execute([$username, $email, password_hash($pass, PASSWORD_DEFAULT), $name, $status]);
            bsfAdminRedirect('done=add_member');
        } catch (Throwable $e) {
            error_log('Blue Seas admin add_member: ' . $e->getMessage());
            bsfAdminRedirect('err=failed');
        }
    }

    if ($paction === 'delete_member') {
        $id = (int)($_POST['id'] ?? 0);
        if ($id <= 0) bsfAdminRedirect('err=failed');
        try {
            $db = bsfDb();
            $db->prepare('DELETE FROM users WHERE id=?')->execute([$id]);
            bsfAdminRedirect('done=delete_member');
        } catch (Throwable $e) {
            error_log('Blue Seas admin delete_member: ' . $e->getMessage());
            bsfAdminRedirect('err=failed');
        }
    }

    if ($paction === 'delete_subscriber') {
        $email = strtolower(trim($_POST['email'] ?? ''));
        if ($email === '') bsfAdminRedirect('err=failed');
        try {
            $db = bsfDb();
            $db->prepare('DELETE FROM newsletter_subscribers WHERE email=?')->execute([$email]);
            bsfAdminRedirect('done=delete_subscriber');
        } catch (Throwable $e) {
            error_log('Blue Seas admin delete_subscriber: ' . $e->getMessage());
            bsfAdminRedirect('err=failed');
        }
    }

    if ($paction === 'purge_bot_subscribers') {
        try {
            $db = bsfDb();
            // Purge subscribers created in last 45 days matching bot signatures or common throwaway patterns
            $st = $db->prepare("DELETE FROM newsletter_subscribers WHERE created_at >= NOW() - INTERVAL 45 DAY AND (
                email LIKE '%@cicesp.com' OR 
                email LIKE '%@gmail.com' AND (
                    email LIKE '%.%.%.%@gmail.com' OR
                    LENGTH(SUBSTRING_INDEX(email, '@', 1)) > 25
                ) OR
                email REGEXP '^[a-z]{10,25}[0-9]{2,6}@'
            )");
            $st->execute();
            $count = $st->rowCount();
            bsfAdminRedirect('done=purge_bots&n=' . $count);
        } catch (Throwable $e) {
            error_log('Blue Seas admin purge_bot_subscribers: ' . $e->getMessage());
            bsfAdminRedirect('err=failed');
        }
    }

    if ($paction === 'ban_member') {
        $id = (int)($_POST['id'] ?? 0);
        $reason = substr(trim($_POST['reason'] ?? ''), 0, 255);
        if ($id <= 0) bsfAdminRedirect('err=failed');
        try {
            $db = bsfDb();
            $db->exec("CREATE TABLE IF NOT EXISTS forum_bans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                reason VARCHAR(255) NOT NULL DEFAULT '',
                banned_at DATETIME NOT NULL,
                UNIQUE KEY uq_ban_user (user_id)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            $db->prepare("INSERT INTO forum_bans (user_id, reason, banned_at) VALUES (?,?,NOW())
                          ON DUPLICATE KEY UPDATE reason=VALUES(reason), banned_at=NOW()")
               ->execute([$id, $reason]);
            bsfAdminRedirect('done=ban_member');
        } catch (Throwable $e) {
            error_log('Blue Seas admin ban_member: ' . $e->getMessage());
            bsfAdminRedirect('err=failed');
        }
    }

    if ($paction === 'unban_member') {
        $id = (int)($_POST['id'] ?? 0);
        if ($id <= 0) bsfAdminRedirect('err=failed');
        try {
            $db = bsfDb();
            $db->prepare('DELETE FROM forum_bans WHERE user_id=?')->execute([$id]);
            bsfAdminRedirect('done=unban_member');
        } catch (Throwable $e) {
            error_log('Blue Seas admin unban_member: ' . $e->getMessage());
            bsfAdminRedirect('err=failed');
        }
    }

    if ($paction === 'gallery_purge_orphans') {
        try {
            $db = bsfDb();
            $referenced = [];
            foreach ($db->query('SELECT image_url, thumb_url FROM gallery_submissions') as $r) {
                foreach (['image_url', 'thumb_url'] as $c) {
                    $p = (string)($r[$c] ?? '');
                    if ($p !== '') $referenced[$p] = true;
                }
            }
            $docroot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/');
            $base = realpath($docroot . '/uploads/gallery');
            $n = 0;
            if ($base) {
                $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base, FilesystemIterator::SKIP_DOTS));
                foreach ($it as $f) {
                    if (!$f->isFile()) continue;
                    $rel = substr($f->getPathname(), strlen($docroot));
                    if (isset($referenced[$rel])) continue;
                    if (@unlink($f->getPathname())) $n++;
                }
            }
            bsfAdminRedirect('done=gallery_orphans&n=' . $n);
        } catch (Throwable $e) {
            error_log('Blue Seas admin gallery purge: ' . $e->getMessage());
            bsfAdminRedirect('err=failed');
        }
    }

    if ($paction === 'gallery_approve' || $paction === 'gallery_reject' || $paction === 'gallery_delete') {
        $id = (int)($_POST['id'] ?? 0);
        if ($id <= 0) bsfAdminRedirect('err=failed');
        try {
            $db = bsfDb();
            if ($paction === 'gallery_approve') {
                try {
                    $db->prepare('UPDATE gallery_submissions SET allow_publish=1, published_at=NOW() WHERE id=?')->execute([$id]);
                } catch (Throwable $e) {
                    // published_at column may predate this schema
                    $db->prepare('UPDATE gallery_submissions SET allow_publish=1 WHERE id=?')->execute([$id]);
                }
                bsfAdminRedirect('done=gallery_approve');
            }
            // reject: drop the row and its files so storage does not fill with
            // photos that will never be published.
            $st = $db->prepare('SELECT image_url, thumb_url FROM gallery_submissions WHERE id=?');
            $st->execute([$id]);
            $row = $st->fetch() ?: [];
            $db->prepare('DELETE FROM gallery_submissions WHERE id=?')->execute([$id]);
            $base = realpath($_SERVER['DOCUMENT_ROOT'] . '/uploads/gallery');
            foreach (['image_url', 'thumb_url'] as $c) {
                $p = (string)($row[$c] ?? '');
                if ($p === '' || $p[0] !== '/') continue;
                $real = realpath($_SERVER['DOCUMENT_ROOT'] . $p);
                if ($real && $base && strpos($real, $base . DIRECTORY_SEPARATOR) === 0 && is_file($real)) @unlink($real);
            }
            bsfAdminRedirect('done=' . ($paction === 'gallery_delete' ? 'gallery_delete' : 'gallery_reject'));
        } catch (Throwable $e) {
            error_log('Blue Seas admin gallery moderation: ' . $e->getMessage());
            bsfAdminRedirect('err=failed');
        }
    }

    if ($paction === 'gallery_edit') {
        $id = (int)($_POST['id'] ?? 0);
        $species  = trim((string)($_POST['species'] ?? ''));
        $location = trim((string)($_POST['location'] ?? ''));
        $caption  = trim((string)($_POST['caption'] ?? ''));
        if ($id <= 0) bsfAdminRedirect('err=failed');
        if (mb_strlen($species) > 60 || mb_strlen($location) > 80 || mb_strlen($caption) > 240) {
            bsfAdminRedirect('err=gallery_edit_long');
        }
        try {
            $db = bsfDb();
            $st = $db->prepare('SELECT 1 FROM gallery_submissions WHERE id=?');
            $st->execute([$id]);
            if (!$st->fetchColumn()) bsfAdminRedirect('err=gallery_edit_missing');
            $db->prepare('UPDATE gallery_submissions SET species=?, location=?, caption=? WHERE id=?')
               ->execute([$species !== '' ? $species : null, $location !== '' ? $location : null, $caption !== '' ? $caption : null, $id]);
            bsfAdminRedirect('done=gallery_edit&n=' . $id);
        } catch (Throwable $e) {
            error_log('Blue Seas admin gallery edit: ' . $e->getMessage());
            bsfAdminRedirect('err=failed');
        }
    }

    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    exit('Unknown action');
}

/* ---- Sign-in gate ------------------------------------------------------- */
if ($expected === '') {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    exit('Admin key is not configured on the server.');
}

/* No session and no key in the URL: show the sign-in card (200, not 403 —
   this is now a page, and a bare "Forbidden" told the owner nothing). */
if (!$cookieOk && !$keyOk) {
    $errMsg = ((string)($_GET['e'] ?? '')) === 'badkey'
        ? 'That key is not correct. Check it and try again.' : '';
    $infoMsg = '';
    if (((string)($_GET['changed'] ?? '')) === '1') {
        $infoMsg = 'Admin key updated. Sign in with your new key.';
    } elseif (((string)($_GET['signedout'] ?? '')) === '1') {
        $infoMsg = 'Every admin session was signed out. Sign in again — your key is unchanged.';
    }
    bsfAdminLoginPage($errMsg, null, $infoMsg);
}

/* A valid key in the URL becomes the session cookie, then leaves the address
   bar: old bookmarks keep working, history/Referer stop carrying the key. */
if ($keyOk && !$cookieOk) {
    bsfAdminCookieSend(bsfAdminCookieValue(time() + BSF_ADMIN_TTL, $signKey));
    header('Location: ' . $back, true, 303);
    exit;
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');

try {
    $db = bsfDb();
} catch (Throwable $e) {
    http_response_code(500);
    exit('Database unavailable.');
}

$active = (int)$db->query("SELECT COUNT(*) FROM newsletter_subscribers WHERE status='active'")->fetchColumn();
$unsub  = (int)$db->query("SELECT COUNT(*) FROM newsletter_subscribers WHERE status='unsubscribed'")->fetchColumn();
$last30 = (int)$db->query("SELECT COUNT(*) FROM newsletter_subscribers WHERE status='active' AND created_at >= NOW() - INTERVAL 30 DAY")->fetchColumn();
$prev30 = (int)$db->query("SELECT COUNT(*) FROM newsletter_subscribers WHERE status='active' AND created_at >= NOW() - INTERVAL 60 DAY AND created_at < NOW() - INTERVAL 30 DAY")->fetchColumn();

$byState = $db->query("SELECT COALESCE(NULLIF(state_slug,''),'(no state)') s, COUNT(*) n
                       FROM newsletter_subscribers WHERE status='active' GROUP BY s ORDER BY n DESC")->fetchAll();
$bySource = $db->query("SELECT source, COUNT(*) n FROM newsletter_subscribers WHERE status='active'
                        GROUP BY source ORDER BY n DESC")->fetchAll();
$rows = $db->query("SELECT email, status, state_slug, source, created_at
                    FROM newsletter_subscribers ORDER BY created_at DESC LIMIT 500")->fetchAll();
$sends = $db->query("SELECT stamp, issue, recipients, sent_at FROM newsletter_send_log ORDER BY sent_at DESC LIMIT 6")->fetchAll();

/* ====== Members (users table) — each block defensive so one missing
   column/table never takes down the whole dashboard. ====== */
$mem = ['total'=>0,'premium'=>0,'member'=>0,'last30'=>0,'prev30'=>0];
$allUsers = [];
$recentLogins = [];
$tableRows = [];
$forumBans = [];
try {
    $forumBans = $db->query(
        "SELECT b.user_id, b.reason, b.banned_at, u.email, u.name
         FROM forum_bans b LEFT JOIN users u ON u.id = b.user_id
         ORDER BY b.banned_at DESC LIMIT 50"
    )->fetchAll();
} catch (Throwable $e) { /* forum_bans table missing — skip */ }
try {
    $mem['total']    = (int)$db->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $mem['premium']  = (int)$db->query("SELECT COUNT(*) FROM users WHERE status='premium'")->fetchColumn();
    $mem['member']   = (int)$db->query("SELECT COUNT(*) FROM users WHERE status='member'")->fetchColumn();
    $mem['last30']   = (int)$db->query("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL 30 DAY")->fetchColumn();
    $mem['prev30']   = (int)$db->query("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL 60 DAY AND created_at < NOW() - INTERVAL 30 DAY")->fetchColumn();
    $allUsers = $db->query("SELECT id, email, name, status, created_at FROM users ORDER BY created_at DESC LIMIT 300")->fetchAll();
} catch (Throwable $e) { /* users table unavailable — skip section */ }
try {
    $recentLogins = $db->query("SELECT email, status, last_login_at FROM users WHERE last_login_at IS NOT NULL ORDER BY last_login_at DESC LIMIT 15")->fetchAll();
} catch (Throwable $e) { /* column missing — skip */ }
try {
    $tableRows = $db->query("SELECT table_name AS t, table_rows AS n FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_rows DESC")->fetchAll();
} catch (Throwable $e) { /* skip */ }

/* ====== Community gallery moderation — every member upload waits at
   allow_publish=0 with no other screen to release it. ====== */
$pendingGallery = [];
$galleryAll = [];
$galleryPublished = 0;
$galleryOrphans = [];
try {
    $galleryPublished = (int)$db->query("SELECT COUNT(*) FROM gallery_submissions WHERE allow_publish=1")->fetchColumn();
    /* media_type/duration_sec arrive with migrate-gallery-media.py; select them
       only when present so an un-migrated database still lists photos. */
    $gcols = [];
    $gst = $db->prepare("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gallery_submissions'");
    $gst->execute();
    foreach ($gst as $gc) $gcols[strtolower($gc['COLUMN_NAME'])] = true;
    $mediaSel = (isset($gcols['media_type']) ? ', g.media_type' : '')
              . (isset($gcols['duration_sec']) ? ', g.duration_sec' : '');
    $galleryAll = $db->query(
        "SELECT g.id, g.user_id, g.species, g.caption, g.location, g.image_url, g.thumb_url, g.allow_publish, g.created_at, u.email"
        . $mediaSel . "
         FROM gallery_submissions g LEFT JOIN users u ON u.id = g.user_id
         ORDER BY g.allow_publish ASC, g.id DESC LIMIT 300"
    )->fetchAll();
    foreach ($galleryAll as $g) { if (empty($g['allow_publish'])) $pendingGallery[] = $g; }
} catch (Throwable $e) { /* gallery table/columns unavailable — skip */ }
/* Files sitting in uploads/gallery that no row references any more. */
try {
    $referenced = [];
    foreach ($db->query('SELECT image_url, thumb_url FROM gallery_submissions') as $r) {
        foreach (['image_url', 'thumb_url'] as $c) {
            $p = (string)($r[$c] ?? '');
            if ($p !== '') $referenced[$p] = true;
        }
    }
    $docroot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/');
    $base = realpath($docroot . '/uploads/gallery');
    if ($base) {
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base, FilesystemIterator::SKIP_DOTS));
        foreach ($it as $f) {
            if (!$f->isFile()) continue;
            $rel = substr($f->getPathname(), strlen($docroot));
            if (!isset($referenced[$rel])) $galleryOrphans[] = $rel;
        }
        sort($galleryOrphans);
    }
} catch (Throwable $e) { /* uploads dir unavailable — skip */ }
$memGrowth = $mem['prev30'] > 0 ? round((($mem['last30'] - $mem['prev30']) / $mem['prev30']) * 100) : null;

/* flash message after add/delete (PRG) */
$flashMsg = '';
$flashOk  = true;
$done = $_GET['done'] ?? '';
$errc = $_GET['err'] ?? '';
if ($done === 'add_member')        { $flashMsg = 'Member added — they can sign in right away.'; }
elseif ($done === 'delete_member') { $flashMsg = 'Member deleted.'; }
elseif ($done === 'delete_subscriber') { $flashMsg = 'Subscriber removed from newsletter.'; }
elseif ($done === 'purge_bots') {
    $n = (int)($_GET['n'] ?? 0);
    $flashMsg = $n . ' bot subscriber' . ($n === 1 ? '' : 's') . ' purged from the database.';
}
elseif ($done === 'ban_member')    { $flashMsg = 'Member banned from posting in the forum.'; }
elseif ($done === 'unban_member')  { $flashMsg = 'Ban lifted — the member can post again.'; }
elseif ($done === 'gallery_approve') { $flashMsg = 'Upload approved — it is live in the Community Gallery.'; }
elseif ($done === 'gallery_reject')  { $flashMsg = 'Upload rejected and removed.'; }
elseif ($done === 'gallery_delete')  { $flashMsg = 'Upload deleted, including its stored file.'; }
elseif ($done === 'gallery_edit') {
    $n = (int)($_GET['n'] ?? 0);
    $flashMsg = 'Photo #' . $n . ' details saved — the gallery shows the new text right away.';
}
elseif ($done === 'gallery_orphans') {
    $n = (int)($_GET['n'] ?? 0);
    $flashMsg = $n . ' orphaned file' . ($n === 1 ? '' : 's') . ' deleted from uploads/gallery.';
}
elseif ($errc === 'gallery_edit_long')  { $flashMsg = 'Edit failed: species max 60, location max 80, caption max 240 characters.'; $flashOk = false; }
elseif ($errc === 'gallery_edit_missing') { $flashMsg = 'Edit failed: that photo is no longer in the gallery.'; $flashOk = false; }
elseif ($errc === 'invalid_email') { $flashMsg = 'Add failed: invalid email address.'; $flashOk = false; }
elseif ($errc === 'short_password'){ $flashMsg = 'Add failed: password must be at least 8 characters.'; $flashOk = false; }
elseif ($errc === 'exists')        { $flashMsg = 'Add failed: that email is already registered.'; $flashOk = false; }
elseif ($errc === 'failed')        { $flashMsg = 'Action failed (database error). Check the server log.'; $flashOk = false; }
elseif ($errc === 'key_current')   { $flashMsg = 'Key change failed: the current key is wrong.'; $flashOk = false; }
elseif ($errc === 'key_short')     { $flashMsg = 'Key change failed: use at least 12 characters.'; $flashOk = false; }
elseif ($errc === 'key_repeat')    { $flashMsg = 'Key change failed: the two new keys do not match.'; $flashOk = false; }
elseif ($errc === 'key_same')      { $flashMsg = 'Key change failed: the new key is the same as the old one.'; $flashOk = false; }
elseif ($errc === 'key_write')     { $flashMsg = 'Key change failed: the server config could not be written. Nothing changed.'; $flashOk = false; }
elseif ($errc === 'epoch_write')   { $flashMsg = 'Sign out everywhere failed: the server config could not be written. Sessions were left alone.'; $flashOk = false; }

function h(?string $s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

/* Every POST form proves the current auth: a CSRF token when the session
   cookie is in play, or the key itself on a key-authenticated load. */
$formAction = '/api/admin.php';
$backField  = '<input type="hidden" name="back" value="' . h($back) . '">';
$authField  = $backField . ($cookieOk
    ? '<input type="hidden" name="csrf" value="' . h($csrf) . '">'
    : '<input type="hidden" name="key" value="' . h($key) . '">');
function stateName(?string $slug): string {
    $s = trim((string)$slug);
    if ($s === '') return '—';
    return ucfirst(str_replace('-', ' ', $s));
}
$growth = $prev30 > 0 ? round((($last30 - $prev30) / $prev30) * 100) : null;
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Blue Seas Admin">
<link rel="apple-touch-icon" href="https://www.blueseasfishing.com/images/apple-touch-icon.png">
<title>Blue Seas — Admin stats</title>
<style>
  :root{--bg:#f1f5f9;--card:#fff;--text:#0f172a;--muted:#64748b;--line:#e2e8f0;--brand:#1d4ed8;--good:#16a34a}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
  .wrap{max-width:920px;margin:0 auto;padding:16px}
  h1{font-size:22px;margin:6px 0 2px}
  .sub{color:var(--muted);font-size:13px;margin-bottom:14px}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}
  .card .num{font-size:28px;font-weight:800;line-height:1.1}
  .card .lbl{color:var(--muted);font-size:12px;margin-top:2px}
  .up{color:var(--good);font-weight:700;font-size:13px}
  h2{font-size:15px;margin:20px 0 8px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  @media (max-width:640px){.cols{grid-template-columns:1fr}}
  table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden}
  th,td{padding:8px 10px;text-align:left;border-bottom:1px solid var(--line);font-size:13.5px;vertical-align:top}
  th{background:#f8fafc;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.03em}
  tr:last-child td{border-bottom:none}
  @media (max-width:640px){table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch}}
  .badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11.5px;font-weight:600}
  .b-ok{background:#dcfce7;color:#166534}
  .b-off{background:#fee2e2;color:#991b1b}
  .bar{height:8px;border-radius:999px;background:var(--brand);min-width:2px;display:inline-block;vertical-align:middle}
  .pill{display:inline-block;background:#e0e7ff;color:#3730a3;border-radius:999px;padding:1px 8px;font-size:12px;margin:2px}
  .foot{color:var(--muted);font-size:12px;margin-top:18px;text-align:center}
  /* Toast: fixed at the bottom so it never pushes the page down or hides the
     row you just acted on. It fades out on its own after a few seconds. */
  .flash{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:20;width:max-content;max-width:min(560px,calc(100vw - 24px));border-radius:10px;padding:9px 14px;margin:0;font-weight:700;font-size:13.5px;box-shadow:0 10px 26px rgba(15,23,42,.22);transition:opacity .4s ease}
  .flash.hide{opacity:0;pointer-events:none}
  .flash-ok{background:#dcfce7;color:#166534;border:1px solid #86efac}
  .flash-err{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}
  .header-link{display:inline-block;margin-left:6px;background:#e0e7ff;color:#3730a3;border-radius:7px;padding:2px 9px;font-size:12px;font-weight:700;text-decoration:none}
  .edit-form{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:6px}
  .form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}
  .edit-form label{display:block;font-size:12.5px;color:var(--muted);font-weight:600}
  .edit-form input,.edit-form select{display:block;width:100%;margin-top:4px;padding:9px 10px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:var(--text);font:inherit;font-weight:400}
  .btn-add{margin-top:12px;background:var(--brand);color:#fff;border:0;border-radius:9px;padding:10px 18px;font-weight:700;font-size:14px;cursor:pointer}
  .btn-del{background:#fee2e2;color:#991b1b;border:1px solid #fecaca;border-radius:8px;padding:4px 11px;font-size:12.5px;font-weight:700;cursor:pointer}
  .btn-edit{background:#e0e7ff;color:#3730a3;border:1px solid #c7d2fe;border-radius:8px;padding:4px 11px;font-size:12.5px;font-weight:700;cursor:pointer;margin-right:4px}
  .btn-cancel{background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;border-radius:9px;padding:9px 16px;font-weight:700;font-size:14px;cursor:pointer;margin-left:6px}
  tr.gallery-edit td{background:#f8fafc}
  tr.gallery-edit[hidden]{display:none}
</style>
</head>
<body>
<div class="wrap">
  <h1>Blue Seas — Admin stats</h1>
  <div class="sub">Members &amp; newsletter · live from the database · owner only · <?= h(date('M j, Y g:ia')) ?><?php if ($cookieOk): ?>
    <form method="post" action="/api/admin.php" style="display:inline;margin-left:8px">
      <input type="hidden" name="action" value="logout">
      <input type="hidden" name="back" value="<?= h($back) ?>">
      <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
      <button type="submit" style="background:#e2e8f0;color:#334155;border:0;border-radius:7px;padding:2px 9px;font:inherit;font-size:12px;font-weight:700;cursor:pointer">Sign out</button>
    </form>
    <a class="header-link" href="#password">Change password</a>
  <?php endif; ?></div>
  <?php if ($flashMsg): ?><div class="flash <?= $flashOk ? 'flash-ok' : 'flash-err' ?>"><?= h($flashMsg) ?></div><?php endif; ?>

  <div class="cards">
    <div class="card"><div class="num"><?= $mem['total'] ?></div><div class="lbl">Member accounts</div></div>
    <div class="card"><div class="num"><?= $mem['premium'] ?></div><div class="lbl">Premium subscribers</div></div>
    <div class="card"><div class="num"><?= $mem['last30'] ?></div><div class="lbl">Signups last 30 days</div><?= $memGrowth !== null ? '<span class="up">'.($memGrowth>=0?'+':'').$memGrowth.'% vs prior 30d</span>' : '' ?></div>
    <div class="card"><div class="num"><?= $mem['member'] ?></div><div class="lbl">Free members</div></div>
  </div>

  <div class="cards">
    <div class="card"><div class="num"><?= $active ?></div><div class="lbl">Active subscribers</div></div>
    <div class="card"><div class="num"><?= $last30 ?></div><div class="lbl">Joined last 30 days</div><?= $growth !== null ? '<span class="up">'.($growth>=0?'+':'').$growth.'% vs prior 30d</span>' : '' ?></div>
    <div class="card"><div class="num"><?= $unsub ?></div><div class="lbl">Unsubscribed (all time)</div></div>
  </div>

  <h2>Add member</h2>
  <form class="edit-form" method="post" action="<?= h($formAction) ?>">
    <?= $authField ?>
    <input type="hidden" name="action" value="add_member">
    <div class="form-grid">
      <label>Email<input type="email" name="email" required placeholder="angler@example.com"></label>
      <label>Password<input type="text" name="password" required minlength="8" placeholder="min 8 characters" autocomplete="off"></label>
      <label>Name<input type="text" name="name" placeholder="Display name (optional)"></label>
      <label>Status
        <select name="status">
          <option value="member">member (free)</option>
          <option value="premium">premium</option>
        </select>
      </label>
    </div>
    <button type="submit" class="btn-add">Add member</button>
  </form>

  <h2>All members</h2>
  <table>
    <tr><th>#</th><th>Email</th><th>Name</th><th>Status</th><th>Joined</th><th></th></tr>
    <?php if (!$allUsers): ?><tr><td class="sub">No member data.</td></tr><?php endif; ?>
    <?php foreach ($allUsers as $r): ?>
    <tr>
      <td><?= (int)$r['id'] ?></td>
      <td><?= h($r['email']) ?></td>
      <td><?= h($r['name'] ?: '—') ?></td>
      <td><span class="badge <?= $r['status']==='premium'?'b-ok':'b-off' ?>"><?= h($r['status']) ?></span></td>
      <td style="color:var(--muted)"><?= h(substr((string)$r['created_at'],0,16)) ?></td>
      <td style="text-align:right">
        <form method="post" action="<?= h($formAction) ?>" onsubmit="return confirm('Delete member #<?= (int)$r['id'] ?>? This cannot be undone.')" style="display:inline">
          <?= $authField ?>
          <input type="hidden" name="action" value="delete_member">
          <input type="hidden" name="id" value="<?= (int)$r['id'] ?>">
          <button type="submit" class="btn-del">Delete</button>
        </form>
        <?php $isBanned = in_array((int)$r['id'], array_map(fn($b) => (int)$b['user_id'], $forumBans), true); ?>
        <?php if ($isBanned): ?>
        <form method="post" action="<?= h($formAction) ?>" style="display:inline">
          <?= $authField ?>
          <input type="hidden" name="action" value="unban_member">
          <input type="hidden" name="id" value="<?= (int)$r['id'] ?>">
          <button type="submit" class="btn-del" style="background:#dcfce7;color:#166534;border-color:#86efac">Unban</button>
        </form>
        <?php else: ?>
        <form method="post" action="<?= h($formAction) ?>" style="display:inline" onsubmit="return confirm('Ban member #<?= (int)$r['id'] ?> from posting in the forum?')">
          <?= $authField ?>
          <input type="hidden" name="action" value="ban_member">
          <input type="hidden" name="id" value="<?= (int)$r['id'] ?>">
          <input type="text" name="reason" maxlength="255" placeholder="reason (optional)" style="width:130px;padding:4px 8px;border:1px solid #cbd5e1;border-radius:8px;font-size:12px">
          <button type="submit" class="btn-del">Ban</button>
        </form>
        <?php endif; ?>
      </td>
    </tr>
    <?php endforeach; ?>
  </table>

  <h2>Members — recent logins</h2>
  <table>
    <?php if (!$recentLogins): ?><tr><td class="sub">No login data yet.</td></tr><?php endif; ?>
    <?php foreach ($recentLogins as $r): ?>
    <tr>
      <td><?= h($r['email']) ?></td>
      <td><span class="badge <?= $r['status']==='premium'?'b-ok':'b-off' ?>"><?= h($r['status']) ?></span></td>
      <td style="color:var(--muted)"><?= h(substr((string)$r['last_login_at'],0,16)) ?></td>
    </tr>
    <?php endforeach; ?>
  </table>

  <h2>Forum bans</h2>
  <table>
    <?php if (!$forumBans): ?><tr><td class="sub">No active forum bans.</td></tr><?php endif; ?>
    <?php foreach ($forumBans as $b): ?>
    <tr>
      <td>#<?= (int)$b['user_id'] ?></td>
      <td><?= h($b['email'] ?? '(deleted account)') ?></td>
      <td><?= h($b['reason'] ?: '—') ?></td>
      <td style="color:var(--muted)"><?= h(substr((string)$b['banned_at'],0,16)) ?></td>
      <td style="text-align:right">
        <form method="post" action="<?= h($formAction) ?>" style="display:inline">
          <?= $authField ?>
          <input type="hidden" name="action" value="unban_member">
          <input type="hidden" name="id" value="<?= (int)$b['user_id'] ?>">
          <button type="submit" class="btn-del" style="background:#dcfce7;color:#166534;border-color:#86efac">Unban</button>
        </form>
      </td>
    </tr>
    <?php endforeach; ?>
  </table>

  <h2 id="gallery">Community gallery — <?= count($pendingGallery) ?> pending · <?= $galleryPublished ?> published</h2>
  <?php if (!$galleryAll): ?>
  <table><tr><td class="sub">No uploads yet.</td></tr></table>
  <?php else: ?>
  <table>
    <tr><th>Media</th><th>Details</th><th>Member</th><th>Status</th><th></th></tr>
    <?php foreach ($galleryAll as $g):
      $isPending = empty($g['allow_publish']);
      $kind = strtolower((string)($g['media_type'] ?? ''));
      if ($kind !== 'video' && preg_match('/\.(mp4|mov|m4v)$/i', (string)($g['image_url'] ?? ''))) $kind = 'video';
      $isVideo = ($kind === 'video');
      $gDur = isset($g['duration_sec']) && $g['duration_sec'] !== null ? (int)$g['duration_sec'] : null;
    ?>
    <tr data-gid="<?= (int)$g['id'] ?>">
      <td style="width:150px">
        <?php if ($isVideo): ?>
        <video src="<?= h($g['image_url']) ?>" controls preload="metadata" playsinline
               style="width:132px;height:84px;object-fit:cover;border-radius:8px;border:1px solid var(--line);display:block;background:#000"></video>
        <?php else: ?>
        <a href="<?= h($g['image_url'] ?: $g['thumb_url']) ?>" target="_blank" rel="noopener">
          <img src="<?= h($g['thumb_url'] ?: $g['image_url']) ?>" alt="" loading="lazy"
               style="width:120px;height:84px;object-fit:cover;border-radius:8px;border:1px solid var(--line);display:block">
        </a>
        <?php endif; ?>
      </td>
      <td>
        <strong><?= h($g['species'] ?: 'Unidentified') ?></strong><br>
        <span class="sub"><?= h($g['location'] ?: '—') ?></span>
        <?php if ($g['caption']): ?><br><span class="sub"><?= h($g['caption']) ?></span><?php endif; ?>
        <br><span class="sub"><?= $isVideo ? 'video' : 'photo' ?> #<?= (int)$g['id'] ?><?= ($isVideo && $gDur !== null) ? ' · ' . $gDur . 's' : '' ?></span>
      </td>
      <td><?= h($g['email'] ?? ('user #' . (int)$g['user_id'])) ?></td>
      <td>
        <span class="badge <?= $isPending ? 'b-off' : 'b-ok' ?>"><?= $isPending ? 'pending' : 'published' ?></span><br>
        <span style="color:var(--muted)"><?= h(substr((string)$g['created_at'], 0, 16)) ?></span>
      </td>
      <td style="text-align:right;white-space:nowrap">
        <button type="button" class="btn-edit" data-edit="<?= (int)$g['id'] ?>" aria-expanded="false" aria-controls="edit-<?= (int)$g['id'] ?>">Edit</button>
        <?php if ($isPending): ?>
        <form method="post" action="<?= h($formAction) ?>" style="display:inline">
          <?= $authField ?>
          <input type="hidden" name="action" value="gallery_approve">
          <input type="hidden" name="id" value="<?= (int)$g['id'] ?>">
          <button type="submit" class="btn-del" style="background:#dcfce7;color:#166534;border-color:#86efac">Approve</button>
        </form>
        <?php endif; ?>
        <form method="post" action="<?= h($formAction) ?>" style="display:inline" onsubmit="return confirm('Delete upload #<?= (int)$g['id'] ?> for good? The stored file is deleted from the server.')">
          <?= $authField ?>
          <input type="hidden" name="action" value="gallery_delete">
          <input type="hidden" name="id" value="<?= (int)$g['id'] ?>">
          <button type="submit" class="btn-del">Delete</button>
        </form>
      </td>
    </tr>
    <tr class="gallery-edit" id="edit-<?= (int)$g['id'] ?>" data-edit-for="<?= (int)$g['id'] ?>" hidden>
      <td colspan="5">
        <form method="post" action="<?= h($formAction) ?>">
          <?= $authField ?>
          <input type="hidden" name="action" value="gallery_edit">
          <input type="hidden" name="id" value="<?= (int)$g['id'] ?>">
          <div class="form-grid">
            <label>Species<input type="text" name="species" maxlength="60" value="<?= h($g['species'] ?? '') ?>" placeholder="e.g. Rainbow Trout"></label>
            <label>Location<input type="text" name="location" maxlength="80" value="<?= h($g['location'] ?? '') ?>" placeholder="e.g. California"></label>
            <label>Caption<input type="text" name="caption" maxlength="240" value="<?= h($g['caption'] ?? '') ?>" placeholder="Short description"></label>
          </div>
          <button type="submit" class="btn-add" style="margin-top:10px">Save details</button>
          <button type="button" class="btn-cancel" data-cancel="<?= (int)$g['id'] ?>">Cancel</button>
        </form>
      </td>
    </tr>
    <?php endforeach; ?>
  </table>
  <?php endif; ?>

  <h2>Orphaned gallery files — <?= count($galleryOrphans) ?></h2>
  <?php if (!$galleryOrphans): ?>
  <table><tr><td class="sub">Every file in uploads/gallery belongs to an upload.</td></tr></table>
  <?php else: ?>
  <table>
    <tr><th>File</th><th style="text-align:right">Size</th></tr>
    <?php foreach (array_slice($galleryOrphans, 0, 60) as $f): ?>
    <tr>
      <td><a href="<?= h($f) ?>" target="_blank" rel="noopener"><?= h($f) ?></a></td>
      <td style="text-align:right;color:var(--muted)"><?= h(number_format((int)@filesize(rtrim($_SERVER['DOCUMENT_ROOT'], '/') . $f) / 1024, 1)) ?> KB</td>
    </tr>
    <?php endforeach; ?>
    <?php if (count($galleryOrphans) > 60): ?><tr><td class="sub">… and <?= count($galleryOrphans) - 60 ?> more</td><td></td></tr><?php endif; ?>
    <tr>
      <td colspan="2" style="text-align:right">
        <form method="post" action="<?= h($formAction) ?>" onsubmit="return confirm('Delete all <?= count($galleryOrphans) ?> orphaned files? This cannot be undone.')">
          <?= $authField ?>
          <input type="hidden" name="action" value="gallery_purge_orphans">
          <button type="submit" class="btn-del">Delete all <?= count($galleryOrphans) ?> orphaned files</button>
        </form>
      </td>
    </tr>
  </table>
  <?php endif; ?>

  <h2>Newsletter subscribers</h2>
  <table>
    <?php $max = max(1, array_column($byState, 'n')[0] ?? 1); foreach ($byState as $r): ?>
    <tr>
      <td style="width:38%"><?= h(stateName($r['s'])) ?></td>
      <td style="width:12%;font-weight:700"><?= (int)$r['n'] ?></td>
      <td><span class="bar" style="width:<?= max(2, round(100*$r['n']/$max)) ?>%"></span></td>
    </tr>
    <?php endforeach; ?>
  </table>

  <h2>Where they came from</h2>
  <table>
    <?php foreach ($bySource as $r): ?>
    <tr><td><?= h($r['source']) ?></td><td style="text-align:right;font-weight:700"><?= (int)$r['n'] ?></td></tr>
    <?php endforeach; ?>
  </table>

  <h2>Recent newsletter sends</h2>
  <table>
    <?php if (!$sends): ?><tr><td class="sub">No sends yet.</td></tr><?php endif; ?>
    <?php foreach ($sends as $r): ?>
    <tr>
      <td><?= h($r['stamp']) ?> · <?= h($r['issue']) ?></td>
      <td><?= (int)$r['recipients'] ?> sent</td>
      <td style="text-align:right;color:var(--muted)"><?= h($r['sent_at']) ?></td>
    </tr>
    <?php endforeach; ?>
  </table>

  <div style="display:flex;justify-content:space-between;align-items:center;margin:20px 0 8px">
    <h2 style="margin:0">All subscribers (newest first)</h2>
    <form method="post" action="<?= h($formAction) ?>" onsubmit="return confirm('Purge detected bot subscribers from the last 45 days? This will remove bot pattern signups.')">
      <?= $authField ?>
      <input type="hidden" name="action" value="purge_bot_subscribers">
      <button type="submit" class="btn-del" style="background:#fef2f2;border-color:#f87171">Auto-purge recent bots</button>
    </form>
  </div>
  <table>
    <tr><th>Email</th><th>State</th><th>Status</th><th>Joined</th><th style="text-align:right">Action</th></tr>
    <?php foreach ($rows as $r): ?>
    <tr>
      <td><?= h($r['email']) ?></td>
      <td><?= h(stateName($r['state_slug'])) ?></td>
      <td><span class="badge <?= $r['status']==='active'?'b-ok':'b-off' ?>"><?= h($r['status']) ?></span></td>
      <td style="color:var(--muted)"><?= h(substr((string)$r['created_at'],0,10)) ?></td>
      <td style="text-align:right">
        <form method="post" action="<?= h($formAction) ?>" onsubmit="return confirm('Remove subscriber <?= h($r['email']) ?>?')" style="display:inline">
          <?= $authField ?>
          <input type="hidden" name="action" value="delete_subscriber">
          <input type="hidden" name="email" value="<?= h($r['email']) ?>">
          <button type="submit" class="btn-del">Delete</button>
        </form>
      </td>
    </tr>
    <?php endforeach; ?>
  </table>

  <?php if ($tableRows): ?>
  <h2>Database overview</h2>
  <table>
    <tr><th>Table</th><th style="text-align:right">Rows (approx.)</th></tr>
    <?php foreach ($tableRows as $r): ?>
    <tr><td><?= h($r['t']) ?></td><td style="text-align:right;font-weight:700"><?= (int)$r['n'] ?></td></tr>
    <?php endforeach; ?>
  </table>
  <?php endif; ?>

  <h2 id="password">Change your password</h2>
  <form class="edit-form" method="post" action="<?= h($formAction) ?>" id="password-form">
    <?= $authField ?>
    <input type="hidden" name="action" value="change_key">
    <p class="sub" style="margin:0 0 10px">The password you type on the sign-in card — the code calls it the <strong>admin key</strong>. Enter the one you use now, then pick a new one of at least 12 characters.</p>
    <div class="form-grid">
      <label>Current password<input type="password" name="current_key" required autocomplete="off" data-lpignore="true" data-1p-ignore="true"></label>
      <label>New password (12+ characters)<input type="password" name="new_key" required minlength="12" autocomplete="new-password" data-lpignore="true" data-1p-ignore="true"></label>
      <label>Repeat new password<input type="password" name="repeat_key" required minlength="12" autocomplete="new-password" data-lpignore="true" data-1p-ignore="true"></label>
    </div>
    <p class="sub" style="margin:8px 0 0">Stored as a hash, never in plain text. Changing it signs out every browser; your 48-character cron key keeps working as a backup.</p>
    <button type="submit" class="btn-add">Change password</button>
  </form>

  <h2>Sign out of every browser</h2>
  <form class="edit-form" method="post" action="<?= h($formAction) ?>" onsubmit="return confirm('Sign out every browser, including this one? Your password stays the same.')" style="margin-bottom:6px">
    <?= $authField ?>
    <input type="hidden" name="action" value="signout_all">
    <p class="sub" style="margin:0 0 8px">Lost a laptop or phone? Revoke every signed-in browser. Your password does not change.</p>
    <button type="submit" class="btn-del" style="padding:8px 14px">Sign out everywhere</button>
  </form>

  <script>
  /* Keep your place in the gallery. Approve/Delete posts and redirects back
     here (PRG), which would otherwise land at the top of the page. The row
     index is saved before submitting and the row now in that position is
     scrolled into view, so deleting several photos in a row stays put. */
  (function () {
    var KEY = 'bsf-admin-scroll';
    var flash = document.querySelector('.flash');
    if (flash) setTimeout(function () { flash.classList.add('hide'); }, 4500);

    function galleryRows() {
      return Array.prototype.slice.call(document.querySelectorAll('#gallery ~ table tr[data-gid]'));
    }

    /* Inline Edit: reveal the row's form, no navigation and no page jump. */
    function toggleEdit(id, open) {
      var row = document.getElementById('edit-' + id);
      var btn = document.querySelector('[data-edit="' + id + '"]');
      if (!row) return;
      row.hidden = !open;
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        var first = row.querySelector('input[name="species"]');
        if (first) first.focus({ preventScroll: true });
      }
    }
    document.addEventListener('click', function (e) {
      var editBtn = e.target.closest ? e.target.closest('[data-edit]') : null;
      if (editBtn) { toggleEdit(editBtn.getAttribute('data-edit'), true); return; }
      var cancelBtn = e.target.closest ? e.target.closest('[data-cancel]') : null;
      if (cancelBtn) toggleEdit(cancelBtn.getAttribute('data-cancel'), false);
    });

    /* Bubble phase, not capture: a cancelled confirm() marks the event
       defaultPrevented, and a cancelled action must not arm the jump. */
    document.addEventListener('submit', function (e) {
      if (e.defaultPrevented) return;
      var form = e.target;
      if (!form || form.tagName !== 'FORM') return;
      var actionEl = form.querySelector('input[name="action"]');
      var action = actionEl ? actionEl.value : '';
      if (action.indexOf('gallery_') !== 0) return;
      var tr = form.closest('tr');
      var rows = galleryRows();
      // edit forms live in their own row: resolve back to the photo's row
      var gid = tr ? (tr.getAttribute('data-gid') || tr.getAttribute('data-edit-for')) : null;
      var index = -1;
      if (gid) {
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].getAttribute('data-gid') === gid) { index = i; break; }
        }
      }
      try {
        sessionStorage.setItem(KEY, JSON.stringify({
          index: index,
          y: window.scrollY || window.pageYOffset || 0,
          t: Date.now()
        }));
      } catch (err) { /* storage blocked: fall back to the old jump */ }
    });

    var state = null;
    try {
      var saved = sessionStorage.getItem(KEY);
      if (saved) {
        sessionStorage.removeItem(KEY);
        state = JSON.parse(saved);
      }
    } catch (err) { return; }
    /* Stale state (an action that never navigated) is ignored after a minute. */
    if (!state || !state.t || Date.now() - state.t > 60000) return;

    /* Only on a gallery redirect, and only for this load: the browser's own
       scroll restoration would otherwise fight ours and win, but ordinary
       reloads and back-navigation should keep behaving normally. */
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    function place() {
      var rows = galleryRows();
      var target = rows[state.index] || rows[rows.length - 1] || null;
      if (target) {
        target.scrollIntoView({ block: 'center' });
      } else {
        var heading = document.getElementById('gallery');
        if (heading) heading.scrollIntoView({ block: 'start' });
        else if (state.y) window.scrollTo(0, state.y);
      }
    }

    /* Place it now, then once more after the load event and a beat later:
       images or a late reflow must not leave the gallery off-screen. */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { requestAnimationFrame(place); });
    } else {
      requestAnimationFrame(place);
    }
    window.addEventListener('load', place);
    setTimeout(place, 250);
  })();
  </script>

  <div class="foot">Bookmark <strong>/admin</strong> · signed in for 30 days · add/delete/ban via POST · v6</div>
</div>
</body>
</html>
