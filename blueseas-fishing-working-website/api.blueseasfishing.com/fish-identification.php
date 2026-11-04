<?php
// API endpoint for fish identification

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
require_once '../includes/fish-id-functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

session_start();

try {
    // Check if file was uploaded
    if (!isset($_FILES['fish_image'])) {
        throw new Exception('No image file uploaded');
    }
    
    $file = $_FILES['fish_image'];
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    $sessionId = session_id();
    
    // Get metadata from POST data
    $metadata = [
        'location' => $_POST['location'] ?? '',
        'latitude' => $_POST['latitude'] ?? null,
        'longitude' => $_POST['longitude'] ?? null,
        'catch_date' => $_POST['catch_date'] ?? null,
        'fishing_method' => $_POST['fishing_method'] ?? '',
        'water_type' => $_POST['water_type'] ?? null
    ];
    
    // Process the image upload and identification
    $result = processImageUpload($file, $userId, $sessionId, $metadata);
    
    if ($result['success']) {
        // Get recommended gear for identified species
        $recommendations = [];
        if (isset($result['ai_result']['species'])) {
            $speciesId = findSpeciesInDatabase($result['ai_result']['species']);
            if ($speciesId) {
                $recommendations = getRecommendedGearForSpecies($speciesId);
            }
        }
        
        echo json_encode([
            'success' => true,
            'identification_id' => $result['identification_id'],
            'species' => $result['ai_result']['species'],
            'confidence' => $result['ai_result']['confidence'],
            'scientific_name' => $result['ai_result']['scientific_name'],
            'key_features' => $result['ai_result']['key_features'],
            'fishing_tips' => $result['ai_result']['fishing_tips'],
            'recommended_gear' => $recommendations
        ]);
    } else {
        throw new Exception($result['error']);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

?>
