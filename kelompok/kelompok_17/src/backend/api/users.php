<?php
require_once __DIR__ . '/../init.php';
Response::setCorsHeaders();
Response::handlePreflight();
require_once CONTROLLERS_PATH . '/UserController.php';
$controller = new UserController();
$action = Request::query('action', '');
$id = (int) Request::query('id', 0);
$data = Request::all();
try {
    switch ($action) {
        case 'list':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            $controller->index();
            break;
        case 'show':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            if ($id <= 0) {
                Response::error('ID user diperlukan', 400);
            }
            $controller->show($id);
            break;
        case 'create':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            $controller->store($data);
            break;
        case 'update':
            if (!Request::isPost() && !Request::isPut()) {
                Response::methodNotAllowed('Gunakan method POST atau PUT');
            }
            if ($id <= 0) {
                Response::error('ID user diperlukan', 400);
            }
            $controller->update($id, $data);
            break;
        case 'delete':
            if (!Request::isPost() && !Request::isDelete()) {
                Response::methodNotAllowed('Gunakan method POST atau DELETE');
            }
            if ($id <= 0) {
                Response::error('ID user diperlukan', 400);
            }
            $controller->destroy($id);
            break;
        case 'search':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            $controller->search();
            break;
        case 'statistics':
            if (!Request::isGet()) {
                Response::methodNotAllowed('Gunakan method GET');
            }
            $controller->statistics();
            break;
        case 'update-status':
            if (!Request::isPost()) {
                Response::methodNotAllowed('Gunakan method POST');
            }
            if ($id <= 0) {
                Response::error('ID user diperlukan', 400);
            }
            $controller->updateStatus($id, $data);
            break;
        default:
            Response::error('Action tidak ditemukan. Gunakan: list, show, create, update, update-status, delete, search, statistics', 404);
    }
} catch (Exception $e) {
    error_log("Users API Error: " . $e->getMessage());
    Response::serverError('Terjadi kesalahan server');
}
