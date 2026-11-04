<?php
/** Blue Seas database configuration. Never put the password in this file. */

function bsfPrivateSettings(): array {
    $settings = [
        'host' => getenv('DB_HOST') ?: 'localhost',
        'name' => getenv('DB_NAME') ?: 'sergbcqk_blueseasfishing',
        'user' => getenv('DB_USER') ?: '',
        'password' => getenv('DB_PASS') ?: '',
    ];

    // cPanel's PHP handler may not expose custom environment variables.
    // This optional file lives one directory above the site's document root.
    $privateFile = dirname(__DIR__, 2) . '/.blueseasfishing-secrets.php';
    if (is_file($privateFile)) {
        $private = require $privateFile;
        if (is_array($private)) {
            foreach ($private as $key => $value) {
                if (is_string($key) && is_string($value)) $settings[$key] = $value;
            }
        }
    }

    return $settings;
}

function bsfDbSettings(): array {
    $all = bsfPrivateSettings();
    return array_intersect_key($all, array_flip(['host', 'name', 'user', 'password']));
}

function bsfDb(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $settings = bsfDbSettings();
    if ($settings['user'] === '' || $settings['password'] === '') {
        throw new RuntimeException('Database credentials are not configured');
    }
    $pdo = new PDO(
        'mysql:host=' . $settings['host'] . ';dbname=' . $settings['name'] . ';charset=utf8mb4',
        $settings['user'],
        $settings['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    return $pdo;
}
