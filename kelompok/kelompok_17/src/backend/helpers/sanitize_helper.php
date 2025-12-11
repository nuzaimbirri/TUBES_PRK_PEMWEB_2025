<?php
function sanitize_string(string $string): string
{
    return htmlspecialchars(trim($string), ENT_QUOTES, 'UTF-8');
}
function sanitize_email(string $email): string
{
    return filter_var(trim($email), FILTER_SANITIZE_EMAIL);
}
function sanitize_int($value): int
{
    return (int) filter_var($value, FILTER_SANITIZE_NUMBER_INT);
}
function sanitize_float($value): float
{
    return (float) filter_var($value, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
}
function sanitize_url(string $url): string
{
    return filter_var(trim($url), FILTER_SANITIZE_URL);
}
function sanitize_filename(string $filename): string
{
    $filename = preg_replace('/[^a-zA-Z0-9_\-\.]/', '', $filename);
    $filename = preg_replace('/\.+/', '.', $filename);
    $filename = trim($filename, '.');
    return $filename;
}
function sanitize_array(array $array): array
{
    $sanitized = [];
    foreach ($array as $key => $value) {
        $key = sanitize_string($key);
        if (is_array($value)) {
            $sanitized[$key] = sanitize_array($value);
        } elseif (is_string($value)) {
            $sanitized[$key] = sanitize_string($value);
        } else {
            $sanitized[$key] = $value;
        }
    }
    return $sanitized;
}
function escape_html(string $string): string
{
    return htmlspecialchars($string, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}
function escape_js(string $string): string
{
    return addslashes($string);
}
function strip_all_tags(string $string, array $allowedTags = []): string
{
    if (empty($allowedTags)) {
        return strip_tags($string);
    }
    $allowed = '<' . implode('><', $allowedTags) . '>';
    return strip_tags($string, $allowed);
}
function sanitize_sql(string $string): string
{
    $string = trim($string);
    $string = stripslashes($string);
    return addslashes($string);
}
