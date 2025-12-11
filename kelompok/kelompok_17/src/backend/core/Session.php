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
            ini_set('session.cookie_path', '/');
            ini_set('session.cookie_domain', '');
            ini_set('session.cookie_samesite', 'Lax');
            session_name(SESSION_NAME);
            session_set_cookie_params([
                'lifetime' => defined('SESSION_LIFETIME') ? SESSION_LIFETIME : 86400,
                'path' => '/',
                'domain' => '',
                'secure' => false, // Set true jika menggunakan HTTPS
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
    public static function regenerate(): void
    {
        self::start();
        session_regenerate_id(true);
    }
    public static function isLoggedIn(): bool
    {
        return self::has('user_id') && self::get('user_id') !== null;
    }
    public static function getUserId(): ?int
    {
        return self::get('user_id');
    }
    public static function getUsername(): ?string
    {
        return self::get('username');
    }
    public static function getEmail(): ?string
    {
        return self::get('email');
    }
    public static function getRole(): ?string
    {
        return self::get('role');
    }
    public static function isAdmin(): bool
    {
        return self::getRole() === ROLE_ADMIN;
    }
    public static function isAnggota(): bool
    {
        return self::getRole() === ROLE_ANGGOTA;
    }
    public static function flash(string $key, $value = null)
    {
        if ($value === null) {
            $flashValue = self::get('_flash_' . $key);
            self::remove('_flash_' . $key);
            return $flashValue;
        }
        self::set('_flash_' . $key, $value);
    }
}
