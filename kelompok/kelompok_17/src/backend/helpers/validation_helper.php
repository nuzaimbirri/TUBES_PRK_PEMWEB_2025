<?php
function validate_required(array $fields, array $data): array
{
    $errors = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' wajib diisi';
        }
    }
    return $errors;
}
function validate_email(string $email): bool
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}
function validate_password(string $password, int $minLength = 8): array
{
    $errors = [];
    if (strlen($password) < $minLength) {
        $errors[] = "Password minimal $minLength karakter";
    }
    if (!preg_match('/[A-Z]/', $password)) {
        $errors[] = 'Password harus mengandung huruf besar';
    }
    if (!preg_match('/[a-z]/', $password)) {
        $errors[] = 'Password harus mengandung huruf kecil';
    }
    if (!preg_match('/[0-9]/', $password)) {
        $errors[] = 'Password harus mengandung angka';
    }
    return $errors;
}
function validate_password_simple(string $password, int $minLength = 6): bool
{
    return strlen($password) >= $minLength;
}
function validate_username(string $username, int $minLength = 3, int $maxLength = 50): array
{
    $errors = [];
    if (strlen($username) < $minLength) {
        $errors[] = "Username minimal $minLength karakter";
    }
    if (strlen($username) > $maxLength) {
        $errors[] = "Username maksimal $maxLength karakter";
    }
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        $errors[] = 'Username hanya boleh mengandung huruf, angka, dan underscore';
    }
    return $errors;
}
function validate_phone(string $phone): bool
{
    $phone = preg_replace('/[^0-9+]/', '', $phone);
    return preg_match('/^(\+62|62|0)8[1-9][0-9]{7,11}$/', $phone);
}
function validate_date(string $date, string $format = 'Y-m-d'): bool
{
    $d = DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) === $date;
}
function validate_time(string $time, string $format = 'H:i'): bool
{
    $t = DateTime::createFromFormat($format, $time);
    return $t && $t->format($format) === $time;
}
function validate_url(string $url): bool
{
    return filter_var($url, FILTER_VALIDATE_URL) !== false;
}
function validate_range($value, $min, $max): bool
{
    return $value >= $min && $value <= $max;
}
function validate_in_array($value, array $options): bool
{
    return in_array($value, $options, true);
}
function validate_length(string $string, int $min, ?int $max = null): bool
{
    $length = mb_strlen($string);
    if ($length < $min) {
        return false;
    }
    if ($max !== null && $length > $max) {
        return false;
    }
    return true;
}
function validate_file(array $file, array $allowedTypes = [], int $maxSize = 0): array
{
    $errors = [];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        switch ($file['error']) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $errors[] = 'Ukuran file terlalu besar';
                break;
            case UPLOAD_ERR_PARTIAL:
                $errors[] = 'File hanya terupload sebagian';
                break;
            case UPLOAD_ERR_NO_FILE:
                $errors[] = 'Tidak ada file yang diupload';
                break;
            default:
                $errors[] = 'Error upload file';
        }
        return $errors;
    }
    if ($maxSize > 0 && $file['size'] > $maxSize) {
        $maxMB = round($maxSize / 1024 / 1024, 2);
        $errors[] = "Ukuran file maksimal {$maxMB}MB";
    }
    if (!empty($allowedTypes)) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        if (!in_array($mimeType, $allowedTypes)) {
            $errors[] = 'Tipe file tidak diizinkan';
        }
    }
    return $errors;
}
function validate_npm(string $npm): bool
{
    return preg_match('/^[0-9]{8,15}$/', $npm);
}
function merge_validation_errors(array ...$errorArrays): array
{
    $merged = [];
    foreach ($errorArrays as $errors) {
        $merged = array_merge($merged, $errors);
    }
    return $merged;
}
