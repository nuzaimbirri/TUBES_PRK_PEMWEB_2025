<?php

class Session
{
    private static bool $started = false;

    public static function start(): void
    {
        if (self::$started) {
            return;
        }

        if (session_status() === PHP_SESSION_NONE) {
            ini_set('session.use_strict_mode', 1);
            ini_set('session.use_only_cookies', 1);
            ini_set('session.cookie_httponly', 1);

            session_name(SESSION_NAME);

            session_set_cookie_params([
                'lifetime' => SESSION_LIFETIME,
                'path' => '/',
                'secure' => false, // <--- UBAH JADI FALSE (supaya jalan di http://localhost)
                'httponly' => true,
                'samesite' => 'Lax'
            ]);

            session_start();
            self::$started = true;

            if (!isset($_SESSION['_created'])) {
                $_SESSION['_created'] = time();
            } elseif (time() - $_SESSION['_created'] > 1800) {
                session_regenerate_id(true);
                $_SESSION['_created'] = time();
            }
        }
    }

    public static function set(string $key, $value): void
    {
        self::start();
        $_SESSION[$key] = $value;
    }

    public static function get(string $key, $default = null)
    {
        self::start();
        return $_SESSION[$key] ?? $default;
    }

    public static function has(string $key): bool
    {
        self::start();
        return isset($_SESSION[$key]);
    }

    public static function remove(string $key): void
    {
        self::start();
        unset($_SESSION[$key]);
    }

    public static function destroy(): void
    {
        self::start();

        $_SESSION = [];

        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }

        session_destroy();
        self::$started = false;
    }

    public static function isLoggedIn(): bool
    {
        return self::has('user_id') && self::get('user_id') !== null;
    }

    public static function getUserId(): ?int
    {
        $userId = self::get('user_id');
        return $userId !== null ? (int) $userId : null;
    }

    public static function getRole(): ?string
    {
        return self::get('role');
    }

    public static function isAdmin(): bool
    {
        return self::getRole() === ROLE_ADMIN;
    }

    public static function setFlash(string $type, string $message): void
    {
        self::set('_flash', [
            'type' => $type,
            'message' => $message
        ]);
    }

    public static function getFlash(): ?array
    {
        $flash = self::get('_flash');
        self::remove('_flash');
        return $flash;
    }
}
