<?php
// API endpoint to create PayPal order

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
require_once '../setup-paypal.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['order_id'])) {
        throw new Exception('Order ID is required');
    }
    
    $orderId = $input['order_id'];
    
    // Get order details from database
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();
    
    if (!$order) {
        throw new Exception('Order not found');
    }
    
    if ($order['payment_status'] !== 'pending') {
        throw new Exception('Order payment is not pending');
    }
    
    // Create PayPal order
    $paypal = new PayPalIntegration();
    $paypalOrder = $paypal->createOrder($order);
    
    echo json_encode([
        'success' => true,
        'paypal_order_id' => $paypalOrder['id']
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

?>