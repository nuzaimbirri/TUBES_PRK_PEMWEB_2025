<?php
class Attendance
{
    private PDO $db;
    private string $table = 'attendance';
    public function __construct()
    {
        $this->db = Database::getInstance();
    }
    public function findById(int $id): ?array
    {
        $sql = "SELECT a.*, e.title as event_title, u.username
                FROM {$this->table} a
                JOIN events e ON a.event_id = e.event_id
                JOIN users u ON a.user_id = u.user_id
                WHERE a.attendance_id = :id 
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
    public function hasCheckedIn(int $eventId, int $userId): bool
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} 
                WHERE event_id = :event_id AND user_id = :user_id";
        return (int) Database::query($sql, [
            'event_id' => $eventId,
            'user_id'  => $userId
        ])->fetchColumn() > 0;
    }
    public function checkIn(int $eventId, int $userId, string $status = ATTENDANCE_HADIR): array
    {
        return $this->checkInWithPhoto($eventId, $userId, $status, null, null);
    }
    public function checkInWithPhoto(int $eventId, int $userId, string $status = ATTENDANCE_HADIR, ?string $photo = null, ?string $notes = null): array
    {
        if ($this->hasCheckedIn($eventId, $userId)) {
            return [
                'success' => false,
                'message' => 'Anda sudah melakukan absensi untuk event ini'
            ];
        }
        $sql = "INSERT INTO {$this->table} (event_id, user_id, check_in_time, status, photo, notes) 
                VALUES (:event_id, :user_id, NOW(), :status, :photo, :notes)";
        Database::query($sql, [
            'event_id' => $eventId,
            'user_id'  => $userId,
            'status'   => $status,
            'photo'    => $photo,
            'notes'    => $notes
        ]);
        return [
            'success'       => true,
            'message'       => 'Absensi berhasil',
            'attendance_id' => (int) Database::lastInsertId()
        ];
    }
    public function updateStatus(int $id, string $status): bool
    {
        $sql = "UPDATE {$this->table} SET status = :status WHERE attendance_id = :id";
        Database::query($sql, [
            'id'     => $id,
            'status' => $status
        ]);
        return true;
    }
    public function getByEvent(int $eventId, int $page = 1, int $limit = 50): array
    {
        $offset = ($page - 1) * $limit;
        $sql = "SELECT a.*, u.username, p.full_name, p.npm, p.department,
                       CASE WHEN a.photo IS NOT NULL THEN CONCAT('upload/absensi/', a.photo) ELSE NULL END as photo_path
                FROM {$this->table} a
                JOIN users u ON a.user_id = u.user_id
                LEFT JOIN profiles p ON u.user_id = p.user_id
                WHERE a.event_id = :event_id
                ORDER BY a.check_in_time DESC
                LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':event_id', $eventId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    public function getByUser(int $userId, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $sql = "SELECT a.*, e.title as event_title, e.event_date, e.location
                FROM {$this->table} a
                JOIN events e ON a.event_id = e.event_id
                WHERE a.user_id = :user_id
                ORDER BY a.check_in_time DESC
                LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    public function countByEvent(int $eventId): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE event_id = :event_id";
        return (int) Database::query($sql, ['event_id' => $eventId])->fetchColumn();
    }
    public function countByUser(int $userId): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE user_id = :user_id";
        return (int) Database::query($sql, ['user_id' => $userId])->fetchColumn();
    }
    public function countByEventAndStatus(int $eventId, string $status): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} 
                WHERE event_id = :event_id AND status = :status";
        return (int) Database::query($sql, [
            'event_id' => $eventId,
            'status'   => $status
        ])->fetchColumn();
    }
    public function getEventStatistics(int $eventId): array
    {
        $sql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = :hadir THEN 1 ELSE 0 END) as hadir,
                    SUM(CASE WHEN status = :izin THEN 1 ELSE 0 END) as izin,
                    SUM(CASE WHEN status = :sakit THEN 1 ELSE 0 END) as sakit,
                    SUM(CASE WHEN status = :alpha THEN 1 ELSE 0 END) as alpha
                FROM {$this->table}
                WHERE event_id = :event_id";
        $result = Database::fetchOne($sql, [
            'event_id' => $eventId,
            'hadir'    => ATTENDANCE_HADIR,
            'izin'     => ATTENDANCE_IZIN,
            'sakit'    => 'sakit',
            'alpha'    => ATTENDANCE_ALPHA
        ]);
        return [
            'total' => (int) ($result['total'] ?? 0),
            'hadir' => (int) ($result['hadir'] ?? 0),
            'izin'  => (int) ($result['izin'] ?? 0),
            'sakit' => (int) ($result['sakit'] ?? 0),
            'alpha' => (int) ($result['alpha'] ?? 0)
        ];
    }
    public function getUserStatistics(int $userId): array
    {
        $sql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = :hadir THEN 1 ELSE 0 END) as hadir,
                    SUM(CASE WHEN status = :izin THEN 1 ELSE 0 END) as izin,
                    SUM(CASE WHEN status = :alpha THEN 1 ELSE 0 END) as alpha
                FROM {$this->table}
                WHERE user_id = :user_id";
        $result = Database::fetchOne($sql, [
            'user_id' => $userId,
            'hadir'   => ATTENDANCE_HADIR,
            'izin'    => ATTENDANCE_IZIN,
            'alpha'   => ATTENDANCE_ALPHA
        ]);
        return [
            'total' => (int) ($result['total'] ?? 0),
            'hadir' => (int) ($result['hadir'] ?? 0),
            'izin'  => (int) ($result['izin'] ?? 0),
            'alpha' => (int) ($result['alpha'] ?? 0)
        ];
    }
    public function delete(int $id): bool
    {
        $sql = "DELETE FROM {$this->table} WHERE attendance_id = :id";
        Database::query($sql, ['id' => $id]);
        return true;
    }
    public function deleteByEvent(int $eventId): bool
    {
        $sql = "DELETE FROM {$this->table} WHERE event_id = :event_id";
        Database::query($sql, ['event_id' => $eventId]);
        return true;
    }
    public function getUsersNotCheckedIn(int $eventId): array
    {
        $sql = "SELECT u.user_id, u.username, u.email, p.full_name, p.npm
                FROM users u
                LEFT JOIN profiles p ON u.user_id = p.user_id
                WHERE u.user_id NOT IN (
                    SELECT user_id FROM {$this->table} WHERE event_id = :event_id
                )
                AND u.role = :role
                ORDER BY p.full_name ASC";
        return Database::fetchAll($sql, [
            'event_id' => $eventId,
            'role'     => ROLE_ANGGOTA
        ]);
    }
}
