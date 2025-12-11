<?php

class Event
{
    private PDO $db;
    private string $table = 'events';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findById(int $id): ?array
    {
        $sql = "SELECT e.*, u.username as creator_name
                FROM {$this->table} e
                LEFT JOIN users u ON e.created_by = u.user_id
                WHERE e.event_id = :id 
                LIMIT 1";
        
        return Database::fetchOne($sql, ['id' => $id]);
    }

    public function getAll(int $page = 1, int $limit = 10, ?string $status = null): array
    {
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT e.*, u.username as creator_name
                FROM {$this->table} e
                LEFT JOIN users u ON e.created_by = u.user_id";
        
        $params = [];
        
        if ($status !== null) {
            $sql .= " WHERE e.status = :status";
            $params['status'] = $status;
        }
        
        $sql .= " ORDER BY e.event_date DESC, e.start_time DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
        }
        
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function getUpcoming(int $limit = 5): array
    {
        $sql = "SELECT e.*, u.username as creator_name
                FROM {$this->table} e
                LEFT JOIN users u ON e.created_by = u.user_id
                WHERE e.event_date >= CURDATE()
                  AND e.status = :status
                ORDER BY e.event_date ASC, e.start_time ASC
                LIMIT :limit";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':status', EVENT_STATUS_PUBLISHED, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    /**
     * Get latest/newest uploaded events (sorted by created_at DESC)
     */
    public function getLatest(int $limit = 3): array
    {
        $sql = "SELECT e.*, u.username as creator_name
                FROM {$this->table} e
                LEFT JOIN users u ON e.created_by = u.user_id
                WHERE e.status = :status
                ORDER BY e.created_at DESC
                LIMIT :limit";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':status', EVENT_STATUS_PUBLISHED, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function getPast(int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT e.*, u.username as creator_name
                FROM {$this->table} e
                LEFT JOIN users u ON e.created_by = u.user_id
                WHERE e.event_date < CURDATE()
                ORDER BY e.event_date DESC, e.start_time DESC
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
                (title, description, banner, event_date, start_time, end_time, location, status, open_registration, registration_deadline, max_participants, created_by, created_at) 
                VALUES (:title, :description, :banner, :event_date, :start_time, :end_time, :location, :status, :open_registration, :registration_deadline, :max_participants, :created_by, NOW())";
        
        Database::query($sql, [
            'title'                 => $data['title'],
            'description'           => $data['description'] ?? null,
            'banner'                => $data['banner'] ?? null,
            'event_date'            => $data['event_date'],
            'start_time'            => $data['start_time'],
            'end_time'              => $data['end_time'] ?? null,
            'location'              => $data['location'] ?? null,
            'status'                => $data['status'] ?? EVENT_STATUS_DRAFT,
            'open_registration'     => $data['open_registration'] ?? 0,
            'registration_deadline' => $data['registration_deadline'] ?? null,
            'max_participants'      => $data['max_participants'] ?? null,
            'created_by'            => $data['created_by']
        ]);
        
        return (int) Database::lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];
        
        $allowedFields = ['title', 'description', 'banner', 'event_date', 'start_time', 'end_time', 'location', 'status', 'open_registration', 'registration_deadline', 'max_participants'];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE event_id = :id";
        Database::query($sql, $params);
        
        return true;
    }

    public function updateBanner(int $id, string $filename): bool
    {
        $event = $this->findById($id);
        if ($event && !empty($event['banner'])) {
            delete_event_banner($event['banner']);
        }
        
        $sql = "UPDATE {$this->table} SET banner = :banner WHERE event_id = :id";
        Database::query($sql, [
            'id'     => $id,
            'banner' => $filename
        ]);
        
        return true;
    }

    public function updateStatus(int $id, string $status): bool
    {
        $sql = "UPDATE {$this->table} SET status = :status WHERE event_id = :id";
        Database::query($sql, [
            'id'     => $id,
            'status' => $status
        ]);
        
        return true;
    }

    public function delete(int $id): bool
    {
        $event = $this->findById($id);
        if ($event && !empty($event['banner'])) {
            delete_event_banner($event['banner']);
        }
        
        $sql = "DELETE FROM {$this->table} WHERE event_id = :id";
        Database::query($sql, ['id' => $id]);
        
        return true;
    }

