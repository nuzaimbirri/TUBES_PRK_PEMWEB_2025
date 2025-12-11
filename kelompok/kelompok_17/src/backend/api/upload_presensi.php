<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
require_once '../init.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}
try {
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
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    if (!in_array($mimeType, $allowedTypes)) {
        throw new Exception('Format file tidak valid. Hanya JPG, JPEG, PNG yang diperbolehkan');
    }
    $maxSize = 5 * 1024 * 1024; // 5MB
    if ($file['size'] > $maxSize) {
        throw new Exception('Ukuran file terlalu besar. Maksimal 5MB');
    }
    $uploadDir = __DIR__ . '/../../uploads/presensi/' . date('Y') . '/' . date('m') . '/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'presensi_' . $userId . '_' . $eventId . '_' . time() . '_' . uniqid() . '.' . $extension;
    $filePath = $uploadDir . $filename;
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        throw new Exception('Gagal menyimpan file');
    }
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
