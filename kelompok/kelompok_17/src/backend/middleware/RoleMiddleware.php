<?php
class RoleMiddleware
{
    public static function requireAdmin(): void
    {
        AuthMiddleware::check();
        if (!Session::isAdmin()) {
            Response::forbidden('Akses ditolak. Halaman ini khusus admin.');
        }
    }
    public static function require($roles): void
    {
        AuthMiddleware::check();
        $userRole = Session::getRole();
        if (is_array($roles)) {
            if (!in_array($userRole, $roles, true)) {
                Response::forbidden('Akses ditolak. Anda tidak memiliki izin.');
            }
        } else {
            if ($userRole !== $roles) {
                Response::forbidden('Akses ditolak. Anda tidak memiliki izin.');
            }
        }
    }
    public static function hasRole($roles): bool
    {
        if (!AuthMiddleware::isAuthenticated()) {
            return false;
        }
        $userRole = Session::getRole();
        if (is_array($roles)) {
            return in_array($userRole, $roles, true);
        }
        return $userRole === $roles;
    }
    public static function isAdmin(): bool
    {
        return self::hasRole(ROLE_ADMIN);
    }
    public static function isOwner(int $resourceOwnerId): bool
    {
        if (!AuthMiddleware::isAuthenticated()) {
            return false;
        }
        return Session::getUserId() === $resourceOwnerId;
    }
    public static function requireOwnerOrAdmin(int $resourceOwnerId): void
    {
        AuthMiddleware::check();
        if (!self::isOwner($resourceOwnerId) && !self::isAdmin()) {
            Response::forbidden('Akses ditolak. Anda bukan pemilik atau admin.');
        }
    }
}
