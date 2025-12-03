<?php

require_once MODELS_PATH . '/Attendance.php';
require_once MODELS_PATH . '/Event.php';

class AttendanceController
{
    private Attendance $attendanceModel;
    private Event $eventModel;

    public function __construct()
    {
        $this->attendanceModel = new Attendance();
        $this->eventModel = new Event();
    }

    public function checkIn(array $data): void
    {
        require_login();
        
        $errors = validate_required(['event_id'], $data);
        
        if (!empty($errors)) {
            Response::validationError($errors);
        }
        
        $eventId = (int) $data['event_id'];
        $userId = get_current_user_id();
        $status = $data['status'] ?? ATTENDANCE_HADIR;
        
        if (!validate_in_array($status, [ATTENDANCE_HADIR, ATTENDANCE_IZIN])) {
            Response::validationError(['status' => 'Status tidak valid']);
        }
        
        $event = $this->eventModel->findById($eventId);
        
        if (!$event) {
            Response::notFound('Event tidak ditemukan');
        }
        
        if ($event['status'] !== EVENT_STATUS_PUBLISHED) {
            Response::error('Event tidak tersedia untuk check-in', 400);
        }
        
        $eventDate = $event['event_date'];
        $today = date('Y-m-d');
        
        if ($eventDate < $today) {
            Response::error('Event sudah berakhir', 400);
        }
        
        $result = $this->attendanceModel->checkIn($eventId, $userId, $status);
        
        if (!$result['success']) {
            Response::error($result['message'], 409);
        }
        
        Response::success([
            'attendance_id' => $result['attendance_id'],
            'event_title'   => $event['title'],
            'check_in_time' => date('Y-m-d H:i:s'),
            'status'        => $status
        ], 'Check-in berhasil');
    }

    public function byEvent(int $eventId): void
    {
        require_login();
        
        $event = $this->eventModel->findById($eventId);
        
        if (!$event) {
            Response::notFound('Event tidak ditemukan');
        }
        
        if (!is_admin() && $event['status'] !== EVENT_STATUS_PUBLISHED) {
            Response::forbidden();
        }
        
        $page = (int) (Request::query('page') ?? DEFAULT_PAGE);
        $limit = (int) (Request::query('limit') ?? 50);
        
        $attendance = $this->attendanceModel->getByEvent($eventId, $page, $limit);
        $stats = $this->attendanceModel->getEventStatistics($eventId);
        
        Response::success([
            'event'      => [
                'event_id' => $event['event_id'],
                'title'    => $event['title'],
                'date'     => $event['event_date']
            ],
            'statistics' => $stats,
            'attendance' => $attendance
        ]);
    }

    public function myAttendance(): void
    {
        require_login();
        
        $userId = get_current_user_id();
        $page = (int) (Request::query('page') ?? DEFAULT_PAGE);
        $limit = (int) (Request::query('limit') ?? DEFAULT_LIMIT);
        
        $attendance = $this->attendanceModel->getByUser($userId, $page, $limit);
        $total = $this->attendanceModel->countByUser($userId);
        $stats = $this->attendanceModel->getUserStatistics($userId);
        
        Response::success([
            'statistics' => $stats,
            'attendance' => format_pagination($attendance, $page, $limit, $total)
        ]);
    }

    public function byUser(int $userId): void
    {
        require_admin();
        
        $page = (int) (Request::query('page') ?? DEFAULT_PAGE);
        $limit = (int) (Request::query('limit') ?? DEFAULT_LIMIT);
        
        $attendance = $this->attendanceModel->getByUser($userId, $page, $limit);
        $total = $this->attendanceModel->countByUser($userId);
        $stats = $this->attendanceModel->getUserStatistics($userId);
        
        Response::success([
            'statistics' => $stats,
            'attendance' => format_pagination($attendance, $page, $limit, $total)
        ]);
    }

    public function updateStatus(int $id, array $data): void
    {
        require_admin();
        
        $attendance = $this->attendanceModel->findById($id);
        
        if (!$attendance) {
            Response::notFound('Data kehadiran tidak ditemukan');
        }
        
        $errors = validate_required(['status'], $data);
        
        if (!validate_in_array($data['status'], [ATTENDANCE_HADIR, ATTENDANCE_IZIN, ATTENDANCE_ALPHA])) {
            $errors['status'] = 'Status tidak valid';
        }
        
        if (!empty($errors)) {
            Response::validationError($errors);
        }
        
        $this->attendanceModel->updateStatus($id, $data['status']);
        
        Response::success(null, 'Status kehadiran berhasil diupdate');
    }

    public function destroy(int $id): void
    {
        require_admin();
        
        $attendance = $this->attendanceModel->findById($id);
        
        if (!$attendance) {
            Response::notFound('Data kehadiran tidak ditemukan');
        }
        
        $this->attendanceModel->delete($id);
        
        Response::success(null, 'Data kehadiran berhasil dihapus');
    }

    public function notCheckedIn(int $eventId): void
    {
        require_admin();
        
        $event = $this->eventModel->findById($eventId);
        
        if (!$event) {
            Response::notFound('Event tidak ditemukan');
        }
        
        $users = $this->attendanceModel->getUsersNotCheckedIn($eventId);
        
        Response::success([
            'event' => [
                'event_id' => $event['event_id'],
                'title'    => $event['title']
            ],
            'users' => $users
        ]);
    }

    public function bulkCheckIn(array $data): void
    {
        require_admin();
        
        $errors = validate_required(['event_id', 'user_ids'], $data);
        
        if (!isset($data['user_ids']) || !is_array($data['user_ids']) || empty($data['user_ids'])) {
            $errors['user_ids'] = 'Minimal pilih satu user';
        }
        
        if (!empty($errors)) {
            Response::validationError($errors);
        }
        
        $eventId = (int) $data['event_id'];
        $status = $data['status'] ?? ATTENDANCE_HADIR;
        
        $event = $this->eventModel->findById($eventId);
        if (!$event) {
            Response::notFound('Event tidak ditemukan');
        }
        
        $success = 0;
        $failed = 0;
        
        foreach ($data['user_ids'] as $userId) {
            $result = $this->attendanceModel->checkIn($eventId, (int) $userId, $status);
            if ($result['success']) {
                $success++;
            } else {
                $failed++;
            }
        }
        
        Response::success([
            'success' => $success,
            'failed'  => $failed
        ], "Check-in selesai: {$success} berhasil, {$failed} gagal/sudah ada");
    }

    public function checkStatus(int $eventId): void
    {
        require_login();
        
        $event = $this->eventModel->findById($eventId);
        
        if (!$event) {
            Response::notFound('Event tidak ditemukan');
        }
        
        $userId = get_current_user_id();
        $attendance = $this->attendanceModel->findByEventAndUser($eventId, $userId);
        
        Response::success([
            'event_id'       => $eventId,
            'has_checked_in' => $attendance !== null,
            'attendance'     => $attendance
        ]);
    }
}
