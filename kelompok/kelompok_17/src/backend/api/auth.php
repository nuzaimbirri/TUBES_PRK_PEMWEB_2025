<?php

require_once __DIR__ . '/../init.php';

Response::setCorsHeaders();
Response::handlePreflight();

require_once CONTROLLERS_PATH . '/AuthController.php';

$controller = new AuthController();
$action = Request::query('action', '');
$data = Request::all();

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
            $controller->logout();
            break;

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
            Response::error('Action tidak ditemukan. Gunakan: login, register, logout, me, change-password, check', 404);
    }
} catch (Exception $e) {
    error_log("Auth API Error: " . $e->getMessage());
    Response::serverError('Terjadi kesalahan server');
}
