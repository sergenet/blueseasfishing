<?php
// /api/gallery-feed.php — robust feed with missing-file fallback
error_reporting(0);
ini_set('display_errors','0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/db-config.php';

// A signed-in member also sees their OWN pending uploads (flagged pending),
// so a fresh upload never looks like it vanished. Visitors see published only.
$uid = 0;
if (!empty($_COOKIE['bsf_sess'])) {
  session_name('bsf_sess');
  $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
  session_set_cookie_params(['path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Lax']);
  session_start();
  if (isset($_SESSION['uid'])) $uid = (int)$_SESSION['uid'];
}

// Known-good local image. The old value (/images/fishing_gallery_2.jpg) was a
// 388-byte Facebook redirect stub saved with a .jpg name, so every fallback
// rendered as a broken image.
const FALLBACK_IMG = '/images/community_gallery.png';

function out($ok,$payload,$code=200){
  http_response_code($code);
  echo json_encode($ok ? ['ok'=>true,'data'=>$payload] : ['ok'=>false,'error'=>$payload], JSON_UNESCAPED_SLASHES);
  exit;
}

try {
  $pdo = bsfDb();
} catch (Throwable $e) { out(false,'db_connect_failed',500); }

$hasTable = $pdo->query("SELECT 1 FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = 'gallery_submissions'")->fetchColumn();
if (!$hasTable) out(true, ['items'=>[]]);

// discover columns
$cols = [];
$st = $pdo->prepare("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gallery_submissions'");
$st->execute();
foreach ($st as $r) $cols[strtolower($r['COLUMN_NAME'])] = true;
$has = fn($c)=> isset($cols[strtolower($c)]);

// pick image column
$imageCol = null;
foreach (['thumb_url','image_url','photo_url','image','img_url','file_path','filepath','url'] as $c) {
  if ($has($c)) { $imageCol = $c; break; }
}
if (!$imageCol) out(true, ['items'=>[]]);

$select = ["id", "`$imageCol` AS image_url"];
if ($has('thumb_url'))  $select[] = "thumb_url";
if ($has('species'))    $select[] = "species";
if ($has('caption'))    $select[] = "caption";
if ($has('location'))   $select[] = "location";
if ($has('created_at')) $select[] = "created_at";
if ($has('user_id'))    $select[] = "user_id";
if ($has('media_type')) $select[] = "media_type";
if ($has('duration_sec')) $select[] = "duration_sec";
$where = "1=1";
$selectAllow = $has('allow_publish');
if ($selectAllow) {
  $where .= ($uid > 0 && $has('user_id'))
    ? " AND (allow_publish = 1 OR user_id = " . $uid . ")"
    : " AND allow_publish = 1";
  $select[] = "allow_publish";
}
$order = $has('created_at') ? "created_at DESC" : "id DESC";

$sql = "SELECT ".implode(", ", $select)." FROM gallery_submissions WHERE $where ORDER BY $order LIMIT 200";
$rows = $pdo->query($sql)->fetchAll();

$docroot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/');
$items = [];

foreach ($rows as $r) {
  $r['pending'] = $selectAllow ? empty($r['allow_publish']) : false;
  unset($r['allow_publish']);
  // own uploads get a delete control in the UI
  $r['mine'] = ($uid > 0 && $has('user_id') && (int)$r['user_id'] === $uid);
  unset($r['user_id']);

  $path = (string)($r['image_url'] ?? '');
  $kind = strtolower((string)($r['media_type'] ?? ''));
  if ($kind !== 'video' && preg_match('/\.(mp4|mov|m4v)$/i', $path)) $kind = 'video';
  $r['media_type'] = ($kind === 'video') ? 'video' : 'image';
  $r['duration'] = isset($r['duration_sec']) && $r['duration_sec'] !== null
    ? (int)$r['duration_sec'] : null;
  unset($r['duration_sec']);

  $isLocal = ($path !== '' && $path[0] === '/' && $docroot);
  $abs = $isLocal ? $docroot . $path : '';

  if ($r['media_type'] === 'video') {
    // No poster frame is stored, so thumb_url stays empty for clips.
    $r['thumb_url'] = null;
    // is_file() alone is not enough (0-byte or truncated writes happen), but a
    // clip needs no image check — just confirm there is something to stream.
    if ($isLocal && (!is_file($abs) || filesize($abs) < 1024)) continue;
  } else {
    $img = $r['thumb_url'] ?? $r['image_url'] ?? '';
    // only check local paths that start with /
    if (is_string($img) && strlen($img) && $img[0] === '/' && $docroot) {
      $imgAbs = $docroot.$img;
      // is_file() is not enough: a 0-byte file or an HTML stub saved as .jpg is
      // a "file" but not an image. Require real image bytes.
      if (!is_file($imgAbs) || filesize($imgAbs) < 512 || @getimagesize($imgAbs) === false) {
        $r['image_url'] = $r['thumb_url'] = FALLBACK_IMG;
      }
    }
    if (!isset($r['thumb_url']) || $r['thumb_url'] === '') $r['thumb_url'] = $r['image_url'] ?? FALLBACK_IMG;
  }

  if (!isset($r['species']))   $r['species']   = null;
  if (!isset($r['caption']))   $r['caption']   = null;
  if (!isset($r['location']))  $r['location']  = null;

  $items[] = $r;
}

out(true, ['items'=>$items]);
