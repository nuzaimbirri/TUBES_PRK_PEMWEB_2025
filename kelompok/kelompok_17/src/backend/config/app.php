<?php
// Lokasi file: src/backend/config/app.php

if (!defined('BASE_PATH')) {
    http_response_code(403);
    exit('Direct access forbidden');
}

// -------------------------------------------------------------------------
// 1. DATABASE CONFIGURATION (MySQL)
// -------------------------------------------------------------------------

/** Nama host database Anda */
define('DB_HOST', 'localhost');

/** Nama database yang Anda gunakan */
define('DB_NAME', 'db_simora'); // GANTI DENGAN NAMA DATABASE ANDA

/** Username untuk mengakses database */
define('DB_USER', 'root'); // GANTI DENGAN USERNAME DATABASE ANDA

/** Password untuk mengakses database */
define('DB_PASS', ''); // GANTI DENGAN PASSWORD DATABASE ANDA

/** Charset database */
define('DB_CHARSET', 'utf8mb4');


// -------------------------------------------------------------------------
// 2. SYSTEM CONSTANTS & SECURITY (Menggabungkan data array lama)
// -------------------------------------------------------------------------

// Data dari array app.php yang lama (diubah menjadi konstanta)
define('APP_NAME', 'SIMORA');
define('APP_VERSION', '1.0.0');
define('APP_ENVIRONMENT', 'development');
define('APP_BASE_URL', 'http://localhost/TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17/src/'); // URL dasar lama
define('API_URL', 'http://localhost/TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17/src/backend/api/'); // URL API lama
define('APP_DEBUG', true);
// Timezone dan Language sudah diatur di init.php/core
// define('APP_TIMEZONE', 'Asia/Jakarta');
// define('APP_LANGUAGE', 'id');

/** Kunci unik untuk keamanan hashing (Digunakan di helper/AuthHelper) */
define('AUTH_SALT', 'ubah_string_acak_ini_untuk_keamanan_lebih_kuat_2025_simora_Tubes_Security');


// -------------------------------------------------------------------------
// 3. EMAIL SERVICE CONFIGURATION (PHP Native mail() Sender)
// -------------------------------------------------------------------------

/** Email yang digunakan sebagai pengirim (sender/From) */
define('SYSTEM_EMAIL_SENDER', 'noreply@simora.com'); // GANTI dengan email yang valid

/** Nama yang muncul sebagai pengirim email */
define('SYSTEM_SENDER_NAME', 'SIMORA Administrator');

/** URL lengkap ke halaman login yang disertakan dalam email notifikasi */
// Menggunakan path relatif ke frontend
define('LOGIN_PAGE_URL', 'http://localhost/TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17/src/frontend/auth/login.html');

// Pastikan konstanta yang Anda butuhkan (ROLE_ADMIN, ROLE_ANGGOTA) sudah 
// didefinisikan di constants.php (yang dimuat sebelum app.php).