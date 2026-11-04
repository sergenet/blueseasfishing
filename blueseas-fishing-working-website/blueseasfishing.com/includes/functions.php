<?php
// Core functions for BlueSeasFishing.com

// Include fish identification functions
require_once __DIR__ . '/fish-id-functions.php';

// User authentication functions
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit;
    }
}

function isAdmin() {
    return isLoggedIn() && isset($_SESSION['is_admin']) && $_SESSION['is_admin'];
}

function getCurrentUser() {
    global $pdo;
    if (!isLoggedIn()) return null;
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch();
}

function loginUser($user) {
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['is_admin'] = $user['is_admin'];
    $_SESSION['full_name'] = $user['full_name'];
}

function logoutUser() {
    session_destroy();
    header('Location: index.php');
    exit;
}

// Blog functions
function getFeaturedBlogPosts($limit = 3) {
    global $pdo;
    $stmt = $pdo->prepare("
        SELECT p.*, u.full_name as author_name, u.username 
        FROM blog_posts p 
        LEFT JOIN users u ON p.author_id = u.id 
        WHERE p.status = 'published' AND p.is_featured = 1 
        ORDER BY p.published_at DESC 
        LIMIT ?
    ");
    $stmt->execute([$limit]);
    return $stmt->fetchAll();
}

function getRecentBlogPosts($limit = 10, $category = null) {
    global $pdo;
    $sql = "
        SELECT p.*, u.full_name as author_name, u.username 
        FROM blog_posts p 
        LEFT JOIN users u ON p.author_id = u.id 
        WHERE p.status = 'published'
    ";
    $params = [];
    
    if ($category) {
        $sql .= " AND p.category = ?";
        $params[] = $category;
    }
    
    $sql .= " ORDER BY p.published_at DESC LIMIT ?";
    $params[] = $limit;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function getBlogPost($slug) {
    global $pdo;
    $stmt = $pdo->prepare("
        SELECT p.*, u.full_name as author_name, u.username, u.avatar_url as author_avatar 
        FROM blog_posts p 
        LEFT JOIN users u ON p.author_id = u.id 
        WHERE p.slug = ? AND p.status = 'published'
    ");
    $stmt->execute([$slug]);
    $post = $stmt->fetch();
    
    if ($post) {
        // Increment view count
        $stmt = $pdo->prepare("UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?");
        $stmt->execute([$post['id']]);
    }
    
    return $post;
}

function renderFeaturedPost($post) {
    $excerpt = $post['excerpt'] ?: substr(strip_tags($post['content']), 0, 150) . '...';
    $image = $post['featured_image'] ?: 'assets/images/default-post.jpg';
    $date = date('F j, Y', strtotime($post['published_at']));
    
    return "
    <article class='featured-post'>
        <div class='post-image'>
            <img src='{$image}' alt='{$post['title']}' loading='lazy'>
            <div class='post-category'>{$post['category']}</div>
        </div>
        <div class='post-content'>
            <h3><a href='blog-post.php?slug={$post['slug']}'>{$post['title']}</a></h3>
            <p class='post-excerpt'>{$excerpt}</p>
            <div class='post-meta'>
                <span class='author'>By {$post['author_name']}</span>
                <span class='date'>{$date}</span>
                <span class='views'>{$post['view_count']} views</span>
            </div>
        </div>
    </article>
    ";
}

// Gallery functions
function getRecentGalleryImages($limit = 6) {
    global $pdo;
    $stmt = $pdo->prepare("
        SELECT g.*, u.username, u.full_name 
        FROM gallery_images g 
        LEFT JOIN users u ON g.user_id = u.id 
        WHERE g.status = 'approved' 
        ORDER BY g.created_at DESC 
        LIMIT ?
    ");
    $stmt->execute([$limit]);
    return $stmt->fetchAll();
}

function renderGalleryPreview($image) {
    $title = htmlspecialchars($image['title']);
    $description = $image['description'] ? substr(htmlspecialchars($image['description']), 0, 100) . '...' : '';
    $thumbnail = $image['thumbnail_url'] ?: $image['image_url'];
    
    return "
    <div class='gallery-item'>
        <img src='{$thumbnail}' alt='{$title}' loading='lazy'>
        <div class='gallery-overlay'>
            <h4>{$title}</h4>
            <p>{$description}</p>
            <span class='author'>By {$image['full_name']}</span>
        </div>
    </div>
    ";
}

// Forum functions
function getForumCategories() {
    global $pdo;
    $stmt = $pdo->prepare("
        SELECT c.*, 
               COUNT(t.id) as topic_count,
               MAX(t.last_reply_at) as last_activity
        FROM forum_categories c 
        LEFT JOIN forum_topics t ON c.id = t.category_id 
        WHERE c.is_active = 1 
        GROUP BY c.id 
        ORDER BY c.sort_order
    ");
    $stmt->execute();
    return $stmt->fetchAll();
}

function getRecentForumTopics($limit = 5) {
    global $pdo;
    $stmt = $pdo->prepare("
        SELECT t.*, u.username, u.full_name, c.name as category_name
        FROM forum_topics t 
        LEFT JOIN users u ON t.user_id = u.id 
        LEFT JOIN forum_categories c ON t.category_id = c.id 
        ORDER BY t.created_at DESC 
        LIMIT ?
    ");
    $stmt->execute([$limit]);
    return $stmt->fetchAll();
}

// Utility functions
function generateSlug($string) {
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $string), '-'));
    return substr($slug, 0, 100);
}

function uploadImage($file, $directory, $max_size = 5242880) { // 5MB default
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Upload failed with error code: ' . $file['error']);
    }
    
    if ($file['size'] > $max_size) {
        throw new Exception('File size exceeds maximum allowed size.');
    }
    
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowed_types)) {
        throw new Exception('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
    }
    
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '.' . $extension;
    $filepath = $directory . $filename;
    
    if (!is_dir($directory)) {
        mkdir($directory, 0755, true);
    }
    
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        return $filename;
    } else {
        throw new Exception('Failed to move uploaded file.');
    }
}

