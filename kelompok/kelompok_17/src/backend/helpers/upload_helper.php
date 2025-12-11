<?php
function upload_image(array $file, string $destination, string $prefix = ''): array
{
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return [
            'success' => false,
            'message' => get_upload_error_message($file['error'])
        ];
    }
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    if (!in_array($mimeType, ALLOWED_IMAGE_TYPES)) {
        return [
            'success' => false,
            'message' => 'Tipe file tidak diizinkan. Gunakan JPG, PNG, GIF, atau WebP'
        ];
    }
    if ($file['size'] > MAX_FILE_SIZE) {
        $maxMB = MAX_FILE_SIZE / 1024 / 1024;
        return [
            'success' => false,
            'message' => "Ukuran file maksimal {$maxMB}MB"
        ];
    }
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, ALLOWED_IMAGE_EXTENSIONS)) {
        return [
            'success' => false,
            'message' => 'Ekstensi file tidak diizinkan'
        ];
    }
    if (!is_dir($destination)) {
        mkdir($destination, 0755, true);
    }
    $filename = $prefix . uniqid() . '_' . time() . '.' . $extension;
    $filepath = $destination . '/' . $filename;
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        return [
            'success' => true,
            'filename' => $filename,
            'filepath' => $filepath,
            'message' => 'Upload berhasil'
        ];
    }
    return [
        'success' => false,
        'message' => 'Gagal menyimpan file'
    ];
}
function upload_profile_photo(array $file, int $userId): array
{
    return upload_image($file, PROFILE_UPLOAD_PATH, 'profile_' . $userId . '_');
}
function upload_event_banner(array $file, int $eventId = 0): array
{
    $prefix = $eventId > 0 ? 'event_' . $eventId . '_' : 'event_';
    return upload_image($file, EVENT_UPLOAD_PATH, $prefix);
}
function upload_attendance_photo(array $file, int $eventId, int $userId): array
{
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return [
            'success' => false,
            'message' => get_upload_error_message($file['error'])
        ];
    }
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    if (!in_array($mimeType, ALLOWED_IMAGE_TYPES)) {
        return [
            'success' => false,
            'message' => 'Tipe file tidak diizinkan. Gunakan JPG, PNG, GIF, atau WebP'
        ];
    }
    if ($file['size'] > MAX_FILE_SIZE) {
        $maxMB = MAX_FILE_SIZE / 1024 / 1024;
        return [
            'success' => false,
            'message' => "Ukuran file maksimal {$maxMB}MB"
        ];
    }
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, ALLOWED_IMAGE_EXTENSIONS)) {
        return [
            'success' => false,
            'message' => 'Ekstensi file tidak diizinkan'
        ];
    }
    $destination = dirname(UPLOAD_PATH) . '/upload/absensi';
    if (!is_dir($destination)) {
        mkdir($destination, 0755, true);
    }
    $filename = 'absensi_' . $eventId . '_' . $userId . '_' . time() . '_' . uniqid() . '.' . $extension;
    $filepath = $destination . '/' . $filename;
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        return [
            'success'  => true,
            'filename' => $filename,
            'filepath' => $filepath,
            'message'  => 'Upload berhasil'
        ];
    }
    return [
        'success' => false,
        'message' => 'Gagal menyimpan file'
    ];
}
function delete_file(string $filepath): bool
{
    if (file_exists($filepath) && is_file($filepath)) {
        return unlink($filepath);
    }
    return false;
}
function delete_profile_photo(string $filename): bool
{
    if (empty($filename)) {
        return false;
    }
    return delete_file(PROFILE_UPLOAD_PATH . $filename);
}
function delete_event_banner(string $filename): bool
{
    if (empty($filename)) {
        return false;
    }
    return delete_file(EVENT_UPLOAD_PATH . $filename);
}
function get_upload_error_message(int $errorCode): string
{
    switch ($errorCode) {
        case UPLOAD_ERR_INI_SIZE:
            return 'Ukuran file melebihi batas server';
        case UPLOAD_ERR_FORM_SIZE:
            return 'Ukuran file melebihi batas form';
        case UPLOAD_ERR_PARTIAL:
            return 'File hanya terupload sebagian';
        case UPLOAD_ERR_NO_FILE:
            return 'Tidak ada file yang diupload';
        case UPLOAD_ERR_NO_TMP_DIR:
            return 'Folder temporary tidak ditemukan';
        case UPLOAD_ERR_CANT_WRITE:
            return 'Gagal menulis file';
        case UPLOAD_ERR_EXTENSION:
            return 'Upload dibatalkan oleh ekstensi';
        default:
            return 'Error upload tidak diketahui';
    }
}
function is_valid_image(string $filepath): bool
{
    if (!file_exists($filepath)) {
        return false;
    }
    $imageInfo = @getimagesize($filepath);
    if ($imageInfo === false) {
        return false;
    }
    $allowedTypes = [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP];
    return in_array($imageInfo[2], $allowedTypes);
}
function resize_image(string $sourcePath, string $destPath, int $maxWidth = 800, int $maxHeight = 800, int $quality = 85): bool
{
    $imageInfo = getimagesize($sourcePath);
    if ($imageInfo === false) {
        return false;
    }
    list($width, $height, $type) = $imageInfo;
    $ratio = min($maxWidth / $width, $maxHeight / $height);
    if ($ratio >= 1) {
        return copy($sourcePath, $destPath);
    }
    $newWidth = (int) ($width * $ratio);
    $newHeight = (int) ($height * $ratio);
    switch ($type) {
        case IMAGETYPE_JPEG:
            $source = imagecreatefromjpeg($sourcePath);
            break;
        case IMAGETYPE_PNG:
            $source = imagecreatefrompng($sourcePath);
            break;
        case IMAGETYPE_GIF:
            $source = imagecreatefromgif($sourcePath);
            break;
        case IMAGETYPE_WEBP:
            $source = imagecreatefromwebp($sourcePath);
            break;
        default:
            return false;
    }
    if ($source === false) {
        return false;
    }
    $dest = imagecreatetruecolor($newWidth, $newHeight);
    if ($type === IMAGETYPE_PNG || $type === IMAGETYPE_GIF) {
        imagecolortransparent($dest, imagecolorallocatealpha($dest, 0, 0, 0, 127));
        imagealphablending($dest, false);
        imagesavealpha($dest, true);
    }
    imagecopyresampled($dest, $source, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
    $result = false;
    switch ($type) {
        case IMAGETYPE_JPEG:
            $result = imagejpeg($dest, $destPath, $quality);
            break;
        case IMAGETYPE_PNG:
            $result = imagepng($dest, $destPath, (int) (9 - ($quality / 10)));
            break;
        case IMAGETYPE_GIF:
            $result = imagegif($dest, $destPath);
            break;
        case IMAGETYPE_WEBP:
            $result = imagewebp($dest, $destPath, $quality);
            break;
    }
    imagedestroy($source);
    imagedestroy($dest);
    return $result;
}
