<?php
/** Local E2E router for `php -S 127.0.0.1:8088 -t <site> e2e-router.php`.
 *  NOT part of the deployed site (lives outside the webroot).
 *
 *  On the server, /api/*.php sits inside the webroot; locally the real files
 *  live in BASE/api (deploy-site.py excludes api/ from the bundle). This maps
 *  the same URLs onto them so the browser + curl test the production code paths.
 */
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// Cookies: on the box the Host is 127.0.0.1:8088, and membership.php puts
// HTTP_HOST into the session cookie Domain — a port there makes browsers and
// curl drop the cookie. Strip it so login sessions behave like production.
$_SERVER['HTTP_HOST'] = preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? '');

if (preg_match('#^/api/([A-Za-z0-9._-]+\.php)$#', $uri, $m)) {
    $file = __DIR__ . '/api/' . $m[1];
    if (is_file($file)) {
        require $file;
        return true;
    }
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'error' => 'no such api file']);
    return true;
}

// Anything else: let php -S serve it from the site docroot.
return false;
