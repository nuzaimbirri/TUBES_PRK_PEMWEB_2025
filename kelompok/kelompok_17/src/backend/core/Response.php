<?php

class Response
{
    public static function json(array $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);

        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');

        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function success($data = null, string $message = 'Berhasil', int $statusCode = 200): void
    {
        self::json([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ], $statusCode);
    }

    public static function error(string $message, int $statusCode = 400, $errors = null): void
    {
        $response = [
            'status' => 'error',
            'message' => $message
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        self::json($response, $statusCode);
    }

    public static function validationError(array $errors, string $message = 'Validasi gagal'): void
    {
        self::error($message, 422, $errors);
    }

    public static function unauthorized(string $message = 'Silakan login terlebih dahulu'): void
    {
        self::error($message, 401);
    }

    public static function forbidden(string $message = 'Anda tidak memiliki akses'): void
    {
        self::error($message, 403);
    }

    public static function notFound(string $message = 'Data tidak ditemukan'): void
    {
        self::error($message, 404);
    }

    public static function methodNotAllowed(string $message = 'Method tidak diizinkan'): void
    {
        self::error($message, 405);
    }

    public static function serverError(string $message = 'Terjadi kesalahan server'): void
    {
        self::error($message, 500);
    }

    public static function created($data = null, string $message = 'Data berhasil dibuat'): void
    {
        self::success($data, $message, 201);
    }

    public static function noContent(): void
    {
        http_response_code(204);
        exit;
    }

    public static function setCorsHeaders(
        string $origin = '*',
        array $methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        array $headers = ['Content-Type', 'Authorization']
    ): void {
        // Gunakan HTTP_ORIGIN dari request untuk mendukung credentials
        $allowedOrigin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : $origin;

        header("Access-Control-Allow-Origin: $allowedOrigin");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Allow-Methods: " . implode(', ', $methods));
        header("Access-Control-Allow-Headers: " . implode(', ', $headers));
        header("Access-Control-Max-Age: 86400");
    }

    public static function handlePreflight(): void
    {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            self::setCorsHeaders();
            http_response_code(204);
            exit;
        }
    }
}
