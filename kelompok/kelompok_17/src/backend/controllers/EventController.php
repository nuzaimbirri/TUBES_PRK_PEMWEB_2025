<?php

require_once MODELS_PATH . '/Event.php';
require_once MODELS_PATH . '/Attendance.php';
require_once MODELS_PATH . '/EventRegistration.php';

class EventController
{
    private Event $eventModel;
    private Attendance $attendanceModel;
    private EventRegistration $registrationModel;

    public function __construct()
    {
        $this->eventModel = new Event();
        $this->attendanceModel = new Attendance();
        $this->registrationModel = new EventRegistration();
    }

    public function index(): void
    {
        require_login();
        
        $page = (int) (Request::query('page') ?? DEFAULT_PAGE);
        $limit = (int) (Request::query('limit') ?? DEFAULT_LIMIT);
        $status = Request::query('status');
        
        if ($status !== null && !validate_in_array($status, [
            EVENT_STATUS_DRAFT, EVENT_STATUS_PUBLISHED, 
            EVENT_STATUS_CANCELLED, EVENT_STATUS_COMPLETED
        ])) {
            Response::error('Status tidak valid', 400);
        }
        
        if (!is_admin() && $status !== EVENT_STATUS_PUBLISHED) {
            $status = EVENT_STATUS_PUBLISHED;
        }
        
        $events = $this->eventModel->getAll($page, $limit, $status);
        $total = $this->eventModel->count($status);
        
        Response::success(format_pagination($events, $page, $limit, $total));
    }

    public function upcoming(): void
    {
        require_login();
        
        $limit = (int) (Request::query('limit') ?? 5);
        $events = $this->eventModel->getUpcoming($limit);
        
        Response::success($events);
    }

    /**
     * Get latest/newest uploaded events for banner slider
     */
    public function latest(): void
    {
        require_login();
        
        $limit = (int) (Request::query('limit') ?? 3);
        $events = $this->eventModel->getLatest($limit);
        
        Response::success($events);
    }

    public function show(int $id): void
    {
        require_login();
        
        $event = $this->eventModel->findById($id);
        
        if (!$event) {
            Response::notFound('Event tidak ditemukan');
        }
        
        if (!is_admin() && $event['status'] !== EVENT_STATUS_PUBLISHED) {
            Response::notFound('Event tidak ditemukan');
        }
        
        $event['attendance_stats'] = $this->attendanceModel->getEventStatistics($id);
        $event['registration_stats'] = $this->registrationModel->getEventStatistics($id);
        
        $event['has_checked_in'] = $this->attendanceModel->hasCheckedIn($id, get_current_user_id());
        
        Response::success($event);
    }

    public function store(array $data): void
    {
        require_admin();
        
        $errors = validate_required(['title', 'event_date', 'start_time'], $data);
        
        if (isset($data['title']) && !validate_length($data['title'], 3, 255)) {
            $errors['title'] = 'Judul harus 3-255 karakter';
        }
        
        if (isset($data['event_date']) && !validate_date($data['event_date'])) {
            $errors['event_date'] = 'Format tanggal tidak valid (YYYY-MM-DD)';
        }
        
        if (isset($data['start_time']) && !validate_time($data['start_time'])) {
            $errors['start_time'] = 'Format waktu tidak valid (HH:MM)';
        }
        
        if (isset($data['end_time']) && !empty($data['end_time']) && !validate_time($data['end_time'])) {
            $errors['end_time'] = 'Format waktu tidak valid (HH:MM)';
        }
        
        if (isset($data['status']) && !validate_in_array($data['status'], [
            EVENT_STATUS_DRAFT, EVENT_STATUS_PUBLISHED
        ])) {
            $errors['status'] = 'Status tidak valid';
        }
        
        if (!empty($errors)) {
            Response::validationError($errors);
        }
        
        $openRegistration = isset($data['open_registration']) ? (int) $data['open_registration'] : 0;
        $registrationDeadline = null;
        $maxParticipants = null;
        
        if ($openRegistration && !empty($data['registration_deadline'])) {
            $registrationDeadline = $data['registration_deadline'];
        }
        if ($openRegistration && !empty($data['max_participants'])) {
            $maxParticipants = (int) $data['max_participants'];
        }
        
        $eventId = $this->eventModel->create([
            'title'                 => sanitize_string($data['title']),
            'description'           => sanitize_string($data['description'] ?? ''),
            'event_date'            => $data['event_date'],
            'start_time'            => $data['start_time'],
            'end_time'              => $data['end_time'] ?? null,
            'location'              => sanitize_string($data['location'] ?? ''),
            'status'                => $data['status'] ?? EVENT_STATUS_DRAFT,
            'open_registration'     => $openRegistration,
            'registration_deadline' => $registrationDeadline,
            'max_participants'      => $maxParticipants,
            'created_by'            => get_current_user_id()
        ]);
        
        if (Request::hasFile('banner')) {
            $result = upload_event_banner(Request::file('banner'), $eventId);
            if ($result['success']) {
                $this->eventModel->updateBanner($eventId, $result['filename']);
            }
        }
        
        Response::created([
            'event_id' => $eventId
        ], 'Event berhasil dibuat');
    }

