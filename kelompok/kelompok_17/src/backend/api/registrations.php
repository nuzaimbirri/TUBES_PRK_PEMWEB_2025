<?php

require_once __DIR__ . '/../init.php';

Response::setCorsHeaders();
Response::handlePreflight();

require_once MODELS_PATH . '/EventRegistration.php';
require_once MODELS_PATH . '/Event.php';

$registrationModel = new EventRegistration();
$eventModel = new Event();
$action = Request::query('action', '');
$id = (int) Request::query('id', 0);

try {
    switch ($action) {
        case 'register':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            require_login();
            
            $data = Request::all();
            $errors = validate_required(['event_id', 'division', 'reason'], $data);
            
            if (!empty($errors)) {
                Response::validationError($errors);
            }
            
            $event = $eventModel->findById((int) $data['event_id']);
            if (!$event) {
                Response::notFound('Event tidak ditemukan');
            }
            
            if (!$event['open_registration']) {
                Response::error('Event ini tidak membuka pendaftaran panitia', 400);
            }
            
            if ($event['registration_deadline'] && strtotime($event['registration_deadline']) < time()) {
                Response::error('Batas waktu pendaftaran sudah berakhir', 400);
            }
            
            $result = $registrationModel->register([
                'event_id'   => (int) $data['event_id'],
                'user_id'    => get_current_user_id(),
                'division'   => sanitize_string($data['division']),
                'reason'     => sanitize_string($data['reason']),
                'experience' => sanitize_string($data['experience'] ?? '')
            ]);
            
            if ($result['success']) {
                Response::created($result, $result['message']);
            } else {
                Response::error($result['message'], 400);
            }
            break;

        case 'my-registrations':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            require_login();
            
            $page = (int) Request::query('page', 1);
            $limit = (int) Request::query('limit', 10);
            
            $registrations = $registrationModel->getByUser(get_current_user_id(), $page, $limit);
            $total = $registrationModel->countByUser(get_current_user_id());
            
            Response::success([
                'registrations' => $registrations,
                'total' => $total,
                'page' => $page,
                'limit' => $limit
            ]);
            break;

        case 'check-registration':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            require_login();
            
            $eventId = (int) Request::query('event_id', 0);
            if ($eventId <= 0) {
                Response::error('Event ID diperlukan', 400);
            }
            
            $registration = $registrationModel->findByEventAndUser($eventId, get_current_user_id());
            
            Response::success([
                'has_registered' => $registration !== null,
                'registration' => $registration,
                'is_approved' => $registration ? ($registration['status'] === 'approved') : false
            ]);
            break;

        case 'event-registrations':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            require_admin();
            
            $eventId = (int) Request::query('event_id', 0);
            if ($eventId <= 0) {
                Response::error('Event ID diperlukan', 400);
            }
            
            $status = Request::query('status');
            $page = (int) Request::query('page', 1);
            $limit = (int) Request::query('limit', 50);
            
            $registrations = $registrationModel->getByEvent($eventId, $status, $page, $limit);
            $total = $registrationModel->countByEvent($eventId, $status);
            
            Response::success([
                'registrations' => $registrations,
                'total' => $total,
                'pending_count' => $registrationModel->countByEvent($eventId, 'pending'),
                'approved_count' => $registrationModel->countByEvent($eventId, 'approved'),
                'rejected_count' => $registrationModel->countByEvent($eventId, 'rejected')
            ]);
            break;

        case 'pending':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            require_admin();
            
            $page = (int) Request::query('page', 1);
            $limit = (int) Request::query('limit', 20);
            
            $registrations = $registrationModel->getPendingRegistrations($page, $limit);
            $total = $registrationModel->countPending();
            
            Response::success([
                'registrations' => $registrations,
                'total' => $total
            ]);
            break;

        case 'all':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            require_admin();
            
            $page = (int) Request::query('page', 1);
            $limit = (int) Request::query('limit', 100);
            $status = Request::query('status');
            
            $registrations = $registrationModel->getAllRegistrations($page, $limit, $status);
            
            Response::success($registrations);
            break;

        case 'update-status':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            require_admin();
            
            $data = Request::all();
            $regId = (int) ($data['registration_id'] ?? 0);
            $newStatus = $data['status'] ?? '';
            
            if ($regId <= 0) {
                Response::error('Registration ID diperlukan', 400);
            }
            
            if (!in_array($newStatus, ['approved', 'rejected'])) {
                Response::error('Status tidak valid', 400);
            }
            
            $registration = $registrationModel->findById($regId);
            if (!$registration) {
                Response::notFound('Pendaftaran tidak ditemukan');
            }
            
            $registrationModel->updateStatus($regId, $newStatus, $data['admin_notes'] ?? null);
            
            Response::success(null, $newStatus === 'approved' ? 'Pendaftaran berhasil disetujui' : 'Pendaftaran ditolak');
            break;

        case 'delete':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            require_login();
            
            $data = Request::all();
            $eventId = (int) ($data['event_id'] ?? 0);
            
            if ($eventId <= 0) {
                Response::error('Event ID diperlukan', 400);
            }
            
            $registration = $registrationModel->findByEventAndUser($eventId, get_current_user_id());
            if (!$registration) {
                Response::notFound('Pendaftaran tidak ditemukan');
            }
            
            if ($registration['status'] !== 'pending') {
                Response::error('Hanya pendaftaran dengan status pending yang bisa dibatalkan', 400);
            }
            
            $registrationModel->delete($registration['registration_id']);
            Response::success(null, 'Pendaftaran berhasil dibatalkan');
            break;

        case 'approve':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            require_admin();
            
            if ($id <= 0) {
                Response::error('Registration ID diperlukan', 400);
            }
            
            $registration = $registrationModel->findById($id);
            if (!$registration) {
                Response::notFound('Pendaftaran tidak ditemukan');
            }
            
            $data = Request::all();
            $registrationModel->updateStatus($id, 'approved', $data['admin_notes'] ?? null);
            
            Response::success(null, 'Pendaftaran berhasil disetujui');
            break;

        case 'reject':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            require_admin();
            
            if ($id <= 0) {
                Response::error('Registration ID diperlukan', 400);
            }
            
            $registration = $registrationModel->findById($id);
            if (!$registration) {
                Response::notFound('Pendaftaran tidak ditemukan');
            }
            
            $data = Request::all();
            $registrationModel->updateStatus($id, 'rejected', $data['admin_notes'] ?? null);
            
            Response::success(null, 'Pendaftaran ditolak');
            break;

        case 'cancel':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            require_login();
            
            if ($id <= 0) {
                Response::error('Registration ID diperlukan', 400);
            }
            
            $registration = $registrationModel->findById($id);
            if (!$registration) {
                Response::notFound('Pendaftaran tidak ditemukan');
            }
            
            if ($registration['user_id'] != get_current_user_id() && !is_admin()) {
                Response::forbidden('Anda tidak memiliki akses');
            }
            
            if ($registration['status'] !== 'pending') {
                Response::error('Hanya pendaftaran dengan status pending yang bisa dibatalkan', 400);
            }
            
            $registrationModel->delete($id);
            Response::success(null, 'Pendaftaran berhasil dibatalkan');
            break;

        default:
            Response::error('Action tidak ditemukan', 404);
    }
} catch (Exception $e) {
    error_log("Registration API Error: " . $e->getMessage());
    Response::serverError('Terjadi kesalahan server');
}
