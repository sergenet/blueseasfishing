<?php
// api/gallery-upload.php — member-only photo/video upload (pending review)

require_once __DIR__ . '/db-config.php';
const ORIGIN  = 'https://www.blueseasfishing.com';

const MAX_IMAGE_BYTES   = 6 * 1024 * 1024;    // 6 MB photo
const MAX_VIDEO_BYTES   = 25 * 1024 * 1024;   // 25 MB clip
const MAX_VIDEO_SECONDS = 15.0;               // hard limit, enforced server-side

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === ORIGIN) {
  header("Access-Control-Allow-Origin: ".ORIGIN);
  header("Vary: Origin");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD']==='OPTIONS'){ http_response_code(204); exit; }
header('Content-Type: application/json; charset=utf-8');

function j($ok,$data=null,$code=200){ http_response_code($code); echo json_encode($ok?['ok'=>true,'data'=>$data]:['ok'=>false,'error'=>$data],JSON_UNESCAPED_SLASHES); exit; }

/* ---- MP4 / MOV helpers -------------------------------------------------
   There is no ffprobe on this host, so the running time is read straight
   from the file's own header: the top-level `moov` atom holds one `mvhd`
   atom with timescale + duration. Phone .mp4 and iPhone .mov both follow
   this layout. Returns null when no usable duration is present (for example
   a fragmented MP4 with an empty movie header). */
function bsfAtomHeader(string $hdr, int $offset, int $fileSize): ?array {
  if (strlen($hdr) < 8) return null;
  $size = unpack('N', substr($hdr, 0, 4))[1];
  $type = substr($hdr, 4, 4);
  $body = $offset + 8;
  if ($size === 1) {                      // 64-bit atom size
    if (strlen($hdr) < 16) return null;
    $hi = unpack('N', substr($hdr, 8, 4))[1];
    $lo = unpack('N', substr($hdr, 12, 4))[1];
    $size = $hi * 4294967296 + $lo;
    $body = $offset + 16;
  } elseif ($size === 0) {                // atom runs to end of file
    $size = $fileSize - $offset;
  }
  return [$size, $type, $body];
}

function bsfParseMvhd(string $buf): ?float {
  if (strlen($buf) < 20) return null;
  $ver = ord($buf[0]);
  if ($ver === 0) {
    $timescale = unpack('N', substr($buf, 12, 4))[1];
    $duration  = unpack('N', substr($buf, 16, 4))[1];
  } elseif ($ver === 1 && strlen($buf) >= 32) {
    $timescale = unpack('N', substr($buf, 20, 4))[1];
    $hi = unpack('N', substr($buf, 24, 4))[1];
    $lo = unpack('N', substr($buf, 28, 4))[1];
    $duration = $hi * 4294967296 + $lo;
  } else {
    return null;
  }
  if ($timescale <= 0 || $duration <= 0) return null;
  return $duration / $timescale;
}

function bsfMvhdFromMoov($fp, int $start, int $end): ?float {
  $offset = $start;
  while ($offset + 8 <= $end) {
    if (fseek($fp, $offset) !== 0) return null;
    $hdr = fread($fp, 16);
    $atom = bsfAtomHeader((string)$hdr, $offset, $end);
    if (!$atom) return null;
    [$size, $type, $body] = $atom;
    if ($size < 8 || $offset + $size > $end) return null;
    if ($type === 'mvhd') {
      if (fseek($fp, $body) !== 0) return null;
      $buf = fread($fp, min(40, $size - ($body - $offset)));
      return bsfParseMvhd((string)$buf);
    }
    $offset += $size;
  }
  return null;
}

function bsfVideoDurationSeconds(string $path): ?float {
  $size = @filesize($path);
  if (!$size) return null;
  $fp = @fopen($path, 'rb');
  if (!$fp) return null;
  $offset = 0;
  $seconds = null;
  while ($offset + 8 <= $size) {
    if (fseek($fp, $offset) !== 0) break;
    $hdr = (string)fread($fp, 16);
    $atom = bsfAtomHeader($hdr, $offset, $size);
    if (!$atom) break;
    [$atomSize, $type, $body] = $atom;
    if ($atomSize < 8) break;
    if ($type === 'moov') {
      $seconds = bsfMvhdFromMoov($fp, $body, $offset + $atomSize);
      break;
    }
    $offset += $atomSize;
  }
  fclose($fp);
  return $seconds;
}

$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off');
session_name('bsf_sess');
session_set_cookie_params(['path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Lax']);
session_start();
if (!isset($_SESSION['uid'])) j(false,'Not logged in',401);
$uid = (int)$_SESSION['uid'];

try{
  $pdo = bsfDb();
} catch(Throwable $e){ j(false,'DB connection failed',500); }

/* The media columns are added by migrate-gallery-media.py. If that has not
   run yet, refuse videos instead of silently storing a row the admin page
   and feed cannot classify. */
$cols = [];
try {
  $st = $pdo->prepare("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gallery_submissions'");
  $st->execute();
  foreach ($st as $r) $cols[strtolower($r['COLUMN_NAME'])] = true;
} catch (Throwable $e) { j(false,'Gallery is unavailable',500); }
$hasMediaCols = isset($cols['media_type']);

$file = $_FILES['image'] ?? null;
if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
  if ($file && in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
    j(false,'File too large for the server',413);
  }
  j(false,'A photo or video is required',422);
}

$species  = trim($_POST['species'] ?? '');
$location = trim($_POST['location'] ?? '');
$caption  = trim($_POST['caption'] ?? '');

