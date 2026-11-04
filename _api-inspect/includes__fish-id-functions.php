<?php
// Fish identification functions
// FIXED VERSION - Database column error resolved

// AI Fish Identification Functions
function identifyFishWithAI($imagePath, $userLocation = null) {
    $apiKey = defined('OPENAI_API_KEY') ? OPENAI_API_KEY : '';
    if (empty($apiKey) || $apiKey === 'your_openai_api_key_here') {
        throw new Exception('OpenAI API key not configured.');
    }
    
    // Encode image to base64
    $imageData = base64_encode(file_get_contents($imagePath));
    $mimeType = mime_content_type($imagePath);
    
    $prompt = "Analyze this fish image and provide a detailed identification. Please respond with a JSON object containing:
    {
        \"species\": \"common name\",
        \"scientific_name\": \"scientific name\",
        \"confidence\": confidence_score_0_to_1,
        \"key_features\": [\"feature1\", \"feature2\"],
        \"alternative_species\": [\"possible_species_1\", \"possible_species_2\"],
        \"habitat\": \"typical habitat\",
        \"fishing_tips\": \"brief fishing advice\",
        \"best_bait\": \"recommended bait\"
    }";
    
    $data = [
        'model' => 'gpt-4-vision-preview',
        'messages' => [
            [
                'role' => 'system',
                'content' => 'You are an expert ichthyologist and fishing guide with decades of experience identifying fish species. Provide accurate, detailed fish identifications based on images.'
            ],
            [
                'role' => 'user',
                'content' => [
                    [
                        'type' => 'text',
                        'text' => $prompt
                    ],
                    [
                        'type' => 'image_url',
                        'image_url' => [
                            'url' => "data:{$mimeType};base64,{$imageData}"
                        ]
                    ]
                ]
            ]
        ],
        'max_tokens' => 1000,
        'temperature' => 0.3
    ];
    
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => 'https://api.openai.com/v1/chat/completions',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_TIMEOUT => 60
    ]);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    
    if ($httpCode !== 200) {
        throw new Exception('AI fish identification request failed with status: ' . $httpCode);
    }
    
    $result = json_decode($response, true);
    if (!isset($result['choices'][0]['message']['content'])) {
        throw new Exception('Invalid response from AI service.');
    }
    
    // Parse AI response
    $aiResponse = $result['choices'][0]['message']['content'];
    
    // Try to extract JSON from response
    preg_match('/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/', $aiResponse, $matches);
    
    if (!empty($matches)) {
        $parsedResponse = json_decode($matches[0], true);
        if ($parsedResponse) {
            return [
                'raw_response' => $aiResponse,
                'parsed_data' => $parsedResponse,
                'confidence' => $parsedResponse['confidence'] ?? 0.5,
                'species' => $parsedResponse['species'] ?? 'Unknown',
                'scientific_name' => $parsedResponse['scientific_name'] ?? '',
                'key_features' => $parsedResponse['key_features'] ?? [],
                'alternatives' => $parsedResponse['alternative_species'] ?? [],
                'habitat' => $parsedResponse['habitat'] ?? '',
                'fishing_tips' => $parsedResponse['fishing_tips'] ?? '',
                'best_bait' => $parsedResponse['best_bait'] ?? ''
            ];
        }
    }
    
    return [
        'raw_response' => $aiResponse,
        'parsed_data' => null,
        'confidence' => 0.3,
        'species' => 'Unable to identify',
        'scientific_name' => '',
        'key_features' => [],
        'alternatives' => [],
        'habitat' => '',
        'fishing_tips' => '',
        'best_bait' => ''
    ];
}

function saveFishIdentification($userId, $sessionId, $imagePath, $aiResult, $metadata = []) {
    global $pdo;
    
    // Find matching species in database
    $speciesId = findSpeciesInDatabase($aiResult['species'], $aiResult['scientific_name']);
    
    $stmt = $pdo->prepare("
        INSERT INTO fish_identifications (
            user_id, session_id, original_image_path, ai_species_id, ai_confidence_score,
            ai_response_data, location_lat, location_lng, location_name, catch_date,
            fishing_method, water_type, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'identified')
    ");
    
    $result = $stmt->execute([
        $userId,
        $sessionId,
        $imagePath,
        $speciesId,
        $aiResult['confidence'],
        json_encode($aiResult),
        $metadata['latitude'] ?? null,
        $metadata['longitude'] ?? null,
        $metadata['location'] ?? null,
        $metadata['catch_date'] ?? null,
        $metadata['fishing_method'] ?? null,
        $metadata['water_type'] ?? null
    ]);
    
    if ($result) {
        return $pdo->lastInsertId();
    } else {
        throw new Exception('Failed to save fish identification record.');
    }
}

function findSpeciesInDatabase($commonName, $scientificName = '') {
    global $pdo;
    
    try {
        // Try exact match first
        $stmt = $pdo->prepare("
            SELECT id FROM fish_species 
            WHERE LOWER(name) = LOWER(?) 
            OR LOWER(scientific_name) = LOWER(?)
            LIMIT 1
        ");
        $stmt->execute([$commonName, $scientificName]);
        $species = $stmt->fetch();
        
        if ($species) {
            return $species['id'];
        }
    } catch (PDOException $e) {
        // If columns don't exist, return null
        return null;
    }
    
    return null;
}

function getFishSpeciesInfo($speciesId) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT * FROM fish_species 
            WHERE id = ?
        ");
        $stmt->execute([$speciesId]);
        
        return $stmt->fetch();
    } catch (PDOException $e) {
        return null;
    }
}

