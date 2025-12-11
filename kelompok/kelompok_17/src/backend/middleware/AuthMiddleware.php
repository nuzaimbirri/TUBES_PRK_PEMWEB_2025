<?php
class AuthMiddleware
{
    public static function check(): void
    {
        Session::start();
        if (!Session::isLoggedIn()) {
            Response::unauthorized('Silakan login terlebih dahulu');
        }
        if (is_session_expired(SESSION_LIFETIME)) {
            Session::destroy();
            Response::unauthorized('Sesi Anda telah berakhir. Silakan login kembali.');
        }
    }
    public static function isAuthenticated(): bool
    {
        Session::start();
        return Session::isLoggedIn() && !is_session_expired(SESSION_LIFETIME);
    }
    public static function guest(): void
    {
        Session::start();
        if (Session::isLoggedIn()) {
            Response::error('Anda sudah login', 400);
        }
    }
}
