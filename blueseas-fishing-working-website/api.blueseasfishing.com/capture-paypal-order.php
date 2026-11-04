<?php
// API endpoint to capture PayPal payment

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
    
    if (!isset($input['order_id']) || !isset($input['paypal_order_id'])) {
        throw new Exception('Order ID and PayPal Order ID are required');
    }
    
    $orderId = $input['order_id'];
    $paypalOrderId = $input['paypal_order_id'];
    
    // Process the payment
    $result = processPayPalPayment($orderId, $paypalOrderId);
    
    echo json_encode($result);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

?>