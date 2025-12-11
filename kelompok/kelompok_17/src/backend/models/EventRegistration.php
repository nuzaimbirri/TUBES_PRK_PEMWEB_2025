<?php

class EventRegistration
{
    private PDO $db;
    private string $table = 'event_registrations';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findById(int $id): ?array
    {
        $sql = "SELECT r.*, e.title as event_title, u.username, p.full_name, p.npm, p.department
                FROM {$this->table} r
                JOIN events e ON r.event_id = e.event_id
                JOIN users u ON r.user_id = u.user_id
                LEFT JOIN profiles p ON u.user_id = p.user_id
                WHERE r.registration_id = :id 
                LIMIT 1";
        
        return Database::fetchOne($sql, ['id' => $id]);
    }

    public function findByEventAndUser(int $eventId, int $userId): ?array
    {
        $sql = "SELECT * FROM {$this->table} 
                WHERE event_id = :event_id AND user_id = :user_id 
                LIMIT 1";
        
        return Database::fetchOne($sql, [
            'event_id' => $eventId,
            'user_id'  => $userId
        ]);
    }

    public function hasRegistered(int $eventId, int $userId): bool
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} 
                WHERE event_id = :event_id AND user_id = :user_id";
        
        return (int) Database::query($sql, [
            'event_id' => $eventId,
            'user_id'  => $userId
        ])->fetchColumn() > 0;
    }

    public function isApproved(int $eventId, int $userId): bool
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} 
                WHERE event_id = :event_id AND user_id = :user_id AND status = 'approved'";
        
        return (int) Database::query($sql, [
            'event_id' => $eventId,
            'user_id'  => $userId
        ])->fetchColumn() > 0;
    }

    public function register(array $data): array
    {
        if ($this->hasRegistered($data['event_id'], $data['user_id'])) {
            return [
                'success' => false,
                'message' => 'Anda sudah mendaftar untuk event ini'
            ];
        }
        
        $sql = "INSERT INTO {$this->table} (event_id, user_id, division, reason, experience, status) 
                VALUES (:event_id, :user_id, :division, :reason, :experience, 'pending')";
        
        Database::query($sql, [
            'event_id'   => $data['event_id'],
            'user_id'    => $data['user_id'],
            'division'   => $data['division'],
            'reason'     => $data['reason'],
            'experience' => $data['experience'] ?? null
        ]);
        
        return [
            'success'         => true,
            'message'         => 'Pendaftaran berhasil dikirim',
            'registration_id' => (int) Database::lastInsertId()
        ];
    }

    public function updateStatus(int $id, string $status, ?string $adminNotes = null): bool
    {
        $sql = "UPDATE {$this->table} SET status = :status, admin_notes = :notes WHERE registration_id = :id";
        Database::query($sql, [
            'id'     => $id,
            'status' => $status,
            'notes'  => $adminNotes
        ]);
        return true;
    }

    public function getByEvent(int $eventId, ?string $status = null, int $page = 1, int $limit = 50): array
    {
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT r.*, u.username, u.email, p.full_name, p.npm, p.department, p.phone_number
                FROM {$this->table} r
                JOIN users u ON r.user_id = u.user_id
                LEFT JOIN profiles p ON u.user_id = p.user_id
                WHERE r.event_id = :event_id";
        
        $params = ['event_id' => $eventId];
        
        if ($status !== null) {
            $sql .= " AND r.status = :status";
            $params['status'] = $status;
        }
        
        $sql .= " ORDER BY r.created_at DESC LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function getByUser(int $userId, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT r.*, e.title as event_title, e.event_date, e.location, e.banner
                FROM {$this->table} r
                JOIN events e ON r.event_id = e.event_id
                WHERE r.user_id = :user_id
                ORDER BY r.created_at DESC
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function countByEvent(int $eventId, ?string $status = null): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE event_id = :event_id";
        $params = ['event_id' => $eventId];
        
        if ($status !== null) {
            $sql .= " AND status = :status";
            $params['status'] = $status;
        }
        
        return (int) Database::query($sql, $params)->fetchColumn();
    }

    public function countByUser(int $userId): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE user_id = :user_id";
        return (int) Database::query($sql, ['user_id' => $userId])->fetchColumn();
    }

    public function getPendingRegistrations(int $page = 1, int $limit = 20): array
    {
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT r.*, e.title as event_title, e.event_date, u.username, p.full_name, p.npm
                FROM {$this->table} r
                JOIN events e ON r.event_id = e.event_id
                JOIN users u ON r.user_id = u.user_id
                LEFT JOIN profiles p ON u.user_id = p.user_id
                WHERE r.status = 'pending'
                ORDER BY r.created_at ASC
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function countPending(): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE status = 'pending'";
        return (int) Database::query($sql, [])->fetchColumn();
    }

    public function getAllRegistrations(int $page = 1, int $limit = 100, ?string $status = null): array
    {
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT r.*, 
                       e.title as event_title, e.event_date, 
                       u.username, 
                       COALESCE(p.full_name, u.username) as user_name,
                       p.npm, p.department, p.phone_number
                FROM {$this->table} r
                JOIN events e ON r.event_id = e.event_id
                JOIN users u ON r.user_id = u.user_id
                LEFT JOIN profiles p ON u.user_id = p.user_id";
        
        $params = [];
        
        if ($status !== null) {
            $sql .= " WHERE r.status = :status";
            $params['status'] = $status;
        }
        
        $sql .= " ORDER BY r.created_at DESC LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function delete(int $id): bool
    {
        $sql = "DELETE FROM {$this->table} WHERE registration_id = :id";
        Database::query($sql, ['id' => $id]);
        return true;
    }

    public function deleteByEvent(int $eventId): bool
    {
        $sql = "DELETE FROM {$this->table} WHERE event_id = :event_id";
        Database::query($sql, ['event_id' => $eventId]);
        return true;
    }

    public function getEventStatistics(int $eventId): array
    {
        $sql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
                FROM {$this->table}
                WHERE event_id = :event_id";
        
        $result = Database::fetchOne($sql, ['event_id' => $eventId]);
        
        return [
            'total' => (int) ($result['total'] ?? 0),
            'approved' => (int) ($result['approved'] ?? 0),
            'pending' => (int) ($result['pending'] ?? 0),
            'rejected' => (int) ($result['rejected'] ?? 0)
        ];
    }
}
