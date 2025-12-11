<?php
function hash_password(string $password): string
{
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}
function verify_password(string $password, string $hash): bool
{
    return password_verify($password, $hash);
}
function needs_rehash(string $hash): bool
{
    return password_needs_rehash($hash, PASSWORD_BCRYPT, ['cost' => 12]);
}
function generate_token(int $length = 32): string
{
    return bin2hex(random_bytes($length / 2));
}
function generate_csrf_token(): string
{
    $token = generate_token(32);
    Session::set('csrf_token', $token);
    return $token;
}
function validate_csrf_token(string $token): bool
{
    $storedToken = Session::get('csrf_token');
    if ($storedToken === null) {
        return false;
    }
    return hash_equals($storedToken, $token);
}
function is_logged_in(): bool
{
    return Session::isLoggedIn();
}
function is_admin(): bool
{
    return Session::isAdmin();
}
function has_role($roles): bool
{
    $userRole = Session::getRole();
    if ($userRole === null) {
        return false;
    }
    if (is_array($roles)) {
        return in_array($userRole, $roles, true);
    }
    return $userRole === $roles;
}
function get_current_user_id(): ?int
{
    return Session::getUserId();
}
function require_login(bool $returnJson = true, string $redirectUrl = '/login.php'): void
{
    if (!is_logged_in()) {
        if ($returnJson) {
            Response::unauthorized('Silakan login terlebih dahulu');
        } else {
            header('Location: ' . $redirectUrl);
            exit;
        }
    }
}
function require_admin(bool $returnJson = true): void
{
    require_login($returnJson);
    if (!is_admin()) {
        if ($returnJson) {
            Response::forbidden('Akses khusus admin');
        } else {
            header('Location: /403.php');
            exit;
        }
    }
}
function require_role($roles, bool $returnJson = true): void
{
    require_login($returnJson);
    if (!has_role($roles)) {
        if ($returnJson) {
            Response::forbidden('Anda tidak memiliki akses');
        } else {
            header('Location: /403.php');
            exit;
        }
    }
}
function login_user(array $user): void
{
    Session::set('user_id', $user['user_id']);
    Session::set('username', $user['username']);
    Session::set('email', $user['email']);
    Session::set('role', $user['role']);
    Session::set('logged_in_at', time());
    session_regenerate_id(true);
}
function logout_user(): void
{
    Session::destroy();
}
function is_session_expired(int $maxAge = 3600): bool
{
    $loggedInAt = Session::get('logged_in_at');
    if ($loggedInAt === null) {
        return true;
    }
    return (time() - $loggedInAt) > $maxAge;
}
