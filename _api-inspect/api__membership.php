<?php
/** membership.php — simple JSON API for signup/login/logout/me
 *  Drop-in for shared hosting (Namecheap/cPanel). Uses PHP sessions.
 *  Tables used: users (email, password_hash, name, status, created_at, updated_at)
 */

require_once __DIR__ . '/db-config.php';
const ORIGIN  = 'https://www.blueseasfishing.com'; // allow your site

/* ====== CORS / JSON headers ====== */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === ORIGIN) {
  header("Access-Control-Allow-Origin: ".ORIGIN);
  header("Vary: Origin");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
header('Content-Type: application/json; charset=utf-8');

/* ====== Secure session ====== */
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
function db(){
  return bsfDb();
}
function j($ok, $data=null, $status=200){
  http_response_code($status);
  echo json_encode($ok ? ['ok'=>true,'data'=>$data] : ['ok'=>false,'error'=>$data], JSON_UNESCAPED_SLASHES);
  exit;
}
function currentUser(){
  if (!isset($_SESSION['uid'])) return null;
  $st = db()->prepare("SELECT id,email,name,status,created_at,updated_at FROM users WHERE id=? LIMIT 1");
  $st->execute([$_SESSION['uid']]);
  return $st->fetch() ?: null;
}

/* ====== Router ====== */
$action = $_GET['action'] ?? $_POST['action'] ?? 'me';

try {
  if ($action === 'me') {
    $u = currentUser();
    j(true, ['user'=>$u]);
  }

  if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
      $params = session_get_cookie_params();
      setcookie(session_name(), '', time()-42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    j(true, ['message'=>'logged out']);
  }

  if ($action === 'register') {
    $email = strtolower(trim($_POST['email'] ?? ''));
    $pass  = $_POST['password'] ?? '';
    $name  = trim($_POST['name'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) j(false,'Invalid email',422);
    if (strlen($pass) < 8) j(false,'Password must be at least 8 characters',422);

    // Check existing
    $st = db()->prepare("SELECT id FROM users WHERE email=? LIMIT 1");
    $st->execute([$email]);
    if ($st->fetch()) j(false,'Email already registered',409);

    $hash = password_hash($pass, PASSWORD_DEFAULT);
    // The legacy schema requires a unique username even though the public form
    // signs in by email. Generate an opaque internal value instead of asking
    // visitors for another identifier.
    $username = 'member_' . bin2hex(random_bytes(8));
    $st = db()->prepare("INSERT INTO users (username,email,password_hash,name,status,created_at,updated_at) VALUES (?,?,?,?,?,NOW(),NOW())");
    $st->execute([$username,$email,$hash,$name,'member']);
    $_SESSION['uid'] = (int)db()->lastInsertId();

    j(true, ['user'=>currentUser()]);
  }

  if ($action === 'login') {
    $email = strtolower(trim($_POST['email'] ?? ''));
    $pass  = $_POST['password'] ?? '';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) j(false,'Invalid email',422);

    $st = db()->prepare("SELECT id,email,password_hash,name,status FROM users WHERE email=? LIMIT 1");
    $st->execute([$email]);
    $u = $st->fetch();
    if (!$u || !$u['password_hash'] || !password_verify($pass, $u['password_hash'])) {
      j(false,'Wrong email or password',401);
    }
    // Update last login
    db()->prepare("UPDATE users SET last_login_at=NOW(), updated_at=NOW() WHERE id=?")->execute([$u['id']]);

    $_SESSION['uid'] = (int)$u['id'];
    unset($u['password_hash']);
    j(true, ['user'=>$u]);
  }

  j(false,'Unknown action',400);

} catch (Throwable $e) {
  error_log('Blue Seas membership failure: ' . $e->getMessage());
  j(false,'Service temporarily unavailable',500);
}
