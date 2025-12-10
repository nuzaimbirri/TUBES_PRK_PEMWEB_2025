<?php

require_once __DIR__ . '/../init.php';

// Atur header CORS dan handle preflight request
Response::setCorsHeaders();
Response::handlePreflight();

// --- INI SANGAT PENTING: MULAI SESI DI SETIAP REQUEST API ---
// Asumsi session_start() sudah dipanggil di Response::setCorsHeaders() atau di init.php
// Jika belum, pastikan Anda memanggil session_start() di awal file.

require_once CONTROLLERS_PATH . '/AuthController.php';

$controller = new AuthController();
$action = Request::query('action', '');
$data = Request::all();

// --- Logika Otorisasi Admin untuk Endpoint yang Dilindungi ---
// Memastikan sesi dimulai sebelum pemeriksaan dilakukan jika belum dilakukan di init.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$protected_admin_actions = ['pending_members', 'approve_member', 'active_members'];

if (in_array($action, $protected_admin_actions)) {
    // Asumsi Controller memiliki fungsi isLoggedIn() dan isAdmin()
    // Logika otorisasi akan memeriksa status login dan role
    if (!$controller->isLoggedIn() || !$controller->isAdmin()) {
        Response::unauthorized('Akses ditolak. Sesi admin diperlukan.');
    }
}
// -----------------------------------------------------------


try {
    switch ($action) {
        case 'login':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            $controller->login($data);
            break;

        case 'register':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            $controller->register($data);
            break;

        case 'logout':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            // Logout tidak memerlukan cek admin
            $controller->logout();
            break;

        // --- Action: Mengambil Daftar Anggota Pending (GET) ---
        case 'pending_members':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            // Logika getPendingMembers harus sudah menerapkan JOIN users dan profiles
            $controller->getPendingMembers();
            break;

        // --- Action: Persetujuan Anggota (Approve/Reject) (POST) ---
        case 'approve_member':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            $controller->approveMember($data);
            break;
        
        // -----------------------------------------------------------------------
        // --- TAMBAHAN BARU: Action untuk Mengambil Daftar Anggota Aktif (GET) ---
        // -----------------------------------------------------------------------
        case 'active_members':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            // Logika getActiveMembers harus menerapkan JOIN users dan profiles (is_approved=1)
            $controller->getActiveMembers();
            break;
        // -----------------------------------------------------------------------

        case 'me':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            $controller->me();
            break;

        case 'change-password':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            $controller->changePassword($data);
            break;

        case 'check':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            $controller->checkSession();
            break;

        default:
            // Menggunakan Response::error yang benar untuk 404
            Response::error('Action tidak ditemukan. Gunakan: login, register, logout, me, change-password, check, pending_members, approve_member, active_members', 404);
    }
} catch (Exception $e) {
    // Menangani Exception umum
    error_log("Auth API Error: " . $e->getMessage());
    Response::serverError('Terjadi kesalahan server: ' . $e->getMessage());
}