    public function update(int $id, array $data): void
    {
        require_admin();
        
        $event = $this->eventModel->findById($id);
        
        if (!$event) {
            Response::notFound('Event tidak ditemukan');
        }
        
        $errors = [];
        $updateData = [];
        
        if (isset($data['title'])) {
            if (!validate_length($data['title'], 3, 255)) {
                $errors['title'] = 'Judul harus 3-255 karakter';
            } else {
                $updateData['title'] = sanitize_string($data['title']);
            }
        }
        
        if (isset($data['description'])) {
            $updateData['description'] = sanitize_string($data['description']);
        }
        
        if (isset($data['event_date'])) {
            if (!validate_date($data['event_date'])) {
                $errors['event_date'] = 'Format tanggal tidak valid';
            } else {
                $updateData['event_date'] = $data['event_date'];
            }
        }
        
        if (isset($data['start_time'])) {
            if (!validate_time($data['start_time'])) {
                $errors['start_time'] = 'Format waktu tidak valid';
            } else {
                $updateData['start_time'] = $data['start_time'];
            }
        }
        
        if (isset($data['end_time'])) {
            if (!empty($data['end_time']) && !validate_time($data['end_time'])) {
                $errors['end_time'] = 'Format waktu tidak valid';
            } else {
                $updateData['end_time'] = $data['end_time'] ?: null;
            }
        }
        
        if (isset($data['location'])) {
            $updateData['location'] = sanitize_string($data['location']);
        }
        
        if (isset($data['status'])) {
            if (!validate_in_array($data['status'], [
                EVENT_STATUS_DRAFT, EVENT_STATUS_PUBLISHED, 
                EVENT_STATUS_CANCELLED, EVENT_STATUS_COMPLETED
            ])) {
                $errors['status'] = 'Status tidak valid';
            } else {
                $updateData['status'] = $data['status'];
            }
        }
        
        if (!empty($errors)) {
            Response::validationError($errors);
        }
        
        if (!empty($updateData)) {
            $this->eventModel->update($id, $updateData);
        }
        
        Response::success(null, 'Event berhasil diupdate');
    }

    public function uploadBanner(int $id): void
    {
        require_admin();
        
        $event = $this->eventModel->findById($id);
        
        if (!$event) {
            Response::notFound('Event tidak ditemukan');
        }
        
        if (!Request::hasFile('banner')) {
            Response::error('File banner diperlukan', 400);
        }
        
        $result = upload_event_banner(Request::file('banner'), $id);
        
        if (!$result['success']) {
            Response::error($result['message'], 400);
        }
        
        $this->eventModel->updateBanner($id, $result['filename']);
        
        Response::success([
            'filename' => $result['filename'],
            'url'      => get_upload_url($result['filename'], 'event')
        ], 'Banner berhasil diupload');
    }

    public function destroy(int $id): void
    {
        require_admin();
        
        $event = $this->eventModel->findById($id);
        
        if (!$event) {
            Response::notFound('Event tidak ditemukan');
        }
        
        try {
            Database::beginTransaction();
            
            $this->attendanceModel->deleteByEvent($id);
            
            $this->eventModel->delete($id);
            
            Database::commit();
            
            Response::success(null, 'Event berhasil dihapus');
            
        } catch (Exception $e) {
            Database::rollback();
            Response::serverError('Gagal menghapus event');
        }
    }

    public function search(): void
    {
        require_login();
        
        $keyword = sanitize_string(Request::query('q') ?? '');
        
        if (empty($keyword)) {
            Response::error('Keyword pencarian diperlukan', 400);
        }
        
        $page = (int) (Request::query('page') ?? DEFAULT_PAGE);
        $limit = (int) (Request::query('limit') ?? DEFAULT_LIMIT);
        
        $events = $this->eventModel->search($keyword, $page, $limit);
        
        Response::success($events);
    }

    public function statistics(): void
    {
        require_admin();
        
        Response::success([
            'total'     => $this->eventModel->count(),
            'draft'     => $this->eventModel->count(EVENT_STATUS_DRAFT),
            'published' => $this->eventModel->count(EVENT_STATUS_PUBLISHED),
            'cancelled' => $this->eventModel->count(EVENT_STATUS_CANCELLED),
            'completed' => $this->eventModel->count(EVENT_STATUS_COMPLETED)
        ]);
    }

    /**
     * Get public statistics (only published count, for member dashboard)
     */
    public function publicStats(): void
    {
        require_login();
        
        Response::success([
            'published' => $this->eventModel->count(EVENT_STATUS_PUBLISHED),
            'completed' => $this->eventModel->count(EVENT_STATUS_COMPLETED)
        ]);
    }
}
