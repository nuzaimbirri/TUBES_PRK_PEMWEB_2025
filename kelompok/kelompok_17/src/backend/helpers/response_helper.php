<?php
function format_pagination(array $data, int $page, int $limit, int $total): array
{
    $totalPages = ceil($total / $limit);
    return [
        'data' => $data,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $limit,
            'total_items' => $total,
            'total_pages' => $totalPages,
            'has_prev' => $page > 1,
            'has_next' => $page < $totalPages
        ]
    ];
}
function format_date_id(string $date, bool $withTime = false): string
{
    $months = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret',
        4 => 'April', 5 => 'Mei', 6 => 'Juni',
        7 => 'Juli', 8 => 'Agustus', 9 => 'September',
        10 => 'Oktober', 11 => 'November', 12 => 'Desember'
    ];
    $timestamp = strtotime($date);
    $day = date('d', $timestamp);
    $month = $months[(int)date('m', $timestamp)];
    $year = date('Y', $timestamp);
    $formatted = "$day $month $year";
    if ($withTime) {
        $time = date('H:i', $timestamp);
        $formatted .= " $time WIB";
    }
    return $formatted;
}
function format_time_ago(string $datetime): string
{
    $timestamp = strtotime($datetime);
    $diff = time() - $timestamp;
    if ($diff < 60) {
        return 'Baru saja';
    }
    $intervals = [
        31536000 => 'tahun',
        2592000 => 'bulan',
        604800 => 'minggu',
        86400 => 'hari',
        3600 => 'jam',
        60 => 'menit'
    ];
    foreach ($intervals as $seconds => $label) {
        $interval = floor($diff / $seconds);
        if ($interval >= 1) {
            return "$interval $label yang lalu";
        }
    }
    return 'Baru saja';
}
function format_file_size(int $bytes, int $decimals = 2): string
{
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, $decimals) . ' ' . $units[$pow];
}
function get_upload_url(string $filename, string $type = 'profile'): string
{
    if (empty($filename)) {
        return '';
    }
    $appConfig = require CONFIG_PATH . '/app.php';
    $baseUrl = $appConfig['base_url'];
    switch ($type) {
        case 'profile':
            return $baseUrl . 'upload/profile/' . $filename;
        case 'event':
            return $baseUrl . 'upload/event/' . $filename;
        default:
            return $baseUrl . 'upload/' . $filename;
    }
}
function format_number_padded(int $number, int $length = 4): string
{
    return str_pad($number, $length, '0', STR_PAD_LEFT);
}
function truncate_text(string $text, int $maxLength = 100, string $suffix = '...'): string
{
    if (mb_strlen($text) <= $maxLength) {
        return $text;
    }
    return mb_substr($text, 0, $maxLength - mb_strlen($suffix)) . $suffix;
}
function sanitize_output(array $data, array $sensitiveFields = ['password']): array
{
    foreach ($sensitiveFields as $field) {
        if (isset($data[$field])) {
            unset($data[$field]);
        }
    }
    return $data;
}
function sanitize_output_list(array $dataList, array $sensitiveFields = ['password']): array
{
    return array_map(function ($data) use ($sensitiveFields) {
        return sanitize_output($data, $sensitiveFields);
    }, $dataList);
}