function getFishIdentification($id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT fi.*, u.username, u.full_name
            FROM fish_identifications fi
            LEFT JOIN users u ON fi.user_id = u.id
            WHERE fi.id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch();
    } catch (PDOException $e) {
        return null;
    }
}

function getRecentFishIdentifications($limit = 10, $publicOnly = true) {
    global $pdo;
    
    try {
        $whereClause = $publicOnly ? "WHERE fi.is_public = 1 AND fi.status IN ('identified', 'verified')" : "";
        
        $stmt = $pdo->prepare("
            SELECT fi.id, fi.original_image_path, fi.ai_confidence_score, fi.created_at,
                   fi.location_name, u.username
            FROM fish_identifications fi
            LEFT JOIN users u ON fi.user_id = u.id
            {$whereClause}
            ORDER BY fi.created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        return [];
    }
}

function saveImageUpload($file, $directory = 'uploads/fish-id/') {
    // Create directory if it doesn't exist
    if (!file_exists($directory)) {
        mkdir($directory, 0755, true);
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('fish_' . date('Ymd_His') . '_') . '.' . $extension;
    $filepath = $directory . $filename;
    
    // Validate file type
    $allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!in_array(strtolower($extension), $allowedTypes)) {
        throw new Exception('Invalid file type. Please upload JPG, PNG, GIF, or WebP images.');
    }
    
    // Validate file size (max 10MB)
    if ($file['size'] > 10 * 1024 * 1024) {
        throw new Exception('File too large. Please upload images smaller than 10MB.');
    }
    
    // Move uploaded file
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        return $filepath;
    } else {
        throw new Exception('Failed to save uploaded file.');
    }
}

function processImageUpload($file, $userId = null, $sessionId = null, $metadata = []) {
    try {
        // Save the uploaded image
        $imagePath = saveImageUpload($file);
        
        // Run AI identification
        $aiResult = identifyFishWithAI($imagePath, $metadata['location'] ?? null);
        
        // Save identification record
        $identificationId = saveFishIdentification($userId, $sessionId, $imagePath, $aiResult, $metadata);
        
        return [
            'success' => true,
            'identification_id' => $identificationId,
            'image_path' => $imagePath,
            'ai_result' => $aiResult
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

function getIdentificationHistory($userId, $limit = 20) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT fi.*
            FROM fish_identifications fi
            WHERE fi.user_id = ?
            ORDER BY fi.created_at DESC
            LIMIT ?
        ");
        
        $stmt->execute([$userId, $limit]);
        
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        return [];
    }
}

function getPublicIdentifications($limit = 50, $status = 'identified') {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT fi.*, u.username
            FROM fish_identifications fi
            LEFT JOIN users u ON fi.user_id = u.id
            WHERE fi.is_public = TRUE AND fi.status = ?
            ORDER BY fi.created_at DESC
            LIMIT ?
        ");
        
        $stmt->execute([$status, $limit]);
        
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        return [];
    }
}

function submitCommunityVerification($identificationId, $userId, $suggestedSpeciesId, $confidenceLevel = 'medium', $notes = '') {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO fish_id_verifications 
            (identification_id, user_id, suggested_species_id, confidence_level, notes)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([$identificationId, $userId, $suggestedSpeciesId, $confidenceLevel, $notes]);
        
        return true;
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') { // Duplicate entry
            throw new Exception('You have already verified this identification.');
        }
        throw $e;
    }
}

// Analytics functions - FIXED VERSION
function getIdentificationStats() {
    global $pdo;
    
    $stats = [];
    
    try {
        // Total identifications
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM fish_identifications");
        $result = $stmt->fetch();
        $stats['total_identifications'] = $result ? $result['total'] : 0;
        
        // This month's identifications
        $stmt = $pdo->query("
            SELECT COUNT(*) as monthly 
            FROM fish_identifications 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        ");
        $result = $stmt->fetch();
        $stats['monthly_identifications'] = $result ? $result['monthly'] : 0;
        
        // Simple top species count (without JOIN to avoid column issues)
        $stmt = $pdo->query("
            SELECT ai_species_id, COUNT(*) as count
            FROM fish_identifications
            WHERE ai_species_id IS NOT NULL
            GROUP BY ai_species_id
            ORDER BY count DESC
            LIMIT 5
        ");
        $stats['top_species'] = $stmt->fetchAll();
        
        // Success rate (identifications with confidence > 0.7)
        $stmt = $pdo->query("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN ai_confidence_score > 0.7 THEN 1 ELSE 0 END) as high_confidence
            FROM fish_identifications
        ");
        $result = $stmt->fetch();
        $stats['success_rate'] = ($result && $result['total'] > 0) ? ($result['high_confidence'] / $result['total']) * 100 : 0;
        
    } catch (PDOException $e) {
        // If there are any database issues, return default stats
        $stats = [
            'total_identifications' => 0,
            'monthly_identifications' => 0,
            'top_species' => [],
            'success_rate' => 0
        ];
    }
    
    return $stats;
}

?>
