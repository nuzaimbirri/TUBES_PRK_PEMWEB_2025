<?php

/**
 * Upload Presensi API
 * Handle upload foto presensi ke folder
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../init.php';

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    // Validate session (optional - uncomment if auth required)
    // Session::start();
    // if (!Session::has('user_id')) {
    //     throw new Exception('Unauthorized');
    // }
    // $userId = Session::get('user_id');

    // For demo: use user_id from POST
    $userId = $_POST['user_id'] ?? 1;
    $eventId = $_POST['event_id'] ?? null;
    $notes = $_POST['notes'] ?? '';

    if (!$eventId) {
        throw new Exception('Event ID required');
    }

    if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Foto presensi harus diupload');
    }

    $file = $_FILES['photo'];

    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedTypes)) {
        throw new Exception('Format file tidak valid. Hanya JPG, JPEG, PNG yang diperbolehkan');
    }

    // Validate file size (max 5MB)
    $maxSize = 5 * 1024 * 1024; // 5MB
    if ($file['size'] > $maxSize) {
        throw new Exception('Ukuran file terlalu besar. Maksimal 5MB');
    }

    // Create upload directory if not exists
    $uploadDir = __DIR__ . '/../../uploads/presensi/' . date('Y') . '/' . date('m') . '/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'presensi_' . $userId . '_' . $eventId . '_' . time() . '_' . uniqid() . '.' . $extension;
    $filePath = $uploadDir . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        throw new Exception('Gagal menyimpan file');
    }

    // Save to database (optional)
    // For now, just return success with file info

    $relativeUrl = '/uploads/presensi/' . date('Y') . '/' . date('m') . '/' . $filename;

    echo json_encode([
        'success' => true,
        'message' => 'Presensi berhasil diupload',
        'data' => [
            'filename' => $filename,
            'url' => $relativeUrl,
            'uploaded_at' => date('Y-m-d H:i:s'),
            'event_id' => $eventId,
            'user_id' => $userId,
            'notes' => $notes
        ]
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
