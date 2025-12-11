<?php
// src/backend/controllers/AuthController.php

require_once MODELS_PATH . '/User.php';
require_once MODELS_PATH . '/Profile.php';

// Asumsi: Helper ini berisi fungsi seperti validate_required, login_user, require_admin, dll.
require_once HELPERS_PATH . '/auth_helper.php';
require_once HELPERS_PATH . '/EmailService.php'; 

// --- KONSTANTA ---
// Asumsi: ROLE_ANGGOTA didefinisikan di config/init atau helper
if (!defined('ROLE_ANGGOTA')) define('ROLE_ANGGOTA', 'anggota');
if (!defined('ROLE_ADMIN')) define('ROLE_ADMIN', 'admin'); 
// Status Persetujuan - hanya definisikan jika belum ada
if (!defined('IS_APPROVED_PENDING')) define('IS_APPROVED_PENDING', 0);
if (!defined('IS_APPROVED_ACTIVE')) define('IS_APPROVED_ACTIVE', 1);
if (!defined('IS_APPROVED_REJECTED')) define('IS_APPROVED_REJECTED', 2);

class AuthController
{
    private User $userModel;
    private Profile $profileModel;

    public function __construct()
    {
        $this->userModel = new User();
        $this->profileModel = new Profile();
    }

    // ----------------------------------------------------------------------
    // 🔥 LOGIN HANDLER (Revisi: Menambahkan Pengecekan Approval)
    // ----------------------------------------------------------------------
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

        // Asumsi: findByEmail() mengambil kolom 'is_approved' dari tabel users
        $user = $this->userModel->findByEmail($email);

        if (!$user) {
            Response::error('Email atau password salah', 401);
        }

        if (!verify_password($password, $user['password'])) {
            Response::error('Email atau password salah', 401);
        }
        
        // PENCEGAHAN LOGIN JIKA STATUS PENDING
        if ($user['role'] == ROLE_ANGGOTA && $user['is_approved'] == IS_APPROVED_PENDING) {
            Response::error('Akun Anda belum disetujui oleh Admin. Silakan tunggu notifikasi email.', 403); // 403 Forbidden
        }

        login_user($user);

        error_log("Session after login: " . print_r($_SESSION, true));
        error_log("Session ID: " . session_id());

        $profile = $this->profileModel->findByUserId($user['user_id']);

