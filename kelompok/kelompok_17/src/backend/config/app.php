<?php
if (!defined('BASE_PATH')) {
    http_response_code(403);
    exit('Direct access forbidden');
}
define('DB_HOST', 'localhost');
define('DB_NAME', 'db_simora'); // GANTI DENGAN NAMA DATABASE ANDA
define('DB_USER', 'root'); // GANTI DENGAN USERNAME DATABASE ANDA
define('DB_PASS', ''); // GANTI DENGAN PASSWORD DATABASE ANDA
define('DB_CHARSET', 'utf8mb4');
define('APP_NAME', 'SIMORA');
define('APP_VERSION', '1.0.0');
define('APP_ENVIRONMENT', 'development');
define('APP_BASE_URL', 'http://tubes_prk_pemweb_2025.test/kelompok/kelompok_17/src/'); // URL dasar lama
define('API_URL', 'http://tubes_prk_pemweb_2025.test/kelompok/kelompok_17/src/backend/api/'); // URL API lama
define('APP_DEBUG', true);
define('AUTH_SALT', 'ubah_string_acak_ini_untuk_keamanan_lebih_kuat_2025_simora_Tubes_Security');
define('SYSTEM_EMAIL_SENDER', 'dhinivadilas@gmail.com');
define('SYSTEM_SENDER_NAME', 'SIMORA Administrator');
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
if (strpos($host, '.test') !== false) {
    define('LOGIN_PAGE_URL', 'http://' . $host . '/kelompok/kelompok_17/src/frontend/auth/login.html');
} else {
    define('LOGIN_PAGE_URL', 'http://localhost/TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17/src/frontend/auth/login.html');
}