$tmp = (string)$file['tmp_name'];
$head = '';
$fh = @fopen($tmp, 'rb');
if ($fh) { $head = (string)fread($fh, 16); fclose($fh); }
$isVideo = strlen($head) >= 12 && substr($head, 4, 4) === 'ftyp';
$nameExt = strtolower(pathinfo((string)($file['name'] ?? ''), PATHINFO_EXTENSION));
$looksVideo = in_array($nameExt, ['mp4', 'mov', 'm4v'], true);
if (!$isVideo && $looksVideo) j(false,'That file is not a readable MP4 or MOV clip',422);

$ym = date('Y/m');
$baseDir = $_SERVER['DOCUMENT_ROOT'].'/uploads/gallery/'.$ym;
if (!is_dir($baseDir)) @mkdir($baseDir, 0755, true);
$basename = bin2hex(random_bytes(8));

$duration = null;
$mediaType = 'image';

if ($isVideo) {
  if (!$hasMediaCols) j(false,'Video uploads are not enabled yet',503);
  if ($file['size'] > MAX_VIDEO_BYTES) j(false,'Video too large (max 25MB)',413);

  $duration = bsfVideoDurationSeconds($tmp);
  if ($duration === null) {
    j(false,'Could not read the video length. Re-save it as a standard MP4 and try again.',422);
  }
  if ($duration > MAX_VIDEO_SECONDS + 0.5) {
    j(false,'Video is ' . number_format($duration, 1) . 's — the limit is 15 seconds',422);
  }

  // Brand at bytes 8-11 tells QuickTime apart from ISO MP4.
  $brand = substr($head, 8, 4);
  $ext = ($brand === 'qt  ') ? 'mov' : 'mp4';
  $fullPath = $baseDir.'/'.$basename.'.'.$ext;
  $thumbPath = $fullPath;                 // no frame extraction available
  $mediaType = 'video';
} else {
  $info = getimagesize($tmp);
  if (!$info) j(false,'Invalid image',422);
  $mime = $info['mime'];
  $ext = ($mime==='image/jpeg'?'jpg':($mime==='image/png'?'png':($mime==='image/webp'?'webp':'')));
  if (!$ext) j(false,'Only JPG, PNG, or WEBP allowed',422);
  if ($file['size'] > MAX_IMAGE_BYTES) j(false,'Image too large (max 6MB)',413);

  $fullPath = $baseDir.'/'.$basename.'.'.$ext;
  $thumbPath= $baseDir.'/'.$basename.'-thumb.'.$ext;
}

if (!move_uploaded_file($tmp, $fullPath)) j(false,'Failed to save the upload',500);

// Create a small thumb (max 640px) — photos only.
if ($mediaType === 'image') {
  try {
    $src = null;
    if ($ext==='jpg') $src = imagecreatefromjpeg($fullPath);
    elseif ($ext==='png') $src = imagecreatefrompng($fullPath);
    elseif ($ext==='webp') $src = imagecreatefromwebp($fullPath);

    if ($src){
      $w = imagesx($src); $h = imagesy($src);
      $max = 640; $scale = min(1, $max/max($w,$h));
      $tw = max(1,(int)($w*$scale)); $th = max(1,(int)($h*$scale));
      $dst = imagecreatetruecolor($tw,$th);
      imagecopyresampled($dst,$src,0,0,0,0,$tw,$th,$w,$h);
      if ($ext==='jpg') imagejpeg($dst,$thumbPath,85);
      elseif ($ext==='png') imagepng($dst,$thumbPath,6);
      elseif ($ext==='webp') imagewebp($dst,$thumbPath,80);
      imagedestroy($dst); imagedestroy($src);
    } else {
      // fallback: no thumb
      $thumbPath = $fullPath;
    }
  } catch(Throwable $e) {
    $thumbPath = $fullPath;
  }
}

$publicFull  = '/uploads/gallery/'.$ym.'/'.$basename.'.'.$ext;
$publicThumb = ($thumbPath === $fullPath)
  ? $publicFull
  : '/uploads/gallery/'.$ym.'/'.$basename.'-thumb.'.$ext;

$dur = ($mediaType === 'video' && $duration !== null) ? (int)round($duration) : null;

try {
  if ($hasMediaCols) {
    $st = $pdo->prepare("INSERT INTO gallery_submissions (user_id,species,caption,location,image_url,thumb_url,media_type,duration_sec,allow_publish,created_at) VALUES (?,?,?,?,?,?,?,?,0,NOW())");
    $st->execute([$uid, $species ?: null, $caption ?: null, $location ?: null, $publicFull, $publicThumb, $mediaType, $dur]);
  } else {
    $st = $pdo->prepare("INSERT INTO gallery_submissions (user_id,species,caption,location,image_url,thumb_url,allow_publish,created_at) VALUES (?,?,?,?,?,?,0,NOW())");
    $st->execute([$uid, $species ?: null, $caption ?: null, $location ?: null, $publicFull, $publicThumb]);
  }
} catch (Throwable $e) {
  @unlink($fullPath);
  if ($thumbPath !== $fullPath) @unlink($thumbPath);
  error_log('Blue Seas gallery upload insert: ' . $e->getMessage());
  j(false,'Could not save the upload',500);
}

j(true, [
  'message' => $mediaType === 'video' ? 'Video uploaded; pending review' : 'Uploaded; pending review',
  'type' => $mediaType,
  'duration' => $dur,
]);