        Response::success([
            'user' => [
                'user_id'    => $user['user_id'],
                'username'   => $user['username'],
                'email'      => $user['email'],
                'role'       => $user['role'],
                // PENTING: Sertakan status approval dalam respons
                'is_approved' => $user['is_approved'] ?? IS_APPROVED_PENDING 
            ],
            'profile' => $profile ? [
                'full_name'      => $profile['full_name'],
                'npm'            => $profile['npm'],
                'department'     => $profile['department'],
                'activity_status' => $profile['activity_status'],
                'profile_photo'  => $profile['profile_photo']
            ] : null
        ], 'Login berhasil');
    }

    // ----------------------------------------------------------------------
    // 🔥 REGISTER HANDLER (Revisi: Menambahkan Status Pending)
    // ----------------------------------------------------------------------
    public function register(array $data): void
    {
        $errors = validate_required(['username', 'email', 'password', 'password_confirm'], $data); // Tambah password_confirm untuk validasi

        // --- VALIDASI ---
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
        // --- END VALIDASI ---

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

            // PENTING: Tambahkan 'is_approved' => IS_APPROVED_PENDING (0)
            $userId = $this->userModel->create([
                'username'    => $username,
                'email'       => $email,
                'password'    => $data['password'],
                'role'        => ROLE_ANGGOTA,
                'is_approved' => IS_APPROVED_PENDING // Status default: Pending
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
            ], 'Registrasi berhasil. Akun Anda menunggu persetujuan Admin.');
        } catch (Exception $e) {
            Database::rollback();
            error_log("Registration failed: " . $e->getMessage()); 
            Response::serverError('Gagal melakukan registrasi');
        }
    }

    // ----------------------------------------------------------------------
    // 🆕 NEW: MENGAMBIL DAFTAR ANGGOTA PENDING (Hanya untuk Admin)
    // ----------------------------------------------------------------------
    public function getPendingMembers(): void
    {
        // Asumsi: require_admin() adalah helper yang menghentikan eksekusi jika bukan admin
        require_admin(); 

        // Asumsi: userModel memiliki metode findPendingMembers()
        $pendingMembers = $this->userModel->findPendingMembers();

        Response::success(sanitize_output($pendingMembers), 'Data anggota pending berhasil dimuat.');
    }

    // ----------------------------------------------------------------------
    // 🆕 NEW: PERSETUJUAN ANGGOTA (Update DB & Kirim Email)
    // ----------------------------------------------------------------------
    public function approveMember(array $data): void
    {
        require_admin(); // Otorisasi: Hanya Admin

        $memberId = $data['member_id'] ?? null;
        $statusAction = $data['status'] ?? null; // 'approved' atau 'rejected'

        if (!$memberId || !in_array($statusAction, ['approved', 'rejected'])) {
            Response::validationError(['input' => 'ID anggota atau status aksi tidak valid.']);
        }
        
        $user = $this->userModel->findById($memberId);
        if (!$user) {
            Response::notFound('Anggota tidak ditemukan.');
        }

        try {
            Database::beginTransaction();

            $newApprovalStatus = ($statusAction == 'approved') ? IS_APPROVED_ACTIVE : IS_APPROVED_REJECTED;
            
            // 1. Update Database
            // Asumsi: updateApprovalStatus tersedia di User Model
            $this->userModel->updateApprovalStatus($memberId, $newApprovalStatus);
            
            // 2. Kirim Email Notifikasi
            $isEmailSent = EmailService::sendApprovalNotification(
                $user['email'], 
                $user['username'], 
                $statusAction
            );
            
            Database::commit();

            $message = ($statusAction == 'approved') 
                ? 'Anggota berhasil disetujui dan kini aktif.' 
                : 'Anggota berhasil ditolak.';
            
            if ($isEmailSent) {
                $message .= " Email notifikasi telah dikirim.";
            } else {
                 $message .= " Peringatan: Gagal mengirim email notifikasi. (Periksa konfigurasi server mail)";
            }

            Response::success(null, $message);

        } catch (Exception $e) {
            Database::rollback();
            error_log("Approval/Rejection failed: " . $e->getMessage()); 
            Response::serverError('Gagal memproses aksi persetujuan');
        }
    }

    // ----------------------------------------------------------------------
    // [Metode lainnya yang tidak diubah]
    // ----------------------------------------------------------------------
    
    public function logout(): void
    {
        logout_user();
        Response::success(null, 'Logout berhasil');
    }

    public function me(): void
    {
        require_login();
        
        $userId = get_current_user_id();
        // Asumsi findWithProfile sekarang juga mengambil 'is_approved'
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

        // ... (Validasi) ...

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

    public function getActiveMembers(): void
    {
        require_admin();
        $members = $this->userModel->findActiveMembers();
        Response::success($members);
    }

    public function getAllMembers(): void
    {
        require_login();
        $page = (int) (Request::query('page') ?? 1);
        $limit = (int) (Request::query('limit') ?? 50);
        $members = $this->userModel->findAllMembersWithProfile($page, $limit);
        $total = $this->userModel->countActiveMembers();
        Response::success([
            'members' => $members,
            'total' => $total,
            'page' => $page,
            'limit' => $limit
        ]);
    }

    public function getDashboardStats(): void
    {
        require_admin();
        
        $totalMembers = $this->userModel->countActiveMembers();
        $pendingMembers = $this->userModel->countPendingMembers();
        $totalEvents = $this->eventModel()->countAll();
        $upcomingEvents = $this->eventModel()->countUpcoming();
        $completedEvents = $this->eventModel()->countCompleted();
        $thisMonthEvents = $this->eventModel()->countThisMonth();
        
        Response::success([
            'total_members' => $totalMembers,
            'pending_members' => $pendingMembers,
            'total_events' => $totalEvents,
            'upcoming_events' => $upcomingEvents,
            'completed_events' => $completedEvents,
            'this_month_events' => $thisMonthEvents
        ]);
    }

    private function eventModel(): Event
    {
        static $model = null;
        if ($model === null) {
            require_once MODELS_PATH . '/Event.php';
            $model = new Event();
        }
        return $model;
    }

    /**
     * Delete member (admin only)
     * This will delete both user and profile data
     */
    public function deleteMember(array $data): void
    {
        require_admin();
        
        $memberId = (int) ($data['member_id'] ?? 0);
        
        if ($memberId <= 0) {
            Response::error('ID anggota diperlukan', 400);
        }
        
        // Check if member exists
        $user = $this->userModel->findById($memberId);
        if (!$user) {
            Response::notFound('Anggota tidak ditemukan');
        }
        
        // Prevent deleting admin accounts
        if ($user['role'] === ROLE_ADMIN) {
            Response::error('Tidak dapat menghapus akun admin', 403);
        }
        
        try {
            Database::beginTransaction();
            
            // Delete profile first (FK constraint)
            $this->profileModel->delete($memberId);
            
            // Delete user
            $this->userModel->delete($memberId);
            
            Database::commit();
            
            Response::success(null, 'Anggota berhasil dihapus');
            
        } catch (Exception $e) {
            Database::rollback();
            error_log("Delete member failed: " . $e->getMessage());
            Response::serverError('Gagal menghapus anggota');
        }
    }
}