<?php

class Profile
{
    private PDO $db;
    private string $table = 'profiles';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findById(int $id): ?array
    {
        $sql = "SELECT * FROM {$this->table} WHERE profile_id = :id LIMIT 1";
        return Database::fetchOne($sql, ['id' => $id]);
    }

    public function findByUserId(int $userId): ?array
    {
        $sql = "SELECT * FROM {$this->table} WHERE user_id = :user_id LIMIT 1";
        return Database::fetchOne($sql, ['user_id' => $userId]);
    }

    public function findWithUser(int $userId): ?array
    {
        $sql = "SELECT p.*, u.username, u.email, u.role, u.created_at
                FROM {$this->table} p
                JOIN users u ON p.user_id = u.user_id
                WHERE p.user_id = :user_id
                LIMIT 1";
        
        return Database::fetchOne($sql, ['user_id' => $userId]);
    }

    /**
     * Get full member info including user data with LEFT JOIN (works even if profile doesn't exist)
     */
    public function findFullMemberData(int $userId): ?array
    {
        $sql = "SELECT u.user_id, u.username, u.email, u.role, u.created_at,
                       p.profile_id, p.full_name, p.npm, p.department, 
                       p.activity_status, p.profile_photo, p.phone_number, p.address
                FROM users u
                LEFT JOIN {$this->table} p ON u.user_id = p.user_id
                WHERE u.user_id = :user_id
                LIMIT 1";
        
        return Database::fetchOne($sql, ['user_id' => $userId]);
    }

    public function getAll(int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT p.*, u.username, u.email, u.role
                FROM {$this->table} p
                JOIN users u ON p.user_id = u.user_id
                ORDER BY p.full_name ASC
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $sql = "INSERT INTO {$this->table} 
                (user_id, full_name, npm, department, activity_status, profile_photo) 
                VALUES (:user_id, :full_name, :npm, :department, :activity_status, :profile_photo)";
        
        Database::query($sql, [
            'user_id'         => $data['user_id'],
            'full_name'       => $data['full_name'] ?? null,
            'npm'             => $data['npm'] ?? null,
            'department'      => $data['department'] ?? null,
            'activity_status' => $data['activity_status'] ?? STATUS_ACTIVE,
            'profile_photo'   => $data['profile_photo'] ?? null
        ]);
        
        return (int) Database::lastInsertId();
    }

    public function update(int $userId, array $data): bool
    {
        $fields = [];
        $params = ['user_id' => $userId];
        
        $allowedFields = ['full_name', 'npm', 'department', 'activity_status', 'profile_photo', 'phone_number', 'address'];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE user_id = :user_id";
        Database::query($sql, $params);
        
        return true;
    }

    public function upsert(int $userId, array $data): bool
    {
        $existing = $this->findByUserId($userId);
        
        if ($existing) {
            return $this->update($userId, $data);
        } else {
            $data['user_id'] = $userId;
            $this->create($data);
            return true;
        }
    }

    public function updatePhoto(int $userId, string $filename): bool
    {
        $profile = $this->findByUserId($userId);
        if ($profile && !empty($profile['profile_photo'])) {
            delete_profile_photo($profile['profile_photo']);
        }
        
        $sql = "UPDATE {$this->table} SET profile_photo = :photo WHERE user_id = :user_id";
        Database::query($sql, [
            'user_id' => $userId,
            'photo'   => $filename
        ]);
        
        return true;
    }

    public function deletePhoto(int $userId): bool
    {
        $profile = $this->findByUserId($userId);
        if ($profile && !empty($profile['profile_photo'])) {
            delete_profile_photo($profile['profile_photo']);
        }
        
        $sql = "UPDATE {$this->table} SET profile_photo = NULL WHERE user_id = :user_id";
        Database::query($sql, ['user_id' => $userId]);
        
        return true;
    }

    public function delete(int $userId): bool
    {
        $this->deletePhoto($userId);
        
        $sql = "DELETE FROM {$this->table} WHERE user_id = :user_id";
        Database::query($sql, ['user_id' => $userId]);
        
        return true;
    }

    public function count(): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table}";
        return (int) Database::query($sql)->fetchColumn();
    }

    public function getByStatus(string $status, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT p.*, u.username, u.email, u.role
                FROM {$this->table} p
                JOIN users u ON p.user_id = u.user_id
                WHERE p.activity_status = :status
                ORDER BY p.full_name ASC
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':status', $status, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function search(string $keyword, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $keyword = "%{$keyword}%";
        
        $sql = "SELECT p.*, u.username, u.email, u.role
                FROM {$this->table} p
                JOIN users u ON p.user_id = u.user_id
                WHERE p.full_name LIKE :keyword 
                   OR p.npm LIKE :keyword2 
                   OR p.department LIKE :keyword3
                ORDER BY p.full_name ASC
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':keyword', $keyword, PDO::PARAM_STR);
        $stmt->bindValue(':keyword2', $keyword, PDO::PARAM_STR);
        $stmt->bindValue(':keyword3', $keyword, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
}
