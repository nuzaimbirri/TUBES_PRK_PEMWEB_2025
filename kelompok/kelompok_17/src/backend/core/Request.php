<?php
class Request
{
    private static ?array $jsonBody = null;
    public static function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }
    public static function isGet(): bool
    {
        return self::method() === 'GET';
    }
    public static function isPost(): bool
    {
        return self::method() === 'POST';
    }
    public static function isPut(): bool
    {
        return self::method() === 'PUT';
    }
    public static function isDelete(): bool
    {
        return self::method() === 'DELETE';
    }
    public static function isAjax(): bool
    {
        return isset($_SERVER['HTTP_X_REQUESTED_WITH']) 
            && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    }
    public static function getJsonBody(): array
    {
        if (self::$jsonBody === null) {
            $rawBody = file_get_contents('php://input');
            self::$jsonBody = json_decode($rawBody, true) ?? [];
        }
        return self::$jsonBody;
    }
    public static function all(): array
    {
        $data = array_merge($_GET, $_POST);
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'application/json') !== false) {
            $data = array_merge($data, self::getJsonBody());
        }
        return $data;
    }
    public static function get(string $key, $default = null)
    {
        $all = self::all();
        return $all[$key] ?? $default;
    }
    public static function query(string $key, $default = null)
    {
        return $_GET[$key] ?? $default;
    }
    public static function post(string $key, $default = null)
    {
        return $_POST[$key] ?? $default;
    }
    public static function file(string $key): ?array
    {
        return $_FILES[$key] ?? null;
    }
    public static function hasFile(string $key): bool
    {
        return isset($_FILES[$key]) && $_FILES[$key]['error'] === UPLOAD_ERR_OK;
    }
    public static function header(string $key, $default = null)
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $key));
        return $_SERVER[$key] ?? $default;
    }
    public static function getAuthorizationHeader(): ?string
    {
        if (isset($_SERVER['Authorization'])) {
            return $_SERVER['Authorization'];
        }
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            return $_SERVER['HTTP_AUTHORIZATION'];
        }
        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (isset($headers['Authorization'])) {
                return $headers['Authorization'];
            }
        }
        return null;
    }
    public static function getBearerToken(): ?string
    {
        $header = self::getAuthorizationHeader();
        if ($header && preg_match('/Bearer\s(\S+)/', $header, $matches)) {
            return $matches[1];
        }
        return null;
    }
    public static function ip(): string
    {
        $keys = [
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        ];
        foreach ($keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                if (strpos($ip, ',') !== false) {
                    $ip = explode(',', $ip)[0];
                }
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        return '0.0.0.0';
    }
    public static function userAgent(): string
    {
        return $_SERVER['HTTP_USER_AGENT'] ?? '';
    }
    public static function only(array $keys): array
    {
        $all = self::all();
        return array_intersect_key($all, array_flip($keys));
    }
    public static function except(array $keys): array
    {
        $all = self::all();
        return array_diff_key($all, array_flip($keys));
    }
}
