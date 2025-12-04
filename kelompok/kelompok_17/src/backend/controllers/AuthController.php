<?php

require_once MODELS_PATH . '/User.php';
require_once MODELS_PATH . '/Profile.php';

class AuthController
{
    private User $userModel;
    private Profile $profileModel;

    public function __construct()
    {
        $this->userModel = new User();
        $this->profileModel = new Profile();
    }

    public function login(array $data): void
    {
        $errors = validate_required(['email', 'password'], $data);

        if (!empty($errors)) {
            Response::validationError($errors);
        }

        $email = sanitize_email($data['email']);
        $password = $data['password'];

        if (!validate_email($email)) {
            Response::validationError(['email' => 'Format email tidak valid']);
        }

        $user = $this->userModel->findByEmail($email);

        if (!$user) {
            Response::error('Email atau password salah', 401);
        }

        if (!verify_password($password, $user['password'])) {
            Response::error('Email atau password salah', 401);
        }

        login_user($user);

        // DEBUG: Cek apakah session tersimpan
        error_log("Session after login: " . print_r($_SESSION, true));
        error_log("Session ID: " . session_id());

        $profile = $this->profileModel->findByUserId($user['user_id']);

        Response::success([
            'user' => [
                'user_id'  => $user['user_id'],
                'username' => $user['username'],
                'email'    => $user['email'],
                'role'     => $user['role']
            ],
            'profile' => $profile ? [
                'full_name'       => $profile['full_name'],
                'npm'             => $profile['npm'],
                'department'      => $profile['department'],
                'activity_status' => $profile['activity_status'],
                'profile_photo'   => $profile['profile_photo']
            ] : null
        ], 'Login berhasil');
    }

    public function register(array $data): void
    {
        $errors = validate_required(['username', 'email', 'password'], $data);

        if (isset($data['username'])) {
            $usernameErrors = validate_username($data['username']);
            if (!empty($usernameErrors)) {
                $errors['username'] = $usernameErrors[0];
            }
        }

        if (isset($data['email']) && !validate_email($data['email'])) {
            $errors['email'] = 'Format email tidak valid';
        }

        if (isset($data['password']) && !validate_password_simple($data['password'], 6)) {
            $errors['password'] = 'Password minimal 6 karakter';
        }

        if (isset($data['password_confirm']) && $data['password'] !== $data['password_confirm']) {
            $errors['password_confirm'] = 'Konfirmasi password tidak cocok';
        }

        if (!empty($errors)) {
            Response::validationError($errors);
        }

        $username = sanitize_string($data['username']);
        $email = sanitize_email($data['email']);

        if ($this->userModel->emailExists($email)) {
            Response::error('Email sudah terdaftar', 409);
        }

        if ($this->userModel->usernameExists($username)) {
            Response::error('Username sudah digunakan', 409);
        }

        try {
            Database::beginTransaction();

            $userId = $this->userModel->create([
                'username' => $username,
                'email'    => $email,
                'password' => $data['password'],
                'role'     => ROLE_ANGGOTA
            ]);

            $this->profileModel->create([
                'user_id'   => $userId,
                'full_name' => $data['full_name'] ?? null,
                'npm'       => $data['npm'] ?? null
            ]);

            Database::commit();

            Response::created([
                'user_id'  => $userId,
                'username' => $username,
                'email'    => $email
            ], 'Registrasi berhasil');
        } catch (Exception $e) {
            Database::rollback();
            Response::serverError('Gagal melakukan registrasi');
        }
    }

    public function logout(): void
    {
        logout_user();
        Response::success(null, 'Logout berhasil');
    }

    public function me(): void
    {
        require_login();

        // DEBUG: Cek session saat request me
        error_log("Session in me(): " . print_r($_SESSION, true));
        error_log("Session ID in me(): " . session_id());

        $userId = get_current_user_id();
        $user = $this->userModel->findWithProfile($userId);

        if (!$user) {
            Response::notFound('User tidak ditemukan');
        }

        Response::success(sanitize_output($user));
    }

    public function changePassword(array $data): void
    {
        require_login();

        $errors = validate_required(['current_password', 'new_password'], $data);

        if (!empty($errors)) {
            Response::validationError($errors);
        }

        if (!validate_password_simple($data['new_password'], 6)) {
            Response::validationError(['new_password' => 'Password baru minimal 6 karakter']);
        }

        if (isset($data['confirm_password']) && $data['new_password'] !== $data['confirm_password']) {
            Response::validationError(['confirm_password' => 'Konfirmasi password tidak cocok']);
        }

        $userId = get_current_user_id();
        $user = $this->userModel->findById($userId);

        if (!verify_password($data['current_password'], $user['password'])) {
            Response::error('Password saat ini salah', 401);
        }

        $this->userModel->updatePassword($userId, $data['new_password']);

        Response::success(null, 'Password berhasil diubah');
    }

    public function checkSession(): void
    {
        Response::success([
            'logged_in' => is_logged_in(),
            'user_id'   => get_current_user_id(),
            'role'      => Session::getRole()
        ]);
    }
}