    public function count(?string $status = null): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table}";
        $params = [];
        
        if ($status !== null) {
            $sql .= " WHERE status = :status";
            $params['status'] = $status;
        }
        
        return (int) Database::query($sql, $params)->fetchColumn();
    }

    public function getByDate(string $date): array
    {
        $sql = "SELECT e.*, u.username as creator_name
                FROM {$this->table} e
                LEFT JOIN users u ON e.created_by = u.user_id
                WHERE e.event_date = :date
                ORDER BY e.start_time ASC";
        
        return Database::fetchAll($sql, ['date' => $date]);
    }

    public function getByDateRange(string $startDate, string $endDate): array
    {
        $sql = "SELECT e.*, u.username as creator_name
                FROM {$this->table} e
                LEFT JOIN users u ON e.created_by = u.user_id
                WHERE e.event_date BETWEEN :start_date AND :end_date
                ORDER BY e.event_date ASC, e.start_time ASC";
        
        return Database::fetchAll($sql, [
            'start_date' => $startDate,
            'end_date'   => $endDate
        ]);
    }

    public function getByCreator(int $userId, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT * FROM {$this->table}
                WHERE created_by = :user_id
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function search(string $keyword, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $keyword = "%{$keyword}%";
        
        $sql = "SELECT e.*, u.username as creator_name
                FROM {$this->table} e
                LEFT JOIN users u ON e.created_by = u.user_id
                WHERE e.title LIKE :keyword 
                   OR e.description LIKE :keyword2 
                   OR e.location LIKE :keyword3
                ORDER BY e.event_date DESC
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

    public function isOngoing(int $id): bool
    {
        $sql = "SELECT COUNT(*) FROM {$this->table}
                WHERE event_id = :id
                  AND event_date = CURDATE()
                  AND start_time <= CURTIME()
                  AND (end_time IS NULL OR end_time >= CURTIME())";
        
        return (int) Database::query($sql, ['id' => $id])->fetchColumn() > 0;
    }

    public function countAll(): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table}";
        return (int) Database::query($sql)->fetchColumn();
    }

    public function countUpcoming(): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE event_date >= CURDATE() AND status = :status";
        return (int) Database::query($sql, ['status' => EVENT_STATUS_PUBLISHED])->fetchColumn();
    }

    public function countCompleted(): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE status = :status";
        return (int) Database::query($sql, ['status' => EVENT_STATUS_COMPLETED])->fetchColumn();
    }

    public function countThisMonth(): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} 
                WHERE MONTH(event_date) = MONTH(CURDATE()) 
                AND YEAR(event_date) = YEAR(CURDATE())";
        return (int) Database::query($sql)->fetchColumn();
    }

    public function getUpcomingWithLimit(int $limit = 5): array
    {
        $sql = "SELECT e.*, u.username as creator_name,
                       DATE_FORMAT(e.event_date, '%d') as day_number,
                       DATE_FORMAT(e.event_date, '%b') as month_short,
                       DATE_FORMAT(e.start_time, '%H:%i') as time_formatted
                FROM {$this->table} e
                LEFT JOIN users u ON e.created_by = u.user_id
                WHERE e.event_date >= CURDATE() AND e.status = :status
                ORDER BY e.event_date ASC, e.start_time ASC
                LIMIT :limit";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':status', EVENT_STATUS_PUBLISHED, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function getAllPublished(int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT e.*, u.username as creator_name,
                       DATE_FORMAT(e.event_date, '%d') as day_number,
                       DATE_FORMAT(e.event_date, '%b') as month_short,
                       DATE_FORMAT(e.event_date, '%W, %d %M %Y') as date_formatted,
                       DATE_FORMAT(e.start_time, '%H:%i') as time_formatted
                FROM {$this->table} e
                LEFT JOIN users u ON e.created_by = u.user_id
                WHERE e.status = :status
                ORDER BY e.event_date DESC, e.start_time DESC
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':status', EVENT_STATUS_PUBLISHED, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function getCalendarEvents(int $year, int $month): array
    {
        $sql = "SELECT e.*, 
                       DATE_FORMAT(e.event_date, '%Y-%m-%d') as date_key,
                       DATE_FORMAT(e.start_time, '%H:%i') as time_formatted
                FROM {$this->table} e
                WHERE MONTH(e.event_date) = :month 
                AND YEAR(e.event_date) = :year
                AND e.status = :status
                ORDER BY e.event_date ASC, e.start_time ASC";
        
        return Database::fetchAll($sql, [
            'month' => $month,
            'year' => $year,
            'status' => EVENT_STATUS_PUBLISHED
        ]);
    }
}
