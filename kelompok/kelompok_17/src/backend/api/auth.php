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
        case 'pending_members':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            $controller->getPendingMembers();
            break;
        case 'approve_member':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            $controller->approveMember($data);
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
        case 'active_members':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            $controller->getActiveMembers();
            break;
        case 'dashboard_stats':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            $controller->getDashboardStats();
            break;
        case 'all_members':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            $controller->getAllMembers();
            break;
        case 'delete_member':
            if (!Request::isPost() && !Request::isDelete()) {
                Response::methodNotAllowed('Gunakan method POST atau DELETE');
            }
            $controller->deleteMember($data);
            break;
        default:
            Response::error('Action tidak ditemukan. Gunakan: login, register, logout, me, change-password, check, pending_members, approve_member, active_members, dashboard_stats, all_members, delete_member', 404);
    }
} catch (Exception $e) {
    error_log("Auth API Error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    if (defined('APP_DEBUG') && APP_DEBUG) {
        Response::error('Error: ' . $e->getMessage(), 500, ['trace' => $e->getTraceAsString()]);
    } else {
        Response::serverError('Terjadi kesalahan server');
    }
}