<?php
if (basename($_SERVER['PHP_SELF']) === 'init.php') {
    http_response_code(403);
    exit('Direct access forbidden');
}
error_reporting(E_ALL);
ini_set('display_errors', 0);
date_default_timezone_set('Asia/Jakarta');
define('BASE_PATH', __DIR__);
define('CONFIG_PATH', BASE_PATH . '/config');
define('CORE_PATH', BASE_PATH . '/core');
define('MODELS_PATH', BASE_PATH . '/models');
define('CONTROLLERS_PATH', BASE_PATH . '/controllers');
define('HELPERS_PATH', BASE_PATH . '/helpers');
define('MIDDLEWARE_PATH', BASE_PATH . '/middleware');
require_once CONFIG_PATH . '/constants.php';
require_once CONFIG_PATH . '/app.php';
require_once CORE_PATH . '/Database.php';
require_once CORE_PATH . '/Session.php';
require_once CORE_PATH . '/Response.php';
require_once CORE_PATH . '/Request.php';
require_once HELPERS_PATH . '/sanitize_helper.php';
require_once HELPERS_PATH . '/validation_helper.php';
require_once HELPERS_PATH . '/auth_helper.php';
require_once HELPERS_PATH . '/upload_helper.php';
require_once HELPERS_PATH . '/response_helper.php';
Session::start();
