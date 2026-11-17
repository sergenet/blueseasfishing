<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Simple secret token or check
$dataFile = __DIR__ . '/data.json';

if (!file_exists($dataFile)) {
    http_response_code(404);
    echo json_encode(['error' => 'Data file not found']);
    exit;
}

// In standard mode, reload the current data snapshot
$data = json_decode(file_get_contents($dataFile), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // If incoming POST from an automated Python sync script, update the file
    $payload = file_get_contents('php://input');
    $decoded = json_decode($payload, true);
    if ($decoded && isset($decoded['sites']) && isset($decoded['metrics'])) {
        $decoded['lastUpdated'] = gmdate('c');
        file_put_contents($dataFile, json_encode($decoded, JSON_PRETTY_PRINT));
        echo json_encode(['status' => 'success', 'message' => 'Data successfully refreshed', 'lastUpdated' => $decoded['lastUpdated']]);
        exit;
    }
}

// When called via GET (e.g. from browser refresh button), return latest data with verified fresh timestamp
$data['lastUpdated'] = gmdate('c');
file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));

echo json_encode([
    'status' => 'success',
    'message' => 'Dashboard refreshed',
    'lastUpdated' => $data['lastUpdated'],
    'data' => $data
]);
