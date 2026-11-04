<?php
/** forum.php — community forum JSON API
 *  Same PHP session (bsf_sess) as membership.php, so anyone signed in on the
 *  site can post without a separate forum login. Guests can read; members post.
 *
 *  Tables (created automatically on first call):
 *    forum_categories (id, name, description, icon, sort_order)
 *    forum_topics     (id, category_id, user_id, title, created_at)
 *    forum_posts      (id, topic_id, user_id, body, created_at)
 *
 *  Actions:
 *    GET  ?action=categories              list categories + real topic/post counts
 *    GET  ?action=topics&cat=<id>         topics in a category (author + reply count)
 *    GET  ?action=posts&topic=<id>        posts in a topic (author names)
 *    POST action=new_topic cat title body create topic (member+)
 *    POST action=reply      topic body    add post   (member+)
 *
 *  Free "member" status is enough to post — the forum is deliberately NOT
 *  premium-gated (visitors were being bounced to the premium upsell instead).
 *
 *  Forum rules enforcement (see the Forum Rules card on forum.html):
 *   - banned accounts cannot post (forum_bans table, managed via admin.php)
 *   - posts containing abusive, vulgar or sexual content are rejected
 *   - posts with excessive links are rejected as spam
 *  Abuse of the forum and neglect of these rules results in a ban.
 */

require_once __DIR__ . '/db-config.php';
const ORIGIN = 'https://www.blueseasfishing.com'; // allow your site

/* ====== CORS / JSON headers ====== */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === ORIGIN) {
  header("Access-Control-Allow-Origin: " . ORIGIN);
  header("Vary: Origin");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
header('Content-Type: application/json; charset=utf-8');

/* ====== Session (identical params to membership.php so the cookie is shared) ====== */
$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'domain' => $_SERVER['HTTP_HOST'],
  'secure' => $secure,
  'httponly' => true,
  'samesite' => 'Lax'
]);
session_name('bsf_sess');
session_start();

/* ====== Helpers ====== */
function db() { return bsfDb(); }

function j($ok, $data = null, $status = 200) {
  http_response_code($status);
  echo json_encode($ok ? ['ok' => true, 'data' => $data] : ['ok' => false, 'error' => $data], JSON_UNESCAPED_SLASHES);
  exit;
}

function currentUser() {
  if (!isset($_SESSION['uid'])) return null;
  $st = db()->prepare("SELECT id,email,name,status FROM users WHERE id=? LIMIT 1");
  $st->execute([$_SESSION['uid']]);
  return $st->fetch() ?: null;
}

/** Create tables + seed the four categories once. Idempotent and cheap to
 *  re-run (SHOW TABLES / count check), so it runs on every request. */
