<?php

require_once MODELS_PATH . '/Profile.php';
require_once MODELS_PATH . '/User.php';

class ProfileController
{
    private Profile $profileModel;
    private User $userModel;

    public function __construct()
    {
        $this->profileModel = new Profile();
        $this->userModel = new User();
    }

    public function index(): void
    {
        require_admin();
        
        $page = (int) (Request::query('page') ?? DEFAULT_PAGE);
        $limit = (int) (Request::query('limit') ?? DEFAULT_LIMIT);
        
        $profiles = $this->profileModel->getAll($page, $limit);
        $total = $this->profileModel->count();
        
        Response::success(format_pagination($profiles, $page, $limit, $total));
    }

    public function me(): void
    {
        require_login();
        
        $userId = get_current_user_id();
        $profile = $this->profileModel->findWithUser($userId);
        
        if (!$profile) {
            $user = $this->userModel->findById($userId);
            Response::success([
                'user_id'         => $userId,
                'username'        => $user['username'],
                'email'           => $user['email'],
                'role'            => $user['role'],
                'full_name'       => null,
                'npm'             => null,
                'department'      => null,
                'activity_status' => STATUS_ACTIVE,
                'profile_photo'   => null
            ]);
            return;
        }
        
        Response::success($profile);
    }

    public function show(int $userId): void
    {
        require_login();
        
        if (!is_admin() && get_current_user_id() !== $userId) {
            Response::forbidden();
        }
        
        $profile = $this->profileModel->findWithUser($userId);
        
        if (!$profile) {
            Response::notFound('Profile tidak ditemukan');
        }
        
        Response::success($profile);
    }

    public function update(array $data): void
    {
        require_login();
        
        $userId = get_current_user_id();
        
        if (is_admin() && isset($data['user_id'])) {
            $userId = (int) $data['user_id'];
        }
        
        $errors = [];
        $updateData = [];
        
        if (isset($data['full_name'])) {
            if (!validate_length($data['full_name'], 2, 100)) {
                $errors['full_name'] = 'Nama lengkap harus 2-100 karakter';
            } else {
                $updateData['full_name'] = sanitize_string($data['full_name']);
            }
        }
        
        if (isset($data['npm'])) {
            if (!empty($data['npm']) && !validate_npm($data['npm'])) {
                $errors['npm'] = 'Format NPM tidak valid';
            } else {
                $updateData['npm'] = sanitize_string($data['npm']);
            }
        }
        
        if (isset($data['department'])) {
            if (!validate_length($data['department'], 0, 100)) {
                $errors['department'] = 'Jurusan maksimal 100 karakter';
            } else {
                $updateData['department'] = sanitize_string($data['department']);
            }
        }
        
        if (isset($data['phone_number'])) {
            $updateData['phone_number'] = sanitize_string($data['phone_number']);
        }
        
        if (isset($data['address'])) {
            $updateData['address'] = sanitize_string($data['address']);
        }
        
        if (isset($data['activity_status'])) {
            if (!validate_in_array($data['activity_status'], [STATUS_ACTIVE, STATUS_INACTIVE])) {
                $errors['activity_status'] = 'Status aktivitas tidak valid';
            } else {
                $updateData['activity_status'] = $data['activity_status'];
            }
        }
        
        if (!empty($errors)) {
            Response::validationError($errors);
        }
        
        if (empty($updateData)) {
            Response::error('Tidak ada data yang diubah', 400);
        }
        
        $this->profileModel->upsert($userId, $updateData);
        
        Response::success(null, 'Profile berhasil diupdate');
    }

    public function uploadPhoto(): void
    {
        require_login();
        
        $userId = get_current_user_id();
        
        if (!Request::hasFile('photo')) {
            Response::error('File foto diperlukan', 400);
        }
        
        $file = Request::file('photo');
        
        $result = upload_profile_photo($file, $userId);
        
        if (!$result['success']) {
            Response::error($result['message'], 400);
        }
        
        $profile = $this->profileModel->findByUserId($userId);
        if (!$profile) {
            $this->profileModel->create([
                'user_id'       => $userId,
                'profile_photo' => $result['filename']
            ]);
        } else {
            $this->profileModel->updatePhoto($userId, $result['filename']);
        }
        
        Response::success([
            'filename' => $result['filename'],
            'photo'    => $result['filename'],
            'url'      => get_upload_url($result['filename'], 'profile')
        ], 'Foto profil berhasil diupload');
    }

    public function deletePhoto(): void
    {
        require_login();
        
        $userId = get_current_user_id();
        
        $this->profileModel->deletePhoto($userId);
        
        Response::success(null, 'Foto profil berhasil dihapus');
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
        
        $profiles = $this->profileModel->search($keyword, $page, $limit);
        
        Response::success($profiles);
    }

    public function byStatus(string $status): void
    {
        require_admin();
        
        if (!validate_in_array($status, [STATUS_ACTIVE, STATUS_INACTIVE])) {
            Response::error('Status tidak valid', 400);
        }
        
        $page = (int) (Request::query('page') ?? DEFAULT_PAGE);
        $limit = (int) (Request::query('limit') ?? DEFAULT_LIMIT);
        
        $profiles = $this->profileModel->getByStatus($status, $page, $limit);
        
        Response::success($profiles);
    }

    /**
     * Get single member profile by user_id (for admin)
     */
    public function get(int $userId): void
    {
        require_admin();
        
        // Use findFullMemberData to get complete data even if profile doesn't exist
        $member = $this->profileModel->findFullMemberData($userId);
        
        if (!$member) {
            Response::notFound('Anggota tidak ditemukan');
        }
        
        // Set default activity_status if null
        if (empty($member['activity_status'])) {
            $member['activity_status'] = STATUS_ACTIVE;
        }
        
        Response::success($member);
    }

    /**
     * Update member activity status (admin only)
     * Status: 'aktif', 'sp1', 'sp2', 'non-aktif'
     */
    public function updateStatus(array $data): void
    {
        require_admin();
        
        $userId = (int) ($data['user_id'] ?? 0);
        $newStatus = $data['activity_status'] ?? '';
        
        if ($userId <= 0) {
            Response::error('User ID diperlukan', 400);
        }
        
        // Valid status values
        $validStatuses = ['aktif', 'sp1', 'sp2', 'non-aktif'];
        
        if (!in_array($newStatus, $validStatuses)) {
            Response::error('Status tidak valid. Gunakan: aktif, sp1, sp2, non-aktif', 400);
        }
        
        // Check if user exists
        $user = $this->userModel->findById($userId);
        if (!$user) {
            Response::notFound('Anggota tidak ditemukan');
        }
        
        // Check if profile exists
        $profile = $this->profileModel->findByUserId($userId);
        
        if (!$profile) {
            // Create profile if not exists
            $this->profileModel->create([
                'user_id'         => $userId,
                'activity_status' => $newStatus
            ]);
        } else {
            // Update existing profile
            $this->profileModel->upsert($userId, [
                'activity_status' => $newStatus
            ]);
        }
        
        Response::success(null, 'Status anggota berhasil diubah menjadi ' . $newStatus);
    }
}
