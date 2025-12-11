<?php
if (!defined('BASE_PATH')) {
    http_response_code(403);
    exit('Direct access forbidden');
}
return [
    'host' => 'localhost',
    'port' => 3306,
    'dbname' => 'db_simora',
    'username' => 'root',
    'password' => '',
    'charset' => 'utf8mb4',
    'options' => [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_STRINGIFY_FETCHES  => false,
    ]
];