function ensureSchema() {
  static $done = false;
  if ($done) return;
  $done = true;
  db()->exec("CREATE TABLE IF NOT EXISTS forum_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      description VARCHAR(255) NOT NULL DEFAULT '',
      icon VARCHAR(40) NOT NULL DEFAULT 'fa-comments',
      sort_order INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  db()->exec("CREATE TABLE IF NOT EXISTS forum_topics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      user_id INT NOT NULL,
      title VARCHAR(180) NOT NULL,
      created_at DATETIME NOT NULL,
      KEY idx_cat (category_id, id),
      KEY idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  db()->exec("CREATE TABLE IF NOT EXISTS forum_posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      topic_id INT NOT NULL,
      user_id INT NOT NULL,
      body TEXT NOT NULL,
      created_at DATETIME NOT NULL,
      KEY idx_topic (topic_id, id),
      KEY idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  db()->exec("CREATE TABLE IF NOT EXISTS forum_bans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      reason VARCHAR(255) NOT NULL DEFAULT '',
      banned_at DATETIME NOT NULL,
      UNIQUE KEY uq_ban_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $n = (int)db()->query("SELECT COUNT(*) FROM forum_categories")->fetchColumn();
  if ($n === 0) {
    $seed = [
      ['General Discussion', 'General fishing discussions, introductions, and casual conversations.', 'fa-comments', 1],
      ['Fish Identification Help', 'Get help identifying fish species from our community experts.', 'fa-question-circle', 2],
      ['Fishing Locations', 'Share and discover the best fishing spots around the world.', 'fa-map-marker-alt', 3],
      ['Gear & Equipment', 'Discuss fishing gear, equipment reviews, and recommendations.', 'fa-tools', 4],
    ];
    $st = db()->prepare("INSERT INTO forum_categories (name, description, icon, sort_order) VALUES (?,?,?,?)");
    foreach ($seed as $row) $st->execute($row);
  }
}

function displayName($u) {
  if (!empty($u['name'])) return $u['name'];
  return 'Member';
}

/* ====== Forum rules enforcement ======
 * Reject abusive, vulgar or sexual content and obvious link spam before it
 * reaches the database. Two tiers:
 *   1. compact substring match on a normalized string (leet/@/$ stripped,
 *      all separators removed, letters repeated tolerated) — catches
 *      f.u.c.k / sh1t / fuuuck style evasion for unambiguous roots;
 *   2. exact token match for short/ambiguous words (ass, cock, sex…) where a
 *      substring match would hit innocent words like "bass", "peacock" or
 *      "Sussex". Fishing vocabulary must keep working.
 * The offending text is never echoed back — just a pointer to the rules. */
function forumViolation(string $text): ?string {
    $norm = mb_strtolower($text, 'UTF-8');
    $norm = str_replace(["\u{200b}", "\u{200c}", "\u{200d}", "\ufeff"], '', $norm);
    $norm = strtr($norm, [
        '@' => 'a', '4' => 'a', '0' => 'o', '1' => 'i', '!' => 'i',
        '3' => 'e', '5' => 's', '$' => 's', '7' => 't', '+' => 't',
    ]);
    /* strip censor characters (f***ing -> fucking) so censored forms land
     * on the same word boundaries as the real words */
    $norm = str_replace(['*', '#', '^'], '', $norm);

    /* tier 1: unambiguous roots, compact substring with repeat tolerance.
     * Only words with NO innocent English substring use this tier — "penis"
     * and "pussy" live in tier 2 because "open island" / "pussy willow"
     * would false-positive. The fck/cnt/btch-style roots catch censored
     * forms (f*ck, c*nt, b*tch); no real English word contains them. */
    $compact = preg_replace('/[^a-z0-9]+/', '', $norm);
    $roots = [
        'fuck', 'shit', 'cunt', 'bitch', 'bastard', 'wanker', 'handjob',
        'blowjob', 'masturb', 'orgasm', 'porn', 'dildo', 'vagina',
        'slut', 'whore', 'hentai', 'onlyfans', 'viagra',
        'fck', 'cnt', 'btch', 'dck', 'pssy', 'fggt', 'ahole',
    ];
    foreach ($roots as $root) {
        $pat = '/^.*?' . implode('+', str_split($root)) . '+/u';
        if (preg_match($pat, $compact)) return 'abusive, vulgar or sexual content';
    }

    /* tier 2: short/ambiguous words — exact tokens only */
    $tokens = preg_split('/[^a-z0-9]+/', $norm, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $blocked = [
        'ass', 'arse', 'arsehole', 'asshole', 'cock', 'dick', 'dicks',
        'twat', 'wank', 'bollocks', 'anus', 'clit', 'tits', 'sex',
        'nudes', 'fag', 'faggot', 'faget', 'nigger', 'nigga', 'nigguh',
        'retard', 'retarded', 'tranny', 'wetback', 'spic', 'kike',
        'chink', 'coon', 'rape', 'rapes', 'rapist', 'raping',
        'penis', 'pussy', 'anal', 'dumbass',
        // f***ing / sh*t after censor-stripping become single tokens; a compact
        // root would false-positive ("fingers", "ash tree"), an exact token does not
        'fing', 'sht',
    ];
    foreach ($tokens as $t) if (in_array($t, $blocked, true)) return 'abusive, vulgar or sexual content';

    /* link spam: more than 3 URLs reads as advertising */
    if (preg_match_all('#https?://#i', $norm) > 3) return 'spam (too many links)';

    return null;
}

/** Return the active ban row for a user, or null. */
function forumBan(int $userId): ?array {
  $st = db()->prepare("SELECT reason, banned_at FROM forum_bans WHERE user_id=? LIMIT 1");
  $st->execute([$userId]);
  return $st->fetch() ?: null;
}

/* ====== Router ====== */
$action = $_GET['action'] ?? $_POST['action'] ?? 'categories';

try {
  ensureSchema();

  if ($action === 'categories') {
    $rows = db()->query(
      "SELECT c.id, c.name, c.description, c.icon,
              (SELECT COUNT(*) FROM forum_topics t WHERE t.category_id = c.id) AS topics,
              (SELECT COUNT(*) FROM forum_posts p JOIN forum_topics t ON t.id = p.topic_id WHERE t.category_id = c.id) AS posts
       FROM forum_categories c ORDER BY c.sort_order, c.id"
    )->fetchAll();
    j(true, ['categories' => $rows, 'user' => currentUser()]);
  }

  if ($action === 'topics') {
    $cat = (int)($_GET['cat'] ?? 0);
    if ($cat <= 0) j(false, 'Missing category', 422);
    $st = db()->prepare(
      "SELECT t.id, t.title, t.created_at, u.name AS author_name,
              (SELECT COUNT(*) FROM forum_posts p WHERE p.topic_id = t.id) AS replies,
              (SELECT MAX(p2.created_at) FROM forum_posts p2 WHERE p2.topic_id = t.id) AS last_activity
       FROM forum_topics t JOIN users u ON u.id = t.user_id
       WHERE t.category_id = ?
       ORDER BY COALESCE(last_activity, t.created_at) DESC, t.id DESC
       LIMIT 200"
    );
    $st->execute([$cat]);
    j(true, ['topics' => $st->fetchAll()]);
  }

  if ($action === 'posts') {
    $topic = (int)($_GET['topic'] ?? 0);
    if ($topic <= 0) j(false, 'Missing topic', 422);
    // Qualify columns: forum_topics.id and users.id would otherwise make
    // `SELECT id` ambiguous and throw (caught as a generic 500).
    $st = db()->prepare("SELECT t.title FROM forum_topics t WHERE t.id = ? LIMIT 1");
    $st->execute([$topic]);
    $meta = $st->fetch();
    if (!$meta) j(false, 'Topic not found', 404);
    $st = db()->prepare(
      "SELECT p.id, p.body, p.created_at, u.name AS author_name
       FROM forum_posts p JOIN users u ON u.id = p.user_id
       WHERE p.topic_id = ? ORDER BY p.id ASC LIMIT 500"
    );
    $st->execute([$topic]);
    j(true, ['title' => $meta['title'], 'posts' => $st->fetchAll()]);
  }

  if ($action === 'new_topic' || $action === 'reply') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') j(false, 'POST required', 405);
    $u = currentUser();
    if (!$u) j(false, 'Log in to post', 401);

    /* rules enforcement: banned accounts cannot post at all */
    $ban = forumBan((int)$u['id']);
    if ($ban) {
      j(false, 'Your account is banned from posting' . ($ban['reason'] !== '' ? ': ' . $ban['reason'] : '') .
        '. Abuse and neglect of the forum rules result in a ban. Appeals: contact@blueseasfishing.com', 403);
    }

    $body = trim($_POST['body'] ?? '');
    if ($body === '') j(false, 'Post cannot be empty', 422);
    if (mb_strlen($body) > 8000) j(false, 'Post is too long (max 8000 characters)', 422);

    /* rules enforcement: content filter on everything being published */
    $checkTitle = ($action === 'new_topic') ? trim($_POST['title'] ?? '') : '';
    $violation = forumViolation($checkTitle . "\n" . $body);
    if ($violation !== null) {
      j(false, 'Post rejected by the forum rules (' . $violation .
        '). Abusive, vulgar, sexual or spam content is not allowed — edit your message and try again. ' .
        'Repeated violations result in a ban.', 422);
    }

    // Basic flood control: one post per 20 seconds per session.
    $now = time();
    if (isset($_SESSION['forum_last_post']) && ($now - (int)$_SESSION['forum_last_post']) < 20) {
      j(false, 'Please wait a moment before posting again', 429);
    }

    if ($action === 'new_topic') {
      $cat = (int)($_POST['cat'] ?? 0);
      $title = trim($_POST['title'] ?? '');
      if ($cat <= 0) j(false, 'Missing category', 422);
      if (mb_strlen($title) < 3 || mb_strlen($title) > 180) j(false, 'Title must be 3–180 characters', 422);

      db()->beginTransaction();
      $st = db()->prepare("INSERT INTO forum_topics (category_id, user_id, title, created_at) VALUES (?,?,?,NOW())");
      $st->execute([$cat, $u['id'], $title]);
      $tid = (int)db()->lastInsertId();
      $st = db()->prepare("INSERT INTO forum_posts (topic_id, user_id, body, created_at) VALUES (?,?,?,NOW())");
      $st->execute([$tid, $u['id'], $body]);
      db()->commit();
      $_SESSION['forum_last_post'] = $now;
      j(true, ['topic_id' => $tid]);
    }

    $topic = (int)($_POST['topic'] ?? 0);
    if ($topic <= 0) j(false, 'Missing topic', 422);
    $st = db()->prepare("SELECT id FROM forum_topics WHERE id = ? LIMIT 1");
    $st->execute([$topic]);
    if (!$st->fetch()) j(false, 'Topic not found', 404);

    $st = db()->prepare("INSERT INTO forum_posts (topic_id, user_id, body, created_at) VALUES (?,?,?,NOW())");
    $st->execute([$topic, $u['id'], $body]);
    $_SESSION['forum_last_post'] = $now;
    j(true, ['post_id' => (int)db()->lastInsertId()]);
  }

  j(false, 'Unknown action', 400);

} catch (Throwable $e) {
  error_log('Blue Seas forum failure: ' . $e->getMessage());
  j(false, 'Service temporarily unavailable', 500);
}
