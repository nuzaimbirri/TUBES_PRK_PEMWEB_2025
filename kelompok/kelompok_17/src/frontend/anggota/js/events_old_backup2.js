/**
 * SIMORA Events Page - Complete Implementation with Registration & Attendance Upload
 * Features: Event List, Registration, Attendance Photo Upload to Folder
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ========================================
    // CONFIGURATION
    // ========================================
    const API_BASE = '../../backend/api';
    const EVENTS_PER_PAGE = 9;
    
    // ========================================
    // STATE MANAGEMENT
    // ========================================
    let currentPage = 1;
    let allEvents = [];
    let registeredEvents = []; // Track user's registered events
    let currentUser = { id: 1, name: 'Budi Santoso' }; // Mock user
    let searchQuery = '';
    let filterStatus = '';
    let currentEventId = null;

    // DOM Elements
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const eventsContainer = document.getElementById('eventsContainer');
    const searchInput = document.getElementById('searchInput');
    const filterStatusSelect = document.getElementById('filterStatus');
    const paginationContainer = document.getElementById('paginationContainer');
    const pageInfo = document.getElementById('pageInfo');
    const btnPrevPage = document.getElementById('btnPrevPage');
    const btnNextPage = document.getElementById('btnNextPage');
    
    // Event Detail Modal
    const eventModal = document.getElementById('eventModal');
    const eventModalOverlay = document.getElementById('eventModalOverlay');
    const closeEventModal = document.getElementById('closeEventModal');
    const btnCloseDetail = document.getElementById('btnCloseDetail');
    const btnRegister = document.getElementById('btnRegister');
    const btnPresensi = document.getElementById('btnPresensi');
    
    // Presensi Modal
    const presensiModal = document.getElementById('presensiModal');
    const presensiModalOverlay = document.getElementById('presensiModalOverlay');
    const closePresensiModal = document.getElementById('closePresensiModal');
    const btnCancelPresensi = document.getElementById('btnCancelPresensi');
    const presensiForm = document.getElementById('presensiForm');
    const presensiPhoto = document.getElementById('presensiPhoto');
    const uploadArea = document.getElementById('uploadArea');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const uploadPreview = document.getElementById('uploadPreview');
    const previewImage = document.getElementById('previewImage');
    const btnRemovePreview = document.getElementById('btnRemovePreview');
    const toast = document.getElementById('toast');

    // ========================================
    // MOCK DATA - Replace with actual API call
    // ========================================
    const mockEvents = [
        {
            id: 1,
            title: 'Workshop Web Development',
            description: 'Belajar fundamental web development dengan HTML, CSS, dan JavaScript. Cocok untuk pemula yang ingin memulai karir di dunia web development.',
            date: '2025-01-15',
            time: '09:00 - 16:00',
            location: 'Lab Komputer Gedung A',
            status: 'upcoming',
            type: 'workshop',
            registered_count: 45,
            total_capacity: 50,
            attended_count: 0
        },
        {
            id: 2,
            title: 'Seminar IT Security',
            description: 'Membahas keamanan siber dan best practices dalam mengamankan aplikasi web dari berbagai ancaman cyber.',
            date: '2025-01-20',
            time: '13:00 - 15:00',
            location: 'Auditorium Utama',
            status: 'upcoming',
            type: 'seminar',
            registered_count: 120,
            total_capacity: 150,
            attended_count: 0
        },
        {
            id: 3,
            title: 'Gathering Anggota 2025',
            description: 'Acara berkumpul bersama semua anggota organisasi untuk mempererat silaturahmi dan membahas program kerja tahun depan.',
            date: '2025-02-10',
            time: '10:00 - 14:00',
            location: 'Taman Kampus',
            status: 'upcoming',
            type: 'gathering',
            registered_count: 85,
            total_capacity: 100,
            attended_count: 0
        },
        {
            id: 4,
            title: 'Training Git & GitHub',
            description: 'Pelatihan version control menggunakan Git dan GitHub untuk kolaborasi tim yang lebih efektif.',
            date: '2025-01-25',
            time: '14:00 - 17:00',
            location: 'Online via Zoom',
            status: 'upcoming',
            type: 'training',
            registered_count: 60,
            total_capacity: 80,
            attended_count: 0
        },
        {
            id: 5,
            title: 'Webinar AI & Machine Learning',
            description: 'Eksplorasi dunia AI dan ML dengan praktisi industri. Membahas trend terkini dan aplikasi praktis di dunia nyata.',
            date: '2024-12-10',
            time: '19:00 - 21:00',
            location: 'Online via YouTube Live',
            status: 'completed',
            type: 'webinar',
            registered_count: 200,
            total_capacity: 250,
            attended_count: 180
        },
        {
            id: 6,
            title: 'Competition Hackathon',
            description: 'Kompetisi pemrograman 24 jam untuk membuat solusi inovatif terhadap permasalahan sosial.',
            date: '2025-03-05',
            time: '08:00 - 20:00',
            location: 'Gedung Innovation Hub',
            status: 'upcoming',
            type: 'competition',
            registered_count: 30,
            total_capacity: 40,
            attended_count: 0
        }
    ];

    // Initialize with some registered events (simulate)
    registeredEvents = [1, 3]; // User sudah daftar event ID 1 dan 3

    // ========================================
    // INITIALIZATION
    // ========================================
    async function init() {
        showLoading();
        await loadEvents();
        setupEventListeners();
        renderEvents();
        hideLoading();
    }

    // ========================================
    // LOAD EVENTS
    // ========================================
    async function loadEvents() {
        try {
            // TODO: Replace with actual API call
            // const response = await fetch(`${API_BASE}/events.php`);
            // const data = await response.json();
            // allEvents = data.events || [];
            
            // For now, use mock data
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
            allEvents = mockEvents;
        } catch (error) {
            console.error('Error loading events:', error);
            showToast('Gagal memuat data events', 'error');
            allEvents = mockEvents; // Fallback to mock
        }
    }

    // ========================================
    // RENDER EVENTS
    // ========================================
    function renderEvents() {
        let filteredEvents = filterEvents();
        
        if (filteredEvents.length === 0) {
            showEmptyState();
            return;
        }

        hideEmptyState();
        
        // Pagination
        const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
        const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
        const endIndex = startIndex + EVENTS_PER_PAGE;
        const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

        eventsContainer.innerHTML = paginatedEvents.map(event => createEventCard(event)).join('');
        updatePagination(totalPages);
        
        // Add click handlers
        document.querySelectorAll('.event-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const eventId = parseInt(card.dataset.eventId);
                openEventDetail(eventId);
            });
        });
    }

    // ========================================
    // CREATE EVENT CARD
    // ========================================
    function createEventCard(event) {
        const isRegistered = registeredEvents.includes(event.id);
        const eventIcon = getEventIcon(event.type);
        const statusBadge = getStatusBadge(event.status);
        const registeredBadge = isRegistered ? `
            <div class="event-registered-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Terdaftar
            </div>
        ` : '';

        return `
            <div class="event-card" data-event-id="${event.id}">
                <div class="event-card-banner">
                    <div class="event-card-icon">${eventIcon}</div>
                    ${registeredBadge}
                </div>
                <div class="event-card-content">
                    <div class="event-card-meta">
                        ${statusBadge}
                        <span class="event-card-date">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            ${formatDate(event.date)}
                        </span>
                    </div>
                    <h3 class="event-card-title">${event.title}</h3>
                    <p class="event-card-description">${truncateText(event.description, 100)}</p>
                    <div class="event-card-info">
                        <span class="info-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${event.time}
                        </span>
                        <span class="info-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            ${event.location}
                        </span>
                    </div>
                    <div class="event-card-footer">
                        <span class="participants-count">
                            ${event.registered_count}/${event.total_capacity} Peserta
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    // ========================================
    // FILTER EVENTS
    // ========================================
    function filterEvents() {
        return allEvents.filter(event => {
            const matchesSearch = !searchQuery || 
                event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.description.toLowerCase().includes(searchQuery.toLowerCase());
            
            let matchesStatus = true;
            if (filterStatus === 'registered') {
                matchesStatus = registeredEvents.includes(event.id);
            } else if (filterStatus) {
                matchesStatus = event.status === filterStatus;
            }

            return matchesSearch && matchesStatus;
        });
    }

    // ========================================
    // OPEN EVENT DETAIL MODAL
    // ========================================
    function openEventDetail(eventId) {
        const event = allEvents.find(e => e.id === eventId);
        if (!event) return;

        currentEventId = eventId;
        const isRegistered = registeredEvents.includes(eventId);
        
        // Populate modal
        document.getElementById('detailTitle').textContent = event.title;
        document.getElementById('detailStatus').textContent = getStatusText(event.status);
        document.getElementById('detailStatus').className = `event-status-badge status-${event.status}`;
        document.getElementById('detailDateTime').textContent = `${formatDate(event.date)} • ${event.time}`;
        document.getElementById('detailDate').textContent = formatDate(event.date);
        document.getElementById('detailTime').textContent = event.time;
        document.getElementById('detailLocation').textContent = event.location;
        document.getElementById('detailDescription').textContent = event.description;
        document.getElementById('statHadir').textContent = event.attended_count;
        document.getElementById('statTotal').textContent = event.registered_count;
        document.getElementById('statTidakHadir').textContent = event.registered_count - event.attended_count;
        
        const eventIcon = getEventIcon(event.type);
        document.getElementById('detailBanner').innerHTML = `<div class="event-icon-large">${eventIcon}</div>`;

        // Show appropriate buttons
        btnRegister.style.display = 'none';
        btnPresensi.style.display = 'none';
        
        if (!isRegistered && event.status === 'upcoming') {
            btnRegister.style.display = 'flex';
        } else if (isRegistered && event.status === 'upcoming') {
            btnPresensi.style.display = 'flex';
        }

        // Update attendance card
        const attendanceCard = document.getElementById('attendanceCard');
        if (isRegistered) {
            attendanceCard.innerHTML = `
                <div class="attendance-status registered">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <h4>Sudah Terdaftar</h4>
                    <p>Anda sudah terdaftar di event ini</p>
                </div>
            `;
        } else {
            attendanceCard.innerHTML = `
                <div class="attendance-status not-registered">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h4>Belum Terdaftar</h4>
                    <p>Daftar sekarang untuk ikut event ini</p>
                </div>
            `;
        }

        eventModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // ========================================
    // CLOSE EVENT DETAIL MODAL
    // ========================================
    function closeEventDetailModal() {
        eventModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        currentEventId = null;
    }

    // ========================================
    // HANDLE EVENT REGISTRATION
    // ========================================
    async function registerEvent() {
        if (!currentEventId) return;

        try {
            btnRegister.disabled = true;
            btnRegister.innerHTML = `
                <div class="spinner-sm"></div>
                Mendaftar...
            `;

            // TODO: Replace with actual API call
            // const response = await fetch(`${API_BASE}/events.php`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ action: 'register', event_id: currentEventId, user_id: currentUser.id })
            // });
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Add to registered events
            if (!registeredEvents.includes(currentEventId)) {
                registeredEvents.push(currentEventId);
                showToast('Berhasil mendaftar event!', 'success');
                
                // Refresh modal and list
                closeEventDetailModal();
                renderEvents();
            }

        } catch (error) {
            console.error('Error registering event:', error);
            showToast('Gagal mendaftar event', 'error');
        } finally {
            btnRegister.disabled = false;
            btnRegister.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Daftar Event
            `;
        }
    }

    // ========================================
    // OPEN PRESENSI MODAL
    // ========================================
    function openPresensiModal() {
        document.getElementById('presensiEventId').value = currentEventId;
        presensiModal.classList.add('active');
        resetPresensiForm();
    }

    // ========================================
    // CLOSE PRESENSI MODAL
    // ========================================
    function closePresensiModalFunc() {
        presensiModal.classList.remove('active');
        resetPresensiForm();
    }

    // ========================================
    // RESET PRESENSI FORM
    // ========================================
    function resetPresensiForm() {
        presensiForm.reset();
        uploadPreview.style.display = 'none';
        uploadPlaceholder.style.display = 'block';
        previewImage.src = '';
    }

    // ========================================
    // HANDLE FILE UPLOAD
    // ========================================
    uploadArea.addEventListener('click', () => {
        presensiPhoto.click();
    });

    presensiPhoto.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Format file tidak valid. Gunakan JPG, JPEG, atau PNG', 'error');
            return;
        }

        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast('Ukuran file terlalu besar. Maksimal 5MB', 'error');
            return;
        }

        // Preview image
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            uploadPreview.style.display = 'block';
            uploadPlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    });

    // Drag & Drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--teal-600)';
        uploadArea.style.background = 'var(--teal-50)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';

        const file = e.dataTransfer.files[0];
        if (file) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            presensiPhoto.files = dataTransfer.files;
            presensiPhoto.dispatchEvent(new Event('change'));
        }
    });

    btnRemovePreview.addEventListener('click', (e) => {
        e.stopPropagation();
        resetPresensiForm();
    });

    // ========================================
    // SUBMIT PRESENSI FORM
    // ========================================
    presensiForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(presensiForm);
        formData.append('user_id', currentUser.id);

        try {
            const btnSubmit = document.getElementById('btnSubmitPresensi');
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `
                <div class="spinner-sm"></div>
                Mengirim...
            `;

            // Upload to backend
            const response = await fetch(`${API_BASE}/upload_presensi.php`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showToast('Presensi berhasil diupload!', 'success');
                closePresensiModalFunc();
                closeEventDetailModal();
            } else {
                throw new Error(result.message || 'Upload failed');
            }

        } catch (error) {
            console.error('Error uploading presensi:', error);
            showToast(error.message || 'Gagal upload presensi', 'error');
        } finally {
            const btnSubmit = document.getElementById('btnSubmitPresensi');
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Kirim Presensi
            `;
        }
    });

    // ========================================
    // EVENT LISTENERS
    // ========================================
    function setupEventListeners() {
        // Search
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            currentPage = 1;
            renderEvents();
        });

        // Filter
        filterStatusSelect.addEventListener('change', (e) => {
            filterStatus = e.target.value;
            currentPage = 1;
            renderEvents();
        });

        // Pagination
        btnPrevPage.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderEvents();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        btnNextPage.addEventListener('click', () => {
            const totalPages = Math.ceil(filterEvents().length / EVENTS_PER_PAGE);
            if (currentPage < totalPages) {
                currentPage++;
                renderEvents();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        // Modal close handlers
        closeEventModal.addEventListener('click', closeEventDetailModal);
        eventModalOverlay.addEventListener('click', closeEventDetailModal);
        btnCloseDetail.addEventListener('click', closeEventDetailModal);

        // Registration & Presensi
        btnRegister.addEventListener('click', registerEvent);
        btnPresensi.addEventListener('click', openPresensiModal);

        // Presensi modal close
        closePresensiModal.addEventListener('click', closePresensiModalFunc);
        presensiModalOverlay.addEventListener('click', closePresensiModalFunc);
        btnCancelPresensi.addEventListener('click', closePresensiModalFunc);

        // Logout
        document.getElementById('btnLogout')?.addEventListener('click', () => {
            if (confirm('Yakin ingin keluar?')) {
                window.location.href = '../auth/login.html';
            }
        });

        // Mobile nav toggle
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        navToggle?.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // ========================================
    // HELPER FUNCTIONS
    // ========================================
    function showLoading() {
        loadingState.style.display = 'flex';
        eventsContainer.style.display = 'none';
        emptyState.style.display = 'none';
        paginationContainer.style.display = 'none';
    }

    function hideLoading() {
        loadingState.style.display = 'none';
        eventsContainer.style.display = 'grid';
    }

    function showEmptyState() {
        eventsContainer.style.display = 'none';
        emptyState.style.display = 'flex';
        paginationContainer.style.display = 'none';
    }

    function hideEmptyState() {
        emptyState.style.display = 'none';
        eventsContainer.style.display = 'grid';
    }

    function updatePagination(totalPages) {
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
        btnPrevPage.disabled = currentPage === 1;
        btnNextPage.disabled = currentPage === totalPages;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    }

    function truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    function getEventIcon(type) {
        const icons = {
            workshop: 'W',
            seminar: 'S',
            gathering: 'G',
            meeting: 'M',
            webinar: 'WB',
            competition: 'C',
            training: 'T'
        };
        return icons[type] || 'E';
    }

    function getStatusBadge(status) {
        const badges = {
            upcoming: '<span class="event-status-badge status-upcoming">Mendatang</span>',
            completed: '<span class="event-status-badge status-completed">Selesai</span>',
            cancelled: '<span class="event-status-badge status-cancelled">Dibatalkan</span>'
        };
        return badges[status] || '';
    }

    function getStatusText(status) {
        const texts = {
            upcoming: 'Mendatang',
            completed: 'Selesai',
            cancelled: 'Dibatalkan'
        };
        return texts[status] || status;
    }

    function showToast(message, type = 'info') {
        const iconSvg = type === 'success' 
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'
            : type === 'error'
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

        document.getElementById('toastIcon').innerHTML = iconSvg;
        document.getElementById('toastMessage').textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
        }, 3000);
    }

    // ========================================
    // INITIALIZE APP
    // ========================================
    init();
});
