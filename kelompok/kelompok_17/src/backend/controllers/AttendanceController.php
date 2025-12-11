<?php
require_once MODELS_PATH . '/Attendance.php';
require_once MODELS_PATH . '/Event.php';
require_once MODELS_PATH . '/EventRegistration.php';
class AttendanceController
{
    private Attendance $attendanceModel;
    private Event $eventModel;
    private EventRegistration $registrationModel;
    public function __construct()
    {
        $this->attendanceModel = new Attendance();
        $this->eventModel = new Event();
        $this->registrationModel = new EventRegistration();
    }
    public function checkIn(array $data): void
    {
        require_login();
        $errors = validate_required(['event_id', 'status'], $data);
        if (!empty($errors)) {
            Response::validationError($errors);
        }
        $eventId = (int) $data['event_id'];
        $userId = get_current_user_id();
        $status = $data['status'] ?? ATTENDANCE_HADIR;
        $notes = $data['notes'] ?? null;
        if (!validate_in_array($status, [ATTENDANCE_HADIR, ATTENDANCE_IZIN, 'sakit'])) {
            Response::validationError(['status' => 'Status tidak valid. Pilih: hadir, izin, atau sakit']);
        }
        $event = $this->eventModel->findById($eventId);
        if (!$event) {
            Response::notFound('Event tidak ditemukan');
        }
        if ($event['status'] !== EVENT_STATUS_PUBLISHED) {
            Response::error('Event tidak tersedia untuk absensi', 400);
        }
        if ($event['open_registration']) {
            $registration = $this->registrationModel->findByEventAndUser($eventId, $userId);
            if (!$registration || $registration['status'] !== 'approved') {
                Response::error('Anda tidak terdaftar sebagai panitia yang disetujui untuk event ini', 403);
            }
        }
        $photoFilename = null;
        if (Request::hasFile('photo')) {
            $uploadResult = upload_attendance_photo(Request::file('photo'), $eventId, $userId);
            if (!$uploadResult['success']) {
                Response::error('Gagal upload foto: ' . $uploadResult['message'], 400);
            }
            $photoFilename = $uploadResult['filename'];
        }
        $result = $this->attendanceModel->checkInWithPhoto($eventId, $userId, $status, $photoFilename, $notes);
        if (!$result['success']) {
            Response::error($result['message'], 409);
        }
        Response::success([
            'attendance_id' => $result['attendance_id'],
            'event_title'   => $event['title'],
            'check_in_time' => date('Y-m-d H:i:s'),
            'status'        => $status,
            'photo'         => $photoFilename,
            'notes'         => $notes
        ], 'Absensi berhasil');
    }
    public function canAttend(int $eventId): void
    {
        require_login();
        $event = $this->eventModel->findById($eventId);
        if (!$event) {
            Response::notFound('Event tidak ditemukan');
        }
        $userId = get_current_user_id();
        $canAttend = true;
        $reason = '';
        $registrationStatus = null;
        if ($event['open_registration']) {
            $registration = $this->registrationModel->findByEventAndUser($eventId, $userId);
            if (!$registration) {
                $canAttend = false;
                $reason = 'Anda belum mendaftar sebagai panitia';
            } elseif ($registration['status'] === 'pending') {
                $canAttend = false;
                $reason = 'Pendaftaran Anda masih menunggu persetujuan';
                $registrationStatus = 'pending';
            } elseif ($registration['status'] === 'rejected') {
                $canAttend = false;
                $reason = 'Pendaftaran Anda ditolak';
                $registrationStatus = 'rejected';
            } else {
                $registrationStatus = 'approved';
            }
        }
        $hasCheckedIn = $this->attendanceModel->hasCheckedIn($eventId, $userId);
        Response::success([
            'can_attend'          => $canAttend,
            'reason'              => $reason,
            'has_checked_in'      => $hasCheckedIn,
            'open_registration'   => (bool) $event['open_registration'],
            'registration_status' => $registrationStatus
        ]);
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
    public function userStatistics(): void
    {
        require_login();
        $userId = get_current_user_id();
        $stats = $this->attendanceModel->getUserStatistics($userId);
        Response::success($stats);
    }
}