function createThumbnail($source, $destination, $width = 300, $height = 300) {
    $info = getimagesize($source);
    if (!$info) return false;
    
    $mime = $info['mime'];
    
    switch ($mime) {
        case 'image/jpeg':
            $image = imagecreatefromjpeg($source);
            break;
        case 'image/png':
            $image = imagecreatefrompng($source);
            break;
        case 'image/gif':
            $image = imagecreatefromgif($source);
            break;
        case 'image/webp':
            $image = imagecreatefromwebp($source);
            break;
        default:
            return false;
    }
    
    $thumb = imagecreatetruecolor($width, $height);
    imagecopyresampled($thumb, $image, 0, 0, 0, 0, $width, $height, imagesx($image), imagesy($image));
    
    imagejpeg($thumb, $destination, 90);
    imagedestroy($image);
    imagedestroy($thumb);
    
    return true;
}

// OpenAI Integration
function generateBlogContent($topic, $category = 'tips') {
    $api_key = OPENAI_API_KEY;
    if (empty($api_key) || $api_key === 'your_openai_api_key_here') {
        throw new Exception('OpenAI API key not configured.');
    }
    
    $prompt = "Write a comprehensive fishing blog post about: {$topic}. 
    The post should be engaging, informative, and include practical tips for anglers. 
    Format it with proper headings and structure. 
    Target audience: fishing enthusiasts of all skill levels. 
    Category: {$category}. 
    Length: approximately 800-1200 words.";
    
    $data = [
        'model' => 'gpt-3.5-turbo',
        'messages' => [
            [
                'role' => 'system',
                'content' => 'You are an expert fishing writer and angler with decades of experience. Write engaging, informative fishing content.'
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ],
        'max_tokens' => 2000,
        'temperature' => 0.7
    ];
    
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => 'https://api.openai.com/v1/chat/completions',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $api_key
        ]
    ]);
    
    $response = curl_exec($curl);
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    
    if ($http_code !== 200) {
        throw new Exception('OpenAI API request failed with status: ' . $http_code);
    }
    
    $result = json_decode($response, true);
    if (!isset($result['choices'][0]['message']['content'])) {
        throw new Exception('Invalid response from OpenAI API.');
    }
    
    return $result['choices'][0]['message']['content'];
}

