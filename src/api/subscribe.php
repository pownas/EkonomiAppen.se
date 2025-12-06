<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Hantera OPTIONS request för CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Endast POST är tillåtet
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Endast POST tillåtet']);
    exit;
}

// Databasanslutning - ÄNDRA DESSA VÄRDEN
define('DB_HOST', 'localhost');
define('DB_NAME', 'ekonomiappen');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

try {
    // Läs JSON-data från request
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $email = isset($data['email']) ? trim($data['email']) : '';
    
    // Validera e-post
    if (empty($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'E-postadress saknas']);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ogiltig e-postadress']);
        exit;
    }
    
    // Anslut till databas
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    
    // Kolla om e-posten redan finns
    $stmt = $pdo->prepare("SELECT id FROM email_subscriptions WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'E-posten är redan registrerad']);
        exit;
    }
    
    // Spara ny e-post
    $stmt = $pdo->prepare("
        INSERT INTO email_subscriptions (email, subscribed_at, ip_address, user_agent) 
        VALUES (?, NOW(), ?, ?)
    ");
    
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
    
    $stmt->execute([$email, $ip, $userAgent]);
    
    http_response_code(201);
    echo json_encode(['success' => true, 'message' => 'Tack för din anmälan!']);
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Ett serverfel uppstod']);
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Ett fel uppstod']);
}
