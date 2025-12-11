document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = '../../backend/api';
    const COLORS = ['blue', 'purple', 'green', 'orange'];
    const EVENT_ICONS = {
        workshop: 'W',
        seminar: 'S',
        gathering: 'G',
        meeting: 'M',
        webinar: 'WB',
        competition: 'C',
        training: 'T',
        default: 'E'
    };
    let currentPage = 1;
    let totalPages = 1;
    let allEvents = [];
    let currentUser = null;
    let searchQuery = '';
    let filterStatus = '';
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const eventsContainer = document.getElementById('eventsContainer');
    const searchInput = document.getElementById('searchInput');
    const filterStatus_select = document.getElementById('filterStatus');
    const paginationContainer = document.getElementById('paginationContainer');
    const pageInfo = document.getElementById('pageInfo');
    const btnPrevPage = document.getElementById('btnPrevPage');
    const btnNextPage = document.getElementById('btnNextPage');
    const eventModal = document.getElementById('eventModal');
    const eventModalOverlay = document.getElementById('eventModalOverlay');
    const closeEventModal = document.getElementById('closeEventModal');
    const btnCloseDetail = document.getElementById('btnCloseDetail');
    const checkAuth = async () => {
        try {
            console.log('🔍 Checking authentication...');
            const response = await fetch(`${API_BASE}/auth.php?action=me`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();
            if (!response.ok || result.status !== 'success') {
                console.error('Auth failed');
                window.location.href = '../auth/login.html';
                return null;
            }
            console.log('Auth successful');
            currentUser = result.data;
            const navUsername = document.getElementById('navUsername');
            const userInitials = document.getElementById('userInitials');
            if (navUsername) {
                navUsername.textContent = currentUser.full_name || currentUser.username;
            }
            if (userInitials) {
                const name = currentUser.full_name || currentUser.username;
                const initials = name.split(' ')
                    .map(word => word.charAt(0))
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                userInitials.textContent = initials;
            }
            return currentUser;
        } catch (error) {
            console.error('Auth Error:', error);
            window.location.href = '../auth/login.html';
            return null;
        }
    };
    const initMobileNav = () => {
        const toggle = document.getElementById('navToggle');
        const menu = document.getElementById('navMenu');
        toggle?.addEventListener('click', () => {
            menu?.classList.toggle('active');
            toggle.classList.toggle('active');
        });
        menu?.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
                toggle?.classList.remove('active');
            });
        });
    };
    const fetchEvents = async (page = 1, search = '', status = '') => {
        try {
            showLoadingState();
            let url = `${API_BASE}/events.php?action=list&page=${page}&limit=9`;
            if (search) {
                url = `${API_BASE}/events.php?action=search&q=${encodeURIComponent(search)}&page=${page}&limit=9`;
            }
            if (status) {
                url += `&status=${status}`;
            }
            console.log('📡 Fetching events:', url);
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();
            if (!response.ok || result.status !== 'success') {
                throw new Error(result.message || 'Failed to fetch events');
            }
            console.log('Events loaded:', result);
            if (result.data.data) {
                allEvents = result.data.data;
                currentPage = result.data.current_page;
                totalPages = result.data.total_pages;
            } else if (Array.isArray(result.data)) {
                allEvents = result.data;
                currentPage = 1;
                totalPages = 1;
            }
            hideLoadingState();
            renderEvents();
            updatePagination();
        } catch (error) {
            console.error('Error fetching events:', error);
            hideLoadingState();
            showEmptyState();
        }
    };
    const renderEvents = () => {
        if (!allEvents || allEvents.length === 0) {
            showEmptyState();
            return;
        }
        hideEmptyState();
        eventsContainer.innerHTML = '';
        allEvents.forEach((event, index) => {
            const card = createEventCard(event, index);
            eventsContainer.appendChild(card);
        });
    };
    const createEventCard = (event, index) => {
        const card = document.createElement('div');
        card.className = 'event-card';
        const colorClass = COLORS[index % COLORS.length];
        const icon = getEventIcon(event.title);
        const eventDate = new Date(event.event_date);
        const formattedDate = eventDate.toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
        const statusBadgeClass = event.status === 'completed' ? 'completed' : 
                                  event.status === 'cancelled' ? 'cancelled' : '';
        const statusText = event.status === 'published' ? 'Mendatang' : 
                           event.status === 'completed' ? 'Selesai' : 
                           event.status === 'cancelled' ? 'Dibatalkan' : event.status;
        card.innerHTML = `
            <div class="event-card-banner ${colorClass}">
                <span class="event-card-icon">${icon}</span>
            </div>
            <div class="event-card-content">
                <div class="event-card-status ${statusBadgeClass}">
                    <span>●</span>
                    <span>${statusText}</span>
                </div>
                <h3 class="event-card-title">${escapeHtml(event.title)}</h3>
                <div class="event-card-meta">
                    <div class="event-meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="event-meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>${event.start_time ? event.start_time.substring(0, 5) : '00:00'}</span>
                    </div>
                    <div class="event-meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>${escapeHtml(event.location || 'Lokasi TBA')}</span>
                    </div>
                </div>
            </div>
            <div class="event-card-footer">
                <div class="event-attendance">
                    <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </span>
                    <span><span class="event-attendance-count">0</span> peserta</span>
                </div>
                <button class="btn-view-detail">Lihat Detail</button>
            </div>
        `;
        card.querySelector('.btn-view-detail').addEventListener('click', () => {
            openEventDetail(event);
        });
        return card;
    };
    const getEventIcon = (title) => {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('workshop')) return EVENT_ICONS.workshop;
        if (lowerTitle.includes('seminar')) return EVENT_ICONS.seminar;
        if (lowerTitle.includes('gathering')) return EVENT_ICONS.gathering;
        if (lowerTitle.includes('meeting')) return EVENT_ICONS.meeting;
        if (lowerTitle.includes('webinar')) return EVENT_ICONS.webinar;
        if (lowerTitle.includes('competition') || lowerTitle.includes('kompetisi')) 
            return EVENT_ICONS.competition;
        if (lowerTitle.includes('training') || lowerTitle.includes('pelatihan')) 
            return EVENT_ICONS.training;
        return EVENT_ICONS.default;
    };
    const openEventDetail = async (event) => {
        try {
            const response = await fetch(`${API_BASE}/events.php?action=show&id=${event.id}`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();
            if (!response.ok || result.status !== 'success') {
                throw new Error('Failed to fetch event details');
            }
            const fullEvent = result.data;
            console.log('Event details:', fullEvent);
            fillEventModal(fullEvent);
            eventModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Error fetching event details:', error);
            alert('Gagal memuat detail kegiatan');
        }
    };
    const fillEventModal = (event) => {
        const colorClass = COLORS[(allEvents.indexOf(event)) % COLORS.length];
        const icon = getEventIcon(event.title);
        const eventDate = new Date(event.event_date);
        const formattedDate = eventDate.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const statusText = event.status === 'published' ? 'Mendatang' : 
                           event.status === 'completed' ? 'Selesai' : 
                           event.status === 'cancelled' ? 'Dibatalkan' : event.status;
        const statusClass = event.status === 'completed' ? 'completed' : 
                            event.status === 'cancelled' ? 'cancelled' : '';
        const banner = document.getElementById('detailBanner');
        banner.className = `event-detail-banner ${colorClass}`;
        banner.innerHTML = `<span>${icon}</span>`;
        document.getElementById('detailStatus').className = `event-status-badge ${statusClass}`;
        document.getElementById('detailStatus').textContent = statusText;
        document.getElementById('detailDateTime').textContent = 
            `${formattedDate} • ${event.start_time?.substring(0, 5) || '00:00'}`;
        document.getElementById('detailTitle').textContent = escapeHtml(event.title);
        document.getElementById('detailDate').textContent = formattedDate;
        document.getElementById('detailTime').textContent = 
            `${event.start_time?.substring(0, 5) || '00:00'} ${event.end_time ? '- ' + event.end_time.substring(0, 5) : ''}`;
        document.getElementById('detailLocation').textContent = escapeHtml(event.location || 'Lokasi TBA');
        document.getElementById('detailDescription').textContent = event.description || 'Tidak ada deskripsi';
        const stats = event.attendance_stats || {};
        document.getElementById('statHadir').textContent = stats.hadir || 0;
        document.getElementById('statTotal').textContent = stats.total || 0;
        document.getElementById('statTidakHadir').textContent = (stats.total || 0) - (stats.hadir || 0);
        const attendanceCard = document.getElementById('attendanceCard');
        const hasCheckedIn = event.has_checked_in;
        const btnCheckIn = document.getElementById('btnCheckIn');
        if (hasCheckedIn) {
            attendanceCard.innerHTML = `
                <div class="attendance-status" style="color: #10B981;">
                    ✓ Sudah Hadir
                </div>
                <div class="attendance-info">
                    Anda telah melakukan absensi untuk kegiatan ini.
                </div>
            `;
            btnCheckIn.style.display = 'none';
        } else {
            attendanceCard.innerHTML = `
                <div class="attendance-status">
                    Belum Hadir
                </div>
                <div class="attendance-info">
                    Silahkan lakukan absensi jika Anda hadir di kegiatan ini.
                </div>
            `;
            btnCheckIn.style.display = 'flex';
            btnCheckIn.onclick = () => checkInEvent(event.id);
        }
    };
    const closeEventModal_func = () => {
        eventModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    };
    const checkInEvent = async (eventId) => {
        try {
            const btnCheckIn = document.getElementById('btnCheckIn');
            btnCheckIn.disabled = true;
            btnCheckIn.textContent = 'Loading...';
            const response = await fetch(`${API_BASE}/attendance.php?action=check-in&event_id=${eventId}`, {
                method: 'POST',
                credentials: 'include'
            });
            const result = await response.json();
            if (!response.ok || result.status !== 'success') {
                throw new Error(result.message || 'Failed to check in');
            }
            console.log('Check-in successful');
            const attendanceCard = document.getElementById('attendanceCard');
            attendanceCard.innerHTML = `
                <div class="attendance-status" style="color: #10B981;">
                    ✓ Sudah Hadir
                </div>
                <div class="attendance-info">
                    Terima kasih! Anda telah melakukan absensi.
                </div>
            `;
            btnCheckIn.style.display = 'none';
            alert('Absensi berhasil dicatat!');
        } catch (error) {
            console.error('Check-in error:', error);
            alert('Gagal melakukan absensi: ' + error.message);
            const btnCheckIn = document.getElementById('btnCheckIn');
            btnCheckIn.disabled = false;
            btnCheckIn.textContent = 'Absen Sekarang';
        }
    };
    const handleSearch = async (value) => {
        searchQuery = value;
        currentPage = 1;
        await fetchEvents(currentPage, searchQuery, filterStatus);
    };
    const handleFilter = async (value) => {
        filterStatus = value;
        currentPage = 1;
        await fetchEvents(currentPage, searchQuery, filterStatus);
    };
    const updatePagination = () => {
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        paginationContainer.style.display = 'flex';
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
        btnPrevPage.disabled = currentPage === 1;
        btnNextPage.disabled = currentPage === totalPages;
    };
    const goToPage = async (page) => {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            await fetchEvents(currentPage, searchQuery, filterStatus);
        }
    };
    const showLoadingState = () => {
        loadingState.style.display = 'flex';
        emptyState.style.display = 'none';
        eventsContainer.innerHTML = '';
    };
    const hideLoadingState = () => {
        loadingState.style.display = 'none';
    };
    const showEmptyState = () => {
        emptyState.style.display = 'flex';
        eventsContainer.innerHTML = '';
    };
    const hideEmptyState = () => {
        emptyState.style.display = 'none';
    };
    const initLogout = () => {
        const btnLogout = document.getElementById('btnLogout');
        btnLogout?.addEventListener('click', async () => {
            try {
                btnLogout.textContent = 'Loading...';
                btnLogout.disabled = true;
                await fetch(`${API_BASE}/auth.php?action=logout`, {
                    method: 'POST',
                    credentials: 'include'
                });
                window.location.href = '../auth/login.html';
            } catch (error) {
                console.error('Logout error:', error);
                window.location.href = '../auth/login.html';
            }
        });
    };
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    searchInput?.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });
    filterStatus_select?.addEventListener('change', (e) => {
        handleFilter(e.target.value);
    });
    btnPrevPage?.addEventListener('click', () => {
        goToPage(currentPage - 1);
    });
    btnNextPage?.addEventListener('click', () => {
        goToPage(currentPage + 1);
    });
    closeEventModal?.addEventListener('click', closeEventModal_func);
    eventModalOverlay?.addEventListener('click', closeEventModal_func);
    btnCloseDetail?.addEventListener('click', closeEventModal_func);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && eventModal.classList.contains('active')) {
            closeEventModal_func();
        }
    });
    const init = async () => {
        console.log('Initializing Events Page...');
        await checkAuth();
        initMobileNav();
        initLogout();
        await fetchEvents(currentPage);
        console.log('Events page initialized');
    };
    init();
});
