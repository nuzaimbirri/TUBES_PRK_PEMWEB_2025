<?php
require_once __DIR__ . '/../init.php';
Response::setCorsHeaders();
Response::handlePreflight();
require_once CONTROLLERS_PATH . '/ProfileController.php';
$controller = new ProfileController();
$action = Request::query('action', '');
$userId = (int) Request::query('user_id', 0);
$data = Request::all();
try {
    switch ($action) {
        case 'list':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            $controller->index();
            break;
        case 'me':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            $controller->me();
            break;
        case 'show':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            if ($userId <= 0) {
                Response::error('User ID diperlukan', 400);
            }
            $controller->show($userId);
            break;
        case 'update':
            if (!Request::isPost() && !Request::isPut()) {
                Response::methodNotAllowed('Gunakan method POST atau PUT');
            }
            $controller->update($data);
            break;
        case 'upload-photo':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            $controller->uploadPhoto();
            break;
        case 'delete-photo':
            if (!Request::isPost() && !Request::isDelete()) {
                Response::methodNotAllowed('Gunakan method POST atau DELETE');
            }
            $controller->deletePhoto();
            break;
        case 'search':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            $controller->search();
            break;
        case 'by-status':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            $status = Request::query('status', '');
            if (empty($status)) {
                Response::error('Status diperlukan', 400);
            }
            $controller->byStatus($status);
            break;
        case 'get':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            if ($userId <= 0) {
                Response::error('User ID diperlukan', 400);
            }
            $controller->get($userId);
            break;
        case 'update-status':
            if (!Request::isPost() && !Request::isPut()) {
                Response::methodNotAllowed('Gunakan method POST atau PUT');
            }
            $controller->updateStatus($data);
            break;
        default:
            Response::error('Action tidak ditemukan. Gunakan: list, me, show, update, upload-photo, delete-photo, search, by-status, get, update-status', 404);
    }
} catch (Exception $e) {
    error_log("Profile API Error: " . $e->getMessage());
    Response::serverError('Terjadi kesalahan server');
}
