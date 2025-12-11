<?php
require_once __DIR__ . '/../init.php';
Response::setCorsHeaders();
Response::handlePreflight();
require_once CONTROLLERS_PATH . '/AttendanceController.php';
$controller = new AttendanceController();
$action = Request::query('action', '');
$id = (int) Request::query('id', 0);
$eventId = (int) Request::query('event_id', 0);
$userId = (int) Request::query('user_id', 0);
$data = Request::all();
try {
    switch ($action) {
        case 'checkin':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            $controller->checkIn($data);
            break;
        case 'by-event':
        case 'event-attendance':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            if ($eventId <= 0) {
                Response::error('Event ID diperlukan', 400);
            }
            $controller->byEvent($eventId);
            break;
        case 'my-attendance':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            $controller->myAttendance();
            break;
        case 'by-user':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            if ($userId <= 0) {
                Response::error('User ID diperlukan', 400);
            }
            $controller->byUser($userId);
            break;
        case 'update-status':
            if (!Request::isPost() && !Request::isPut()) {
                Response::methodNotAllowed('Gunakan method POST atau PUT');
            }
            if ($id <= 0) {
                Response::error('Attendance ID diperlukan', 400);
            }
            $controller->updateStatus($id, $data);
            break;
        case 'delete':
            if (!Request::isPost() && !Request::isDelete()) {
                Response::methodNotAllowed('Gunakan method POST atau DELETE');
            }
            if ($id <= 0) {
                Response::error('Attendance ID diperlukan', 400);
            }
            $controller->destroy($id);
            break;
        case 'not-checked-in':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            if ($eventId <= 0) {
                Response::error('Event ID diperlukan', 400);
            }
            $controller->notCheckedIn($eventId);
            break;
        case 'bulk-checkin':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            $controller->bulkCheckIn($data);
            break;
        case 'check-status':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            if ($eventId <= 0) {
                Response::error('Event ID diperlukan', 400);
            }
            $controller->checkStatus($eventId);
            break;
        case 'can-attend':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            if ($eventId <= 0) {
                Response::error('Event ID diperlukan', 400);
            }
            $controller->canAttend($eventId);
            break;
        case 'statistics':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            $controller->userStatistics();
            break;
        default:
            Response::error('Action tidak ditemukan', 404);
    }
} catch (Exception $e) {
    error_log("Attendance API Error: " . $e->getMessage());
    Response::serverError('Terjadi kesalahan server');
}
