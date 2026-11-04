<?php
/**
 * identify-fish.php — same-origin bridge for the Fish-ID API (added 2026-09-27)
 *
 * WHY THIS EXISTS: Firefox iOS / all iOS browsers run on WebKit, which fails
 * cross-origin multipart uploads to api.blueseasfishing.com with an opaque
 * "Load failed" (TypeError: Load failed). The API itself is fine — the exact
 * same image succeeds via server-side POST. This endpoint accepts the upload
 * on the SAME origin as the page (www.blueseasfishing.com) and forwards it
 * server-side to the Node API at /api/identify-fish. The Node API's JSON
 * response (identifications, quota, display, 429 handling) passes through
 * untouched, so the frontend needs no other changes.
 *
 * Also open to the fish-id widget embedded on partner sites: sends
 * Access-Control-Allow-Origin: * and answers CORS preflights.
 */

// ---- CORS (only matters for cross-origin widget users) ----
// Shared hosting kills PHP at ~30-60s by default; OpenAI vision can take longer.
@set_time_limit(300);
@ignore_user_abort(true);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-BSF-Premium');
    header('Access-Control-Max-Age: 86400');
    http_response_code(204);
    exit;
}

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

function json_out($code, $payload) {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

// ---- Method check ----
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(405, ['success' => false, 'error' => 'POST required.']);
}

// ---- File present? ----
if (empty($_FILES['image']) || !is_array($_FILES['image'])) {
    json_out(400, ['success' => false, 'error' => 'No image file uploaded.']);
}
$f = $_FILES['image'];
if ($f['error'] !== UPLOAD_ERR_OK) {
    json_out(400, ['success' => false, 'error' => 'Upload failed (code ' . (int)$f['error'] . '). Please try again.']);
}
if ($f['size'] > 18 * 1024 * 1024) {
    json_out(413, ['success' => false, 'error' => 'Image is too large. Maximum size is 18 MB.']);
}
if ($f['size'] < 1024) {
    json_out(400, ['success' => false, 'error' => 'Image file looks empty or corrupted.']);
}

// ---- Type check (extension OR sniffed mime; iPad/Firefox send webp) ----
$okExt  = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
$okMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
$ext = strtolower(pathinfo($f['name'] ?? '', PATHINFO_EXTENSION));
$mime = 'application/octet-stream';
if (class_exists('finfo')) {
    $fi = new finfo(FILEINFO_MIME_TYPE);
    $mime = $fi->file($f['tmp_name']) ?: $mime;
}
if (!in_array($mime, $okMime, true) && !in_array($ext, $okExt, true)) {
    json_out(415, ['success' => false, 'error' => 'Unsupported image format. Please use a JPG, PNG, WEBP, or non-animated GIF.']);
}
// If the browser sent a generic mime, normalize it from the extension so the
// Node API's data-URL is correct.
if (!in_array($mime, $okMime, true)) {
    $mime = $ext === 'png' ? 'image/png' : ($ext === 'gif' ? 'image/gif' : ($ext === 'webp' ? 'image/webp' : 'image/jpeg'));
}

// ---- Downscale big photos before forwarding (speeds up OpenAI, avoids proxy timeouts) ----
// Target: max 1600px on the long edge, JPEG q82. Keeps plenty of detail for species ID.
$forwardPath = $f['tmp_name'];
$forwardMime = $mime;
$forwardName = ($f['name'] ?: 'photo.' . ($ext ?: 'jpg'));
if (function_exists('imagecreatetruecolor') && in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
    $src = null;
    if ($mime === 'image/jpeg') { $src = @imagecreatefromjpeg($f['tmp_name']); }
    elseif ($mime === 'image/png') { $src = @imagecreatefrompng($f['tmp_name']); }
    elseif ($mime === 'image/webp') { $src = @imagecreatefromwebp($f['tmp_name']); }
    if ($src) {
        $w = imagesx($src); $h = imagesy($src);
        $maxEdge = 1600;
        if (max($w, $h) > $maxEdge) {
            $scale = $maxEdge / max($w, $h);
            $nw = max(1, (int)round($w * $scale));
            $nh = max(1, (int)round($h * $scale));
            $dst = imagecreatetruecolor($nw, $nh);
            if (in_array($mime, ['image/png', 'image/webp'], true)) {
                imagealphablending($dst, false);
                imagesavealpha($dst, true);
                $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
                imagefilledrectangle($dst, 0, 0, $nw, $nh, $transparent);
            }
            imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
            $tmpOut = tempnam(sys_get_temp_dir(), 'bsfid');
            imagejpeg($dst, $tmpOut, 82);
            if (is_file($tmpOut) && filesize($tmpOut) > 1024 && filesize($tmpOut) < filesize($f['tmp_name']) * 1.2) {
                $forwardPath = $tmpOut;
                $forwardMime = 'image/jpeg';
                $forwardName = preg_replace('/\.[^.]+$/', '', $forwardName) . '.jpg';
            }
            imagedestroy($dst);
        }
        imagedestroy($src);
    }
}

// ---- Forward to the Node API ----
$post = [
    'image'             => new CURLFile($forwardPath, $forwardMime, $forwardName),
    'location'          => isset($_POST['location']) ? (string)$_POST['location'] : '',
    'notes'             => isset($_POST['notes']) ? (string)$_POST['notes'] : '',
    'water_type'        => isset($_POST['water_type']) ? (string)$_POST['water_type'] : '',
    'original_filename' => (string)($f['name'] ?? ''),
];

$headers = ['Expect:']; // avoid LiteSpeed-unfriendly 100-continue
if (!empty($_SERVER['HTTP_X_BSF_PREMIUM'])) {
    $headers[] = 'X-BSF-Premium: ' . $_SERVER['HTTP_X_BSF_PREMIUM'];
}

$ch = curl_init('https://api.blueseasfishing.com/api/identify-fish');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $post,
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_TIMEOUT        => 170, // OpenAI vision can take ~30-60s on big photos
]);
$resp = curl_exec($ch);
$code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err  = curl_error($ch);
curl_close($ch);

if ($resp === false || $code === 0) {
    error_log('identify-fish bridge: curl failed: ' . $err);
    json_out(502, ['success' => false, 'error' => 'Could not reach the identification service. Please try again.']);
}

http_response_code($code >= 200 && $code < 600 ? $code : 502);
echo $resp;
