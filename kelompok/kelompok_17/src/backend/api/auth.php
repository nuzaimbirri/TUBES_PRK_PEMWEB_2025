<?php

require_once __DIR__ . '/../init.php';

// CORS
Response::setCorsHeaders();
Response::handlePreflight();

// Session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once CONTROLLERS_PATH . '/AuthController.php';

$controller = new AuthController();
$action     = Request::query('action', '');
$data       = Request::all();

// Aksi khusus Admin
$protected_admin_actions = [
    'pending_members',
    'approve_member',
    'active_members',
    'dashboard_stats'
];

// Middleware Admin
if (in_array($action, $protected_admin_actions)) {
    if (!$controller->isLoggedIn() || !$controller->isAdmin()) {
        Response::unauthorized('Akses ditolak. Sesi admin diperlukan.');
    }
}

try {

    switch ($action) {

        /* ============================
           LOGIN
        ============================= */
        case 'login':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            $controller->login($data);
            break;

        /* ============================
           REGISTER
        ============================= */
        case 'register':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            $controller->register($data);
            break;

        /* ============================
           LOGOUT
        ============================= */
        case 'logout':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            $controller->logout();
            break;

        /* ============================
           DASHBOARD STATS (ADMIN)
        ============================= */
        case 'dashboard_stats':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }

            global $db;

            if (!isset($db) || $db->connect_error) {
                Response::serverError('Koneksi database gagal.');
            }

            $currentMonth = date('Y-m');

            // Total anggota
            $q1 = $db->query("
                SELECT COUNT(user_id) AS count
                FROM users
                WHERE role = 'anggota' AND is_approved = 1
            ");
            $totalAnggota = (int) $q1->fetch_assoc()['count'];

            // Event bulan ini
            $q2 = $db->query("
                SELECT COUNT(event_id) AS count
                FROM events
                WHERE event_date LIKE '{$currentMonth}-%'
                AND status != 'cancelled'
            ");
            $eventBulanIni = (int) $q2->fetch_assoc()['count'];

            // Anggota non-aktif
            $q3 = $db->query("
                SELECT COUNT(p.user_id) AS count
                FROM profiles p
                JOIN users u ON p.user_id = u.user_id
                WHERE p.activity_status != 'aktif'
                AND u.role = 'anggota'
                AND u.is_approved = 1
            ");
            $anggotaNonAktif = (int) $q3->fetch_assoc()['count'];

            // Upcoming event
            $upcomingResult = $db->query("
                SELECT title, description, location, event_date, start_time
                FROM events
                WHERE event_date >= CURDATE()
                AND status = 'upcoming'
                ORDER BY event_date, start_time
                LIMIT 2
            ");

            $upcomingEvents = [];
            while ($row = $upcomingResult->fetch_assoc()) {
                $formatted = date('l, d M Y', strtotime($row['event_date'])) .
                             ', ' . date('H:i', strtotime($row['start_time'])) . ' WIB';

                $upcomingEvents[] = [
                    'title'       => $row['title'],
                    'description' => $row['description'],
                    'date'        => $formatted,
                    'location'    => $row['location']
                ];
            }

            Response::success([
                'total_anggota'      => $totalAnggota,
                'event_bulan_ini'    => $eventBulanIni,
                'anggota_non_aktif'  => $anggotaNonAktif,
                'upcoming_events'    => $upcomingEvents
            ]);
            break;

        /* ============================
           DEFAULT
        ============================= */
        default:
            Response::error('Action tidak dikenali.');
    }

} catch (Exception $e) {
    Response::error('Terjadi kesalahan: ' . $e->getMessage());
}