// Security functions
function sanitizeInput($input) {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validateCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// Pagination helper
function paginate($total_items, $items_per_page, $current_page) {
    $total_pages = ceil($total_items / $items_per_page);
    $current_page = max(1, min($current_page, $total_pages));
    $offset = ($current_page - 1) * $items_per_page;
    
    return [
        'total_pages' => $total_pages,
        'current_page' => $current_page,
        'offset' => $offset,
        'items_per_page' => $items_per_page
    ];
}

// E-commerce Functions

// Shopping Cart Functions
function initializeCart() {
    if (!isset($_SESSION['cart'])) {
        $_SESSION['cart'] = [];
    }
}

function addToCart($productId, $quantity = 1) {
    global $pdo;
    initializeCart();
    
    // Get product details
    $stmt = $pdo->prepare("SELECT * FROM shop_products WHERE id = ? AND status = 'active'");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    
    if (!$product) {
        throw new Exception('Product not found.');
    }
    
    // Check stock availability
    if ($product['stock_quantity'] < $quantity) {
        throw new Exception('Not enough stock available.');
    }
    
    // Add or update cart item
    if (isset($_SESSION['cart'][$productId])) {
        $newQuantity = $_SESSION['cart'][$productId] + $quantity;
        if ($newQuantity > $product['stock_quantity']) {
            throw new Exception('Not enough stock available.');
        }
        $_SESSION['cart'][$productId] = $newQuantity;
    } else {
        $_SESSION['cart'][$productId] = $quantity;
    }
    
    return [
        'message' => 'Product added to cart successfully.',
        'cart_count' => getCartCount(),
        'cart_total' => getCartSubtotal()
    ];
}

function updateCartItem($productId, $quantity) {
    global $pdo;
    initializeCart();
    
    if ($quantity <= 0) {
        return removeFromCart($productId);
    }
    
    // Get product to check stock
    $stmt = $pdo->prepare("SELECT stock_quantity FROM shop_products WHERE id = ? AND status = 'active'");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    
    if (!$product) {
        throw new Exception('Product not found.');
    }
    
    if ($quantity > $product['stock_quantity']) {
        throw new Exception('Not enough stock available.');
    }
    
    $_SESSION['cart'][$productId] = $quantity;
    
    return [
        'message' => 'Cart updated successfully.',
        'cart_count' => getCartCount(),
        'cart_total' => getCartSubtotal()
    ];
}

function removeFromCart($productId) {
    initializeCart();
    
    if (isset($_SESSION['cart'][$productId])) {
        unset($_SESSION['cart'][$productId]);
    }
    
    return [
        'message' => 'Product removed from cart.',
        'cart_count' => getCartCount(),
        'cart_total' => getCartSubtotal()
    ];
}

function clearCart() {
    $_SESSION['cart'] = [];
    unset($_SESSION['coupon_code']);
    unset($_SESSION['coupon_discount']);
}

function getCartContents() {
    global $pdo;
    initializeCart();
    
    if (empty($_SESSION['cart'])) {
        return [];
    }
    
    $productIds = array_keys($_SESSION['cart']);
    $placeholders = str_repeat('?,', count($productIds) - 1) . '?';
    
    $stmt = $pdo->prepare("
        SELECT * FROM shop_products 
        WHERE id IN ($placeholders) AND status = 'active'
    ");
    $stmt->execute($productIds);
    $products = $stmt->fetchAll();
    
    $cartItems = [];
    foreach ($products as $product) {
        $quantity = $_SESSION['cart'][$product['id']];
        $price = $product['is_on_sale'] && $product['sale_price'] ? $product['sale_price'] : $product['price'];
        
        $cartItems[] = [
            'product_id' => $product['id'],
            'name' => $product['name'],
            'slug' => $product['slug'],
            'price' => $product['price'],
            'sale_price' => $product['sale_price'],
            'is_on_sale' => $product['is_on_sale'],
            'featured_image' => $product['featured_image'],
            'brand' => $product['brand'],
            'sku' => $product['sku'],
            'stock_quantity' => $product['stock_quantity'],
            'quantity' => $quantity,
            'line_total' => $price * $quantity
        ];
    }
    
    return $cartItems;
}

function getCartCount() {
    initializeCart();
    return array_sum($_SESSION['cart']);
}

function getCartSubtotal() {
    $cartItems = getCartContents();
    $subtotal = 0;
    
    foreach ($cartItems as $item) {
        $subtotal += $item['line_total'];
    }
    
    return $subtotal;
}

function calculateCartTotal($cartItems = null) {
    if ($cartItems === null) {
        $cartItems = getCartContents();
    }
    
    $subtotal = 0;
    foreach ($cartItems as $item) {
        $subtotal += $item['line_total'];
    }
    
    // Apply coupon discount
    $discount = 0;
    $couponCode = $_SESSION['coupon_code'] ?? '';
    if ($couponCode && isset($_SESSION['coupon_discount'])) {
        $discount = $_SESSION['coupon_discount'];
    }
    
    // Calculate tax (8.5% default)
    $taxRate = 0.085;
    $taxableAmount = $subtotal - $discount;
    $tax = $taxableAmount * $taxRate;
    
    // Calculate shipping
    $shipping = calculateShipping($subtotal);
    
    $total = $subtotal - $discount + $tax + $shipping;
    
    return [
        'subtotal' => $subtotal,
        'discount' => $discount,
        'coupon_code' => $couponCode,
        'tax' => $tax,
        'tax_rate' => $taxRate,
        'shipping' => $shipping,
        'total' => $total
    ];
}

function calculateShipping($subtotal) {
    // Free shipping over $75
    if ($subtotal >= 75) {
        return 0;
    }
    
    // Standard shipping rates
    if ($subtotal >= 50) {
        return 5.99;
    } elseif ($subtotal >= 25) {
        return 8.99;
    } else {
        return 12.99;
    }
}

function getShippingRates($subtotal) {
    $rates = [];
    
    if ($subtotal >= 75) {
        $rates[] = [
            'id' => 1,
            'name' => 'Free Shipping',
            'description' => 'Standard delivery (5-7 business days)',
            'cost' => 0,
            'estimated_days' => '5-7'
        ];
    } else {
        $rates[] = [
            'id' => 2,
            'name' => 'Standard Shipping',
            'description' => 'Standard delivery (5-7 business days)',
            'cost' => calculateShipping($subtotal),
            'estimated_days' => '5-7'
        ];
        
        $rates[] = [
            'id' => 3,
            'name' => 'Express Shipping',
            'description' => 'Express delivery (2-3 business days)',
            'cost' => calculateShipping($subtotal) + 10,
            'estimated_days' => '2-3'
        ];
        
        $rates[] = [
            'id' => 4,
            'name' => 'Next Day Shipping',
            'description' => 'Next business day delivery',
            'cost' => calculateShipping($subtotal) + 25,
            'estimated_days' => '1'
        ];
    }
    
    return $rates;
}

// Coupon Functions
function applyCoupon($code) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT * FROM shop_coupons 
        WHERE code = ? AND is_active = 1 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (usage_limit IS NULL OR usage_count < usage_limit)
    ");
    $stmt->execute([strtoupper($code)]);
    $coupon = $stmt->fetch();
    
    if (!$coupon) {
        throw new Exception('Invalid or expired coupon code.');
    }
    
    $subtotal = getCartSubtotal();
    
    // Check minimum order amount
    if ($coupon['minimum_amount'] && $subtotal < $coupon['minimum_amount']) {
        throw new Exception('Minimum order amount of $' . number_format($coupon['minimum_amount'], 2) . ' required for this coupon.');
    }
    
    // Calculate discount
    $discount = 0;
    if ($coupon['discount_type'] === 'percentage') {
        $discount = ($subtotal * $coupon['discount_amount']) / 100;
        if ($coupon['maximum_discount_amount'] && $discount > $coupon['maximum_discount_amount']) {
            $discount = $coupon['maximum_discount_amount'];
        }
    } else {
        $discount = $coupon['discount_amount'];
    }
    
    // Don't allow discount to exceed subtotal
    $discount = min($discount, $subtotal);
    
    $_SESSION['coupon_code'] = $coupon['code'];
    $_SESSION['coupon_discount'] = $discount;
    
    return [
        'message' => 'Coupon applied successfully!',
        'discount' => $discount,
        'code' => $coupon['code']
    ];
}

function removeCoupon() {
    unset($_SESSION['coupon_code']);
    unset($_SESSION['coupon_discount']);
    
    return ['message' => 'Coupon removed successfully.'];
}

// Order Functions
function createOrder($orderData, $cartItems, $cartTotal) {
    global $pdo;
    
    $pdo->beginTransaction();
    
    try {
        // Create order record
        $stmt = $pdo->prepare("
            INSERT INTO shop_orders (
                user_id, order_number, status, 
                shipping_first_name, shipping_last_name, shipping_email, shipping_phone,
                shipping_address_line1, shipping_address_line2, shipping_city, 
                shipping_state, shipping_postal_code, shipping_country,
                billing_first_name, billing_last_name, 
                billing_address_line1, billing_address_line2, billing_city,
                billing_state, billing_postal_code, billing_country,
                subtotal, discount_amount, tax_amount, shipping_amount, total_amount,
                coupon_code, payment_method, notes, created_at
            ) VALUES (
                ?, ?, 'pending',
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, NOW()
            )
        ");
        
        $orderNumber = 'BSF-' . date('Ymd') . '-' . rand(1000, 9999);
        $userId = isLoggedIn() ? $_SESSION['user_id'] : null;
        
        // Use shipping for billing if same_as_shipping is checked
        if ($orderData['same_as_shipping']) {
            $orderData['billing_first_name'] = $orderData['shipping_first_name'];
            $orderData['billing_last_name'] = $orderData['shipping_last_name'];
            $orderData['billing_address_line1'] = $orderData['shipping_address_line1'];
            $orderData['billing_address_line2'] = $orderData['shipping_address_line2'];
            $orderData['billing_city'] = $orderData['shipping_city'];
            $orderData['billing_state'] = $orderData['shipping_state'];
            $orderData['billing_postal_code'] = $orderData['shipping_postal_code'];
            $orderData['billing_country'] = $orderData['shipping_country'];
        }
        
        $stmt->execute([
            $userId, $orderNumber,
            $orderData['shipping_first_name'], $orderData['shipping_last_name'], 
            $orderData['shipping_email'], $orderData['shipping_phone'],
            $orderData['shipping_address_line1'], $orderData['shipping_address_line2'], 
            $orderData['shipping_city'], $orderData['shipping_state'], 
            $orderData['shipping_postal_code'], $orderData['shipping_country'],
            $orderData['billing_first_name'] ?? '', $orderData['billing_last_name'] ?? '',
            $orderData['billing_address_line1'] ?? '', $orderData['billing_address_line2'] ?? '',
            $orderData['billing_city'] ?? '', $orderData['billing_state'] ?? '',
            $orderData['billing_postal_code'] ?? '', $orderData['billing_country'] ?? '',
            $cartTotal['subtotal'], $cartTotal['discount'], $cartTotal['tax'],
            $cartTotal['shipping'], $cartTotal['total'],
            $cartTotal['coupon_code'] ?? null, $orderData['payment_method'],
            $orderData['notes']
        ]);
        
        $orderId = $pdo->lastInsertId();
        
        // Create order items
        $stmt = $pdo->prepare("
            INSERT INTO shop_order_items (
                order_id, product_id, product_name, product_sku, 
                quantity, unit_price, total_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($cartItems as $item) {
            $unitPrice = $item['is_on_sale'] && $item['sale_price'] ? $item['sale_price'] : $item['price'];
            
            $stmt->execute([
                $orderId, $item['product_id'], $item['name'], $item['sku'],
                $item['quantity'], $unitPrice, $item['line_total']
            ]);
            
            // Update product stock
            $updateStock = $pdo->prepare("
                UPDATE shop_products 
                SET stock_quantity = stock_quantity - ?, 
                    sold_quantity = sold_quantity + ?
                WHERE id = ?
            ");
            $updateStock->execute([$item['quantity'], $item['quantity'], $item['product_id']]);
        }
        
        // Update coupon usage if applicable
        if (!empty($cartTotal['coupon_code'])) {
            $updateCoupon = $pdo->prepare("
                UPDATE shop_coupons 
                SET usage_count = usage_count + 1 
                WHERE code = ?
            ");
            $updateCoupon->execute([$cartTotal['coupon_code']]);
        }
        
        $pdo->commit();
        
        // Clear cart after successful order
        clearCart();
        
        return $orderId;
        
    } catch (Exception $e) {
        $pdo->rollback();
        throw $e;
    }
}

function getOrder($orderId) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT o.*, 
               GROUP_CONCAT(
                   CONCAT(oi.product_name, ' (', oi.quantity, 'x $', oi.unit_price, ')') 
                   SEPARATOR ', '
               ) as items_summary
        FROM shop_orders o
        LEFT JOIN shop_order_items oi ON o.id = oi.order_id
        WHERE o.id = ?
        GROUP BY o.id
    ");
    $stmt->execute([$orderId]);
    return $stmt->fetch();
}

function getOrderItems($orderId) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT oi.*, p.featured_image, p.slug
        FROM shop_order_items oi
        LEFT JOIN shop_products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
        ORDER BY oi.id
    ");
    $stmt->execute([$orderId]);
    return $stmt->fetchAll();
}

// Stripe Payment Integration
function createStripePaymentSession($orderId) {
    require_once 'vendor/stripe/stripe-php/init.php';
    
    $order = getOrder($orderId);
    $orderItems = getOrderItems($orderId);
    
    if (!$order) {
        throw new Exception('Order not found.');
    }
    
    // Set Stripe secret key
    \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
    
    // Prepare line items for Stripe
    $lineItems = [];
    foreach ($orderItems as $item) {
        $lineItems[] = [
            'price_data' => [
                'currency' => 'usd',
                'product_data' => [
                    'name' => $item['product_name'],
                    'images' => $item['featured_image'] ? [getAbsoluteUrl($item['featured_image'])] : [],
                ],
                'unit_amount' => intval($item['unit_price'] * 100), // Convert to cents
            ],
            'quantity' => $item['quantity'],
        ];
    }
    
    // Add shipping as separate line item if applicable
    if ($order['shipping_amount'] > 0) {
        $lineItems[] = [
            'price_data' => [
                'currency' => 'usd',
                'product_data' => [
                    'name' => 'Shipping',
                ],
                'unit_amount' => intval($order['shipping_amount'] * 100),
            ],
            'quantity' => 1,
        ];
    }
    
    // Add tax as separate line item
    if ($order['tax_amount'] > 0) {
        $lineItems[] = [
            'price_data' => [
                'currency' => 'usd',
                'product_data' => [
                    'name' => 'Tax',
                ],
                'unit_amount' => intval($order['tax_amount'] * 100),
            ],
            'quantity' => 1,
        ];
    }
    
    // Apply discount if applicable
    $discounts = [];
    if ($order['discount_amount'] > 0 && $order['coupon_code']) {
        // Create a coupon in Stripe for the discount
        $coupon = \Stripe\Coupon::create([
            'amount_off' => intval($order['discount_amount'] * 100),
            'currency' => 'usd',
            'duration' => 'once',
            'name' => $order['coupon_code'],
        ]);
        
        $discounts[] = [
            'coupon' => $coupon->id,
        ];
    }
    
    $sessionData = [
        'payment_method_types' => ['card'],
        'line_items' => $lineItems,
        'mode' => 'payment',
        'success_url' => getAbsoluteUrl('payment-success.php?session_id={CHECKOUT_SESSION_ID}&order_id=' . $orderId),
        'cancel_url' => getAbsoluteUrl('payment-cancel.php?order_id=' . $orderId),
        'customer_email' => $order['shipping_email'],
        'metadata' => [
            'order_id' => $orderId,
            'order_number' => $order['order_number'],
        ],
        'shipping_address_collection' => [
            'allowed_countries' => ['US', 'CA'],
        ],
    ];
    
    if (!empty($discounts)) {
        $sessionData['discounts'] = $discounts;
    }
    
    try {
        $session = \Stripe\Checkout\Session::create($sessionData);
        
        // Update order with Stripe session ID
        $stmt = $pdo->prepare("
            UPDATE shop_orders 
            SET stripe_session_id = ?, payment_intent_id = ?
            WHERE id = ?
        ");
        $stmt->execute([$session->id, $session->payment_intent, $orderId]);
        
        return $session->url;
        
    } catch (\Stripe\Exception\CardException $e) {
        throw new Exception('Payment failed: ' . $e->getError()->message);
    } catch (\Stripe\Exception\RateLimitException $e) {
        throw new Exception('Too many requests made to the API too quickly');
    } catch (\Stripe\Exception\InvalidRequestException $e) {
        throw new Exception('Invalid parameters: ' . $e->getError()->message);
    } catch (\Stripe\Exception\AuthenticationException $e) {
        throw new Exception('Authentication with Stripe\'s API failed');
    } catch (\Stripe\Exception\ApiConnectionException $e) {
        throw new Exception('Network communication with Stripe failed');
    } catch (\Stripe\Exception\ApiErrorException $e) {
        throw new Exception('Stripe API error: ' . $e->getError()->message);
    } catch (Exception $e) {
        throw new Exception('An error occurred: ' . $e->getMessage());
    }
}

function handleStripeWebhook($payload, $signature) {
    global $pdo;
    
    require_once 'vendor/stripe/stripe-php/init.php';
    
    \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
    
    try {
        $event = \Stripe\Webhook::constructEvent(
            $payload, $signature, STRIPE_WEBHOOK_SECRET
        );
    } catch (\UnexpectedValueException $e) {
        throw new Exception('Invalid payload');
    } catch (\Stripe\Exception\SignatureVerificationException $e) {
        throw new Exception('Invalid signature');
    }
    
    // Handle the event
    switch ($event->type) {
        case 'checkout.session.completed':
            $session = $event->data->object;
            $orderId = $session->metadata->order_id;
            
            // Update order status to paid
            $stmt = $pdo->prepare("
                UPDATE shop_orders 
                SET status = 'paid', payment_intent_id = ?, paid_at = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([$session->payment_intent, $orderId]);
            
            // Send confirmation email (implement as needed)
            // sendOrderConfirmationEmail($orderId);
            
            break;
            
        case 'payment_intent.payment_failed':
            $paymentIntent = $event->data->object;
            
            // Find order by payment intent and update status
            $stmt = $pdo->prepare("
                UPDATE shop_orders 
                SET status = 'failed' 
                WHERE payment_intent_id = ?
            ");
            $stmt->execute([$paymentIntent->id]);
            
            break;
            
        default:
            // Handle other event types as needed
            error_log('Unhandled Stripe webhook event: ' . $event->type);
    }
    
    return true;
}

// Product Functions
function getFeaturedProducts($limit = 8) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT * FROM shop_products 
        WHERE status = 'active' AND is_featured = 1 
        ORDER BY created_at DESC 
        LIMIT ?
    ");
    $stmt->execute([$limit]);
    return $stmt->fetchAll();
}

function getProductBySlug($slug) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT * FROM shop_products 
        WHERE slug = ? AND status = 'active'
    ");
    $stmt->execute([$slug]);
    return $stmt->fetch();
}

function getRelatedProducts($productId, $category, $limit = 4) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT * FROM shop_products 
        WHERE id != ? AND category = ? AND status = 'active' 
        ORDER BY RAND() 
        LIMIT ?
    ");
    $stmt->execute([$productId, $category, $limit]);
    return $stmt->fetchAll();
}

// Helper Functions
function getAbsoluteUrl($relativePath) {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    return $protocol . '://' . $host . '/' . ltrim($relativePath, '/');
}

function formatPrice($price, $currency = '$') {
    return $currency . number_format($price, 2);
}

function getProductImageUrl($product, $size = 'medium') {
    if (empty($product['featured_image'])) {
        return 'assets/images/default-product.jpg';
    }
    
    // If you have different image sizes, implement logic here
    // For now, return the original image
    return $product['featured_image'];
}

// Admin Functions for Shop Management
function getOrderStatistics() {
    global $pdo;
    
    $stats = [];
    
    // Total orders
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM shop_orders");
    $stmt->execute();
    $stats['total_orders'] = $stmt->fetchColumn();
    
    // Total revenue
    $stmt = $pdo->prepare("SELECT SUM(total_amount) FROM shop_orders WHERE status IN ('paid', 'completed')");
    $stmt->execute();
    $stats['total_revenue'] = $stmt->fetchColumn() ?: 0;
    
    // Orders this month
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM shop_orders 
        WHERE MONTH(created_at) = MONTH(CURDATE()) 
        AND YEAR(created_at) = YEAR(CURDATE())
    ");
    $stmt->execute();
    $stats['orders_this_month'] = $stmt->fetchColumn();
    
    // Revenue this month
    $stmt = $pdo->prepare("
        SELECT SUM(total_amount) FROM shop_orders 
        WHERE MONTH(created_at) = MONTH(CURDATE()) 
        AND YEAR(created_at) = YEAR(CURDATE())
        AND status IN ('paid', 'completed')
    ");
    $stmt->execute();
    $stats['revenue_this_month'] = $stmt->fetchColumn() ?: 0;
    
    return $stats;
}

function getPopularProducts($limit = 10) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT p.*, COALESCE(SUM(oi.quantity), 0) as total_sold
        FROM shop_products p
        LEFT JOIN shop_order_items oi ON p.id = oi.product_id
        LEFT JOIN shop_orders o ON oi.order_id = o.id
        WHERE p.status = 'active' 
        AND (o.status IS NULL OR o.status IN ('paid', 'completed'))
        GROUP BY p.id
        ORDER BY total_sold DESC, p.created_at DESC
        LIMIT ?
    ");
    $stmt->execute([$limit]);
    return $stmt->fetchAll();
}

?>
