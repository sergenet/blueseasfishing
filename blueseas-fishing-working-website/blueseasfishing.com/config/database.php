<?php
// Database configuration for BlueSeasFishing.com
// Modify these settings for your Namecheap hosting environment

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: '');
define('DB_USER', getenv('DB_USER') ?: '');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Site configuration
define('SITE_URL', 'https://blueseasfishing.com');
define('SITE_NAME', 'BlueSeasFishing.com');
define('ADMIN_EMAIL', 'admin@blueseasfishing.com');

// OpenAI API configuration
define('OPENAI_API_KEY', getenv('OPENAI_API_KEY') ?: '');
define('STRIPE_PUBLISHABLE_KEY', getenv('STRIPE_PUBLISHABLE_KEY') ?: '');
define('STRIPE_SECRET_KEY', getenv('STRIPE_SECRET_KEY') ?: '');
define('STRIPE_WEBHOOK_SECRET', getenv('STRIPE_WEBHOOK_SECRET') ?: '');
define('PAYPAL_CLIENT_ID', getenv('PAYPAL_CLIENT_ID') ?: '');
define('PAYPAL_CLIENT_SECRET', getenv('PAYPAL_CLIENT_SECRET') ?: '');
define('PAYPAL_ENVIRONMENT', getenv('PAYPAL_ENVIRONMENT') ?: 'production');


// Payment settings
define('CURRENCY', 'usd');
define('FREE_SHIPPING_THRESHOLD', 75.00);

// Upload directories
define('UPLOAD_DIR', 'uploads/');
define('GALLERY_DIR', 'uploads/gallery/');
define('BLOG_IMAGES_DIR', 'uploads/blog/');
define('PROFILE_IMAGES_DIR', 'uploads/profiles/');

// Security settings
define('SESSION_LIFETIME', 3600 * 24 * 30); // 30 days
define('BCRYPT_COST', 12);

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    error_log('Database connection failed: ' . $e->getMessage());
    die('Database connection failed. Please try again later.');
}

// Initialize session configuration ONLY if session is not active
if (session_status() == PHP_SESSION_NONE) {
    ini_set('session.cookie_lifetime', SESSION_LIFETIME);
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_secure', 1);
    ini_set('session.use_strict_mode', 1);
}
?>
