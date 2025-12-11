<?php
class User
{
    private PDO $db;
    private string $table = 'users';
    public function __construct()
    {
        $this->db = Database::getInstance();
    }
    public function findById(int $id): ?array
    {
        $sql = "SELECT * FROM {$this->table} WHERE user_id = :id LIMIT 1";
        $result = Database::fetchOne($sql, ['id' => $id]);
        return $result;
    }
    public function findByEmail(string $email): ?array
    {
        $sql = "SELECT * FROM {$this->table} WHERE email = :email LIMIT 1";
        $result = Database::fetchOne($sql, ['email' => $email]);
        return $result;
    }
    public function findByUsername(string $username): ?array
    {
        $sql = "SELECT * FROM {$this->table} WHERE username = :username LIMIT 1";
        $result = Database::fetchOne($sql, ['username' => $username]);
        return $result;
    }
    public function findPendingMembers(): array
    {
        $sql = "SELECT u.user_id, u.username, u.email, u.created_at, p.full_name
                FROM {$this->table} u
                LEFT JOIN profiles p ON u.user_id = p.user_id
                WHERE u.role = :role AND u.is_approved = :is_approved
                ORDER BY u.created_at ASC";
        $stmt = Database::query($sql, [
            'role' => ROLE_ANGGOTA,
            'is_approved' => IS_APPROVED_PENDING // Menggunakan konstanta
        ]);
        return $stmt->fetchAll();
    }
    public function updateApprovalStatus(int $id, int $status): bool
    {
        $sql = "UPDATE {$this->table} SET is_approved = :status WHERE user_id = :id";
        Database::query($sql, [
            'id'     => $id,
            'status' => $status
        ]);
        return true;
    }
    public function create(array $data): int
    {
        $sql = "INSERT INTO {$this->table} (username, email, password, role, is_approved, created_at) 
                 VALUES (:username, :email, :password, :role, :is_approved, NOW())";
        Database::query($sql, [
            'username' => $data['username'],
            'email'    => $data['email'],
            'password' => hash_password($data['password']),
            'role'     => $data['role'] ?? ROLE_ANGGOTA,
            'is_approved' => IS_APPROVED_PENDING // <-- Menggunakan konstanta 0
        ]);
        return (int) Database::lastInsertId();
    }
    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];
        if (isset($data['username'])) {
            $fields[] = 'username = :username';
            $params['username'] = $data['username'];
        }
        if (isset($data['email'])) {
            $fields[] = 'email = :email';
            $params['email'] = $data['email'];
        }
        if (isset($data['role'])) {
            $fields[] = 'role = :role';
            $params['role'] = $data['role'];
        }
        if (empty($fields)) {
            return false;
        }
        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE user_id = :id";
        Database::query($sql, $params);
        return true;
    }
    public function updatePassword(int $id, string $newPassword): bool
    {
        $sql = "UPDATE {$this->table} SET password = :password WHERE user_id = :id";
        Database::query($sql, [
            'id'       => $id,
            'password' => hash_password($newPassword)
        ]);
        return true;
    }
    public function delete(int $id): bool
    {
        $sql = "DELETE FROM {$this->table} WHERE user_id = :id";
        Database::query($sql, ['id' => $id]);
        return true;
    }
    public function emailExists(string $email, ?int $excludeId = null): bool
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE email = :email";
        $params = ['email' => $email];
        if ($excludeId !== null) {
            $sql .= " AND user_id != :exclude_id";
            $params['exclude_id'] = $excludeId;
        }
        return (int) Database::query($sql, $params)->fetchColumn() > 0;
    }
    public function usernameExists(string $username, ?int $excludeId = null): bool
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE username = :username";
        $params = ['username' => $username];
        if ($excludeId !== null) {
            $sql .= " AND user_id != :exclude_id";
            $params['exclude_id'] = $excludeId;
        }
        return (int) Database::query($sql, $params)->fetchColumn() > 0;
    }
    public function findWithProfile(int $id): ?array
    {
        $sql = "SELECT u.user_id, u.username, u.email, u.role, u.is_approved, u.created_at,
                         p.profile_id, p.full_name, p.npm, p.department, 
                         p.activity_status, p.profile_photo
                FROM {$this->table} u
                LEFT JOIN profiles p ON u.user_id = p.user_id
                WHERE u.user_id = :id
                LIMIT 1";
        return Database::fetchOne($sql, ['id' => $id]);
    }
    public function getAll(int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $sql = "SELECT user_id, username, email, role, created_at 
                 FROM {$this->table} 
                 ORDER BY created_at DESC 
                 LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    public function count(): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table}";
        return (int) Database::query($sql)->fetchColumn();
    }
    public function countByRole(string $role): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE role = :role";
        return (int) Database::query($sql, ['role' => $role])->fetchColumn();
    }
    public function search(string $keyword, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $keyword = "%{$keyword}%";
        $sql = "SELECT user_id, username, email, role, created_at 
                 FROM {$this->table} 
                 WHERE username LIKE :keyword OR email LIKE :keyword2
                 ORDER BY created_at DESC 
                 LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':keyword', $keyword, PDO::PARAM_STR);
        $stmt->bindValue(':keyword2', $keyword, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    public function findActiveMembers(): array
    {
        $sql = "SELECT u.user_id, u.username, u.email, u.created_at,
                       p.full_name, p.npm, p.department, p.activity_status, p.profile_photo
                FROM {$this->table} u
                LEFT JOIN profiles p ON u.user_id = p.user_id
                WHERE u.role = :role AND u.is_approved = :is_approved
                ORDER BY p.full_name ASC, u.username ASC";
        $stmt = Database::query($sql, [
            'role' => ROLE_ANGGOTA,
            'is_approved' => IS_APPROVED_ACTIVE
        ]);
        return $stmt->fetchAll();
    }
    public function findAllMembersWithProfile(int $page = 1, int $limit = 50): array
    {
        $offset = ($page - 1) * $limit;
        $sql = "SELECT u.user_id, u.username, u.email, u.role, u.is_approved, u.created_at,
                       p.full_name, p.npm, p.department, p.activity_status, p.profile_photo,
                       p.phone_number, p.address
                FROM {$this->table} u
                LEFT JOIN profiles p ON u.user_id = p.user_id
                WHERE u.role = :role AND u.is_approved = :is_approved
                ORDER BY p.full_name ASC, u.username ASC
                LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':role', ROLE_ANGGOTA, PDO::PARAM_STR);
        $stmt->bindValue(':is_approved', IS_APPROVED_ACTIVE, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    public function countActiveMembers(): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE role = :role AND is_approved = :is_approved";
        return (int) Database::query($sql, [
            'role' => ROLE_ANGGOTA,
            'is_approved' => IS_APPROVED_ACTIVE
        ])->fetchColumn();
    }
    public function countPendingMembers(): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE role = :role AND is_approved = :is_approved";
        return (int) Database::query($sql, [
            'role' => ROLE_ANGGOTA,
            'is_approved' => IS_APPROVED_PENDING
        ])->fetchColumn();
    }
}