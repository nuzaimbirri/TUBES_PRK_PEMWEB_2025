<?php

require_once MODELS_PATH . '/User.php';
require_once MODELS_PATH . '/Profile.php';

class UserController
{
    private User $userModel;
    private Profile $profileModel;

    public function __construct()
    {
        $this->userModel = new User();
        $this->profileModel = new Profile();
    }

    public function index(): void
    {
        require_admin();
        
        $page = (int) (Request::query('page') ?? DEFAULT_PAGE);
        $limit = (int) (Request::query('limit') ?? DEFAULT_LIMIT);
        
        $limit = min($limit, MAX_LIMIT);
        
        $users = $this->userModel->getAll($page, $limit);
        $total = $this->userModel->count();
        
        Response::success(format_pagination(
            sanitize_output_list($users),
            $page,
            $limit,
            $total
        ));
    }

    public function show(int $id): void
    {
        require_login();
        
        if (!is_admin() && get_current_user_id() !== $id) {
            Response::forbidden();
        }
        
        $user = $this->userModel->findWithProfile($id);
        
        if (!$user) {
            Response::notFound('User tidak ditemukan');
        }
        
        Response::success(sanitize_output($user));
    }

    public function store(array $data): void
    {
        require_admin();
        
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
        
        if (isset($data['role']) && !validate_in_array($data['role'], ALLOWED_ROLES)) {
            $errors['role'] = 'Role tidak valid';
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
                'role'     => $data['role'] ?? ROLE_ANGGOTA
            ]);
            
            $this->profileModel->create(['user_id' => $userId]);
            
            Database::commit();
            
            Response::created([
                'user_id'  => $userId,
                'username' => $username,
                'email'    => $email,
                'role'     => $data['role'] ?? ROLE_ANGGOTA
            ], 'User berhasil dibuat');
            
        } catch (Exception $e) {
            Database::rollback();
            Response::serverError('Gagal membuat user');
        }
    }

    public function update(int $id, array $data): void
    {
        require_login();
        
        if (!is_admin() && get_current_user_id() !== $id) {
            Response::forbidden();
        }
        
        $user = $this->userModel->findById($id);
        
        if (!$user) {
            Response::notFound('User tidak ditemukan');
        }
        
        $errors = [];
        $updateData = [];
        
        if (isset($data['username'])) {
            $usernameErrors = validate_username($data['username']);
            if (!empty($usernameErrors)) {
                $errors['username'] = $usernameErrors[0];
            } elseif ($this->userModel->usernameExists($data['username'], $id)) {
                $errors['username'] = 'Username sudah digunakan';
            } else {
                $updateData['username'] = sanitize_string($data['username']);
            }
        }
        
        if (isset($data['email'])) {
            if (!validate_email($data['email'])) {
                $errors['email'] = 'Format email tidak valid';
            } elseif ($this->userModel->emailExists($data['email'], $id)) {
                $errors['email'] = 'Email sudah terdaftar';
            } else {
                $updateData['email'] = sanitize_email($data['email']);
            }
        }
        
        if (isset($data['role']) && is_admin()) {
            if (!validate_in_array($data['role'], ALLOWED_ROLES)) {
                $errors['role'] = 'Role tidak valid';
            } else {
                $updateData['role'] = $data['role'];
            }
        }
        
        if (!empty($errors)) {
            Response::validationError($errors);
        }
        
        if (empty($updateData)) {
            Response::error('Tidak ada data yang diubah', 400);
        }
        
        $this->userModel->update($id, $updateData);
        
        Response::success(null, 'User berhasil diupdate');
    }

    public function destroy(int $id): void
    {
        require_admin();
        
        if (get_current_user_id() === $id) {
            Response::error('Tidak dapat menghapus akun sendiri', 400);
        }
        
        $user = $this->userModel->findById($id);
        
        if (!$user) {
            Response::notFound('User tidak ditemukan');
        }
        
        try {
            Database::beginTransaction();
            
            $this->profileModel->delete($id);
            
            $this->userModel->delete($id);
            
            Database::commit();
            
            Response::success(null, 'User berhasil dihapus');
            
        } catch (Exception $e) {
            Database::rollback();
            Response::serverError('Gagal menghapus user');
        }
    }

    public function search(): void
    {
        require_admin();
        
        $keyword = sanitize_string(Request::query('q') ?? '');
        
        if (empty($keyword)) {
            Response::error('Keyword pencarian diperlukan', 400);
        }
        
        $page = (int) (Request::query('page') ?? DEFAULT_PAGE);
        $limit = (int) (Request::query('limit') ?? DEFAULT_LIMIT);
        
        $users = $this->userModel->search($keyword, $page, $limit);
        
        Response::success(sanitize_output_list($users));
    }

    public function statistics(): void
    {
        require_admin();
        
        Response::success([
            'total'   => $this->userModel->count(),
            'admin'   => $this->userModel->countByRole(ROLE_ADMIN),
            'anggota' => $this->userModel->countByRole(ROLE_ANGGOTA)
        ]);
    }

    public function updateStatus(int $id, array $data): void
    {
        require_admin();
        
        $user = $this->userModel->findById($id);
        
        if (!$user) {
            Response::notFound('User tidak ditemukan');
        }
        
        if (!isset($data['status'])) {
            Response::error('Status diperlukan', 400);
        }
        
        $validStatuses = ['aktif', 'nonaktif'];
        if (!in_array($data['status'], $validStatuses)) {
            Response::error('Status tidak valid. Gunakan: aktif atau nonaktif', 400);
        }
        
        $isApproved = ($data['status'] === 'aktif') ? IS_APPROVED_ACTIVE : IS_APPROVED_PENDING;
        
        $this->userModel->update($id, ['is_approved' => $isApproved]);
        
        $profile = $this->profileModel->findByUserId($id);
        if ($profile) {
            $activityStatus = ($data['status'] === 'aktif') ? 'aktif' : 'non-aktif';
            $this->profileModel->update($id, ['activity_status' => $activityStatus]);
        }
        
        Response::success(null, 'Status user berhasil diupdate');
    }
}
