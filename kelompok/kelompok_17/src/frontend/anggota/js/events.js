/**
 * SIMORA Events Page - With Registration Status System
 * Features: Separate Sections (My Events & All Events), Registration Status Management
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ========================================
    // CONFIGURATION
    // ========================================
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isDotTest = hostname.endsWith('.test');
    
    let basePath = '';
    if (isLocalhost) {
        basePath = '/TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17/src';
    } else if (isDotTest) {
        basePath = '/kelompok/kelompok_17/src';
    }
    
    const API_BASE = `${basePath}/backend/api`;
    const UPLOAD_BASE = basePath.replace('/src', '/upload');
    const LOGIN_PAGE = `${basePath}/frontend/auth/login.html`;
    
    // ========================================
    // STATE MANAGEMENT
    // ========================================
    let allEvents = [];
    let myRegistrations = [];
    let myAttendances = [];
    let currentUser = null;
    let searchQuery = '';
    let filterStatus = '';
    let currentEventId = null;

    // DOM Elements
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const myEventsSection = document.getElementById('myEventsSection');
    const myEventsContainer = document.getElementById('myEventsContainer');
    const myEventsCount = document.getElementById('myEventsCount');
    const allEventsSection = document.getElementById('allEventsSection');
    const allEventsContainer = document.getElementById('allEventsContainer');
    const allEventsCount = document.getElementById('allEventsCount');
    const searchInput = document.getElementById('searchInput');
    const filterStatusSelect = document.getElementById('filterStatus');
    
    // Event Detail Modal
    const eventModal = document.getElementById('eventModal');
    const eventModalOverlay = document.getElementById('eventModalOverlay');
    const closeEventModal = document.getElementById('closeEventModal');
    const btnCloseDetail = document.getElementById('btnCloseDetail');
    const btnRegister = document.getElementById('btnRegister');
    const btnPresensi = document.getElementById('btnPresensi');
    const btnCancelRegistration = document.getElementById('btnCancelRegistration');
    const registrationStatusInfo = document.getElementById('registrationStatusInfo');
    
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
    // INITIALIZATION
    // ========================================
    async function init() {
        showLoading();
        
        // Load current user first
        const user = await loadCurrentUser();
        if (!user) {
            window.location.href = LOGIN_PAGE;
            return;
        }
        currentUser = user;
        
        // Update navbar with user data
        updateNavbarUser(user);
        
        await loadEvents();
        await loadMyRegistrations();
        setupEventListeners();
        renderAllSections();
        hideLoading();

        const urlParams = new URLSearchParams(window.location.search);
        const eventIdFromUrl = urlParams.get('event');
        if (eventIdFromUrl) {
            setTimeout(() => {
                openEventDetail(parseInt(eventIdFromUrl));
            }, 500);
        }
    }

    function updateNavbarUser(user) {
        const navUsername = document.getElementById('navUsername');
        const userInitials = document.getElementById('userInitials');
        const userAvatar = document.getElementById('userAvatar');
        
        if (navUsername) {
            navUsername.textContent = user.full_name || user.username;
        }
        
        if (userAvatar && user.profile_photo) {
            userAvatar.innerHTML = `<img src="${UPLOAD_BASE}/profile/${user.profile_photo}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else if (userInitials) {
            const name = user.full_name || user.username;
            const initials = name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
            userInitials.textContent = initials;
        }
    }

    // ========================================
    // LOAD CURRENT USER
    // ========================================
    async function loadCurrentUser() {
        try {
            const response = await fetch(`${API_BASE}/auth.php?action=me`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                return result.data;
            }
            return null;
        } catch (error) {
            console.error('Error loading user:', error);
            return null;
        }
    }

    // ========================================
    // LOAD MY REGISTRATIONS
    // ========================================
    async function loadMyRegistrations() {
        try {
            const regResponse = await fetch(`${API_BASE}/registrations.php?action=my-registrations`, {
                method: 'GET',
                credentials: 'include'
            });
            const regResult = await regResponse.json();
            
            if (regResponse.ok && regResult.status === 'success') {
                const regs = regResult.data?.registrations || regResult.data || [];
                myRegistrations = regs.map(reg => ({
                    event_id: reg.event_id,
                    status: reg.status,
                    registered_at: reg.created_at || reg.registered_at,
                    last_viewed: null,
                    division: reg.division,
                    registration_id: reg.registration_id
                }));
            } else {
                myRegistrations = [];
            }

            const attResponse = await fetch(`${API_BASE}/attendance.php?action=my-attendance`, {
                method: 'GET',
                credentials: 'include'
            });
            const attResult = await attResponse.json();
            
            if (attResponse.ok && attResult.status === 'success') {
                const attData = attResult.data?.attendance?.data || attResult.data?.attendance || [];
                myAttendances = attData.map(att => ({
                    event_id: att.event_id,
                    attendance_id: att.attendance_id,
                    status: att.status,
                    check_in_time: att.check_in_time,
                    photo: att.photo
                }));
                
                attData.forEach(att => {
                    const existing = myRegistrations.find(r => r.event_id === att.event_id);
                    if (!existing) {
                        myRegistrations.push({
                            event_id: att.event_id,
                            status: 'approved',
                            registered_at: att.check_in_time,
                            last_viewed: null
                        });
                    }
                });
            } else {
                myAttendances = [];
            }
        } catch (error) {
            console.error('Error loading registrations:', error);
            myRegistrations = [];
            myAttendances = [];
        }
    }

    // ========================================
    // LOAD EVENTS
    // ========================================
    async function loadEvents() {
        try {
            const response = await fetch(`${API_BASE}/events.php?action=list&limit=50`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();
            
            if (response.ok && result.status === 'success' && result.data && result.data.data) {
                const now = Date.now();
                
                allEvents = result.data.data.map(event => {
                    let eventStatus = 'upcoming';
                    const eventDate = event.event_date;
                    const startTime = event.start_time?.substring(0, 5) || '00:00';
                    const endTime = event.end_time?.substring(0, 5) || '23:59';
                    
                    const eventStart = new Date(`${eventDate}T${startTime}:00`).getTime();
                    const eventEnd = new Date(`${eventDate}T${endTime}:00`).getTime();
                    
                    if (event.status === 'completed') {
                        eventStatus = 'completed';
                    } else if (event.status === 'cancelled') {
                        eventStatus = 'cancelled';
                    } else if (now >= eventStart && now <= eventEnd) {
                        eventStatus = 'ongoing';
                    } else if (now > eventEnd) {
                        eventStatus = 'completed';
                    } else {
                        eventStatus = 'upcoming';
                    }
                    
                    return {
                        id: event.event_id,
                        title: event.title,
                        description: event.description || 'Tidak ada deskripsi',
                        date: event.event_date,
                        time: `${startTime} - ${endTime}`,
                        start_time: startTime,
                        end_time: endTime,
                        location: event.location || 'TBD',
                        status: eventStatus,
                        type: 'event',
                        registered_count: 0,
                        total_capacity: event.max_participants || 100,
                        attended_count: 0,
                        banner: event.banner || null,
                        open_registration: event.open_registration === 1 || event.open_registration === '1',
                        registration_deadline: event.registration_deadline || null,
                        max_participants: event.max_participants || null
                    };
                });
            } else {
                allEvents = [];
            }
        } catch (error) {
            console.error('Error loading events:', error);
            showToast('Gagal memuat data events', 'error');
            allEvents = [];
        }
    }

    // ========================================
    // RENDER ALL SECTIONS
    // ========================================
    function renderAllSections() {
        const filteredEvents = filterEvents();
        
        // Separate events into My Events and All Events
        const myEventIds = myRegistrations.map(r => r.event_id);
        let myEvents = filteredEvents.filter(e => myEventIds.includes(e.id));
        const availableEvents = filteredEvents.filter(e => !myEventIds.includes(e.id));

        // Sort My Events: Yang baru dibuka tampil paling atas
        myEvents.sort((a, b) => {
            const regA = myRegistrations.find(r => r.event_id === a.id);
            const regB = myRegistrations.find(r => r.event_id === b.id);
            
            // Event yang pernah dibuka (last_viewed ada) prioritas lebih tinggi
            const timeA = regA.last_viewed ? new Date(regA.last_viewed).getTime() : 0;
            const timeB = regB.last_viewed ? new Date(regB.last_viewed).getTime() : 0;
            
            // Sort descending: yang terbaru di atas
            return timeB - timeA;
        });

        // Render My Events Section
        if (myEvents.length > 0) {
            myEventsSection.style.display = 'block';
            myEventsCount.textContent = `${myEvents.length} Event`;
            myEventsContainer.innerHTML = myEvents.map(event => createEventCard(event, true)).join('');
            addCardClickHandlers(myEventsContainer);
        } else {
            myEventsSection.style.display = 'none';
        }

        // Render All Events Section
        if (availableEvents.length > 0) {
            allEventsSection.style.display = 'block';
            allEventsCount.textContent = `${availableEvents.length} Event`;
            allEventsContainer.innerHTML = availableEvents.map(event => createEventCard(event, false)).join('');
            addCardClickHandlers(allEventsContainer);
        } else {
            allEventsSection.style.display = 'none';
        }

        // Show empty state if no events at all
        if (myEvents.length === 0 && availableEvents.length === 0) {
            showEmptyState();
        } else {
            hideEmptyState();
        }
    }

    // ========================================
    // ADD CLICK HANDLERS TO CARDS
    // ========================================
    function addCardClickHandlers(container) {
        container.querySelectorAll('.event-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const eventId = parseInt(card.dataset.eventId);
                openEventDetail(eventId);
            });
        });
    }

    // ========================================
    // CREATE EVENT CARD
    // ========================================
    function createEventCard(event, isMyEvent) {
        const registration = myRegistrations.find(r => r.event_id === event.id);
        const eventIcon = getEventIcon(event.type);
        const statusBadge = getStatusBadge(event.status);
        
        let registrationBadge = '';
        if (isMyEvent && registration && event.status !== 'ongoing' && event.status !== 'completed') {
            registrationBadge = getRegistrationStatusBadge(registration.status);
        }

        const bannerContent = event.banner 
            ? `<img src="${UPLOAD_BASE}/event/${event.banner}" alt="${event.title}" class="event-card-banner-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
               <div class="event-card-icon" style="display:none;">${eventIcon}</div>`
            : `<div class="event-card-icon">${eventIcon}</div>`;

        const showParticipants = event.open_registration;

        return `
            <div class="event-card" data-event-id="${event.id}">
                <div class="event-card-banner">
                    ${bannerContent}
                    ${registrationBadge}
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
                    ${showParticipants ? `
                    <div class="event-card-footer">
                        <span class="participants-count">
                            ${event.registered_count}/${event.total_capacity} Peserta
                        </span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // ========================================
    // CHECK IF EVENT IS ONGOING
    // ========================================
    function isEventOngoing(event) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === today.getTime();
    }

    // ========================================
    // GET REGISTRATION STATUS BADGE
    // ========================================
    function getRegistrationStatusBadge(status) {
        const badges = {
            pending: `
                <div class="event-status-registration status-registration-pending">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Menunggu Approval
                </div>
            `,
            approved: `
                <div class="event-status-registration status-registration-approved">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Disetujui
                </div>
            `,
            rejected: `
                <div class="event-status-registration status-registration-rejected">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    Ditolak
                </div>
            `,
            cancelled: `
                <div class="event-status-registration status-registration-cancelled">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    Dibatalkan
                </div>
            `
        };
        return badges[status] || '';
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
                const myEventIds = myRegistrations.map(r => r.event_id);
                matchesStatus = myEventIds.includes(event.id);
            } else if (filterStatus) {
                matchesStatus = event.status === filterStatus;
            }

            return matchesSearch && matchesStatus;
        });
    }

    // ========================================
    // OPEN EVENT DETAIL MODAL
    // ========================================
    async function openEventDetail(eventId) {
        const event = allEvents.find(e => e.id === eventId);
        if (!event) return;

        currentEventId = eventId;
        const registration = myRegistrations.find(r => r.event_id === eventId);
        
        const now = Date.now();
        const eventStart = new Date(`${event.date}T${event.start_time}:00`).getTime();
        const eventEnd = new Date(`${event.date}T${event.end_time}:00`).getTime();
        
        if (event.status !== 'cancelled' && event.status !== 'completed') {
            if (now >= eventStart && now <= eventEnd) {
                event.status = 'ongoing';
            } else if (now > eventEnd) {
                event.status = 'completed';
            } else {
                event.status = 'upcoming';
            }
        }
        
        if (registration) {
            registration.last_viewed = new Date().toISOString();
        }
        
        document.getElementById('detailTitle').textContent = event.title;
        document.getElementById('detailStatus').textContent = getStatusText(event.status);
        document.getElementById('detailStatus').className = `event-status-badge status-${event.status}`;
        document.getElementById('detailDateTime').textContent = `${formatDate(event.date)} • ${event.time}`;
        document.getElementById('detailDate').textContent = formatDate(event.date);
        document.getElementById('detailTime').textContent = event.time;
        document.getElementById('detailLocation').textContent = event.location;
        document.getElementById('detailDescription').textContent = event.description;
        
        let attendanceStats = { total: 0, hadir: 0, izin: 0, sakit: 0 };
        let registrationStats = { total: 0, approved: 0, pending: 0 };
        
        try {
            const detailRes = await fetch(`${API_BASE}/events.php?action=show&id=${eventId}`, {
                method: 'GET',
                credentials: 'include'
            });
            const detailResult = await detailRes.json();
            if (detailRes.ok && detailResult.status === 'success' && detailResult.data) {
                attendanceStats = detailResult.data.attendance_stats || attendanceStats;
                registrationStats = detailResult.data.registration_stats || registrationStats;
            }
        } catch (err) {
            console.error('Error fetching event detail:', err);
        }
        
        const totalPanitia = event.open_registration ? registrationStats.approved : 0;
        const hadirCount = attendanceStats.hadir || 0;
        const tidakHadirCount = (attendanceStats.izin || 0) + (attendanceStats.sakit || 0);
        
        document.getElementById('statHadir').textContent = hadirCount;
        document.getElementById('statTotal').textContent = totalPanitia || attendanceStats.total || 0;
        document.getElementById('statTidakHadir').textContent = tidakHadirCount;
        
        const eventIcon = getEventIcon(event.type);
        if (event.banner) {
            document.getElementById('detailBanner').innerHTML = `
                <img src="${UPLOAD_BASE}/event/${event.banner}" alt="${event.title}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="event-icon-large" style="display:none;">${eventIcon}</div>
            `;
        } else {
            document.getElementById('detailBanner').innerHTML = `<div class="event-icon-large">${eventIcon}</div>`;
        }

        btnRegister.style.display = 'none';
        btnPresensi.style.display = 'none';
        btnCancelRegistration.style.display = 'none';
        registrationStatusInfo.style.display = 'none';
        
        const eventIsOngoing = event.status === 'ongoing';
        const eventIsUpcoming = event.status === 'upcoming';
        const hasOpenRegistration = event.open_registration;
        const myAttendance = myAttendances.find(a => a.event_id === eventId);
        const hasAttended = !!myAttendance;
        
        if (hasAttended) {
            registrationStatusInfo.style.display = 'block';
            const statusLabels = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit' };
            registrationStatusInfo.innerHTML = `
                <div class="registration-info-box approved">
                    <div class="registration-info-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <h4>Presensi Tercatat</h4>
                    </div>
                    <p>Status: <strong>${statusLabels[myAttendance.status] || myAttendance.status}</strong><br>
                    Waktu: ${new Date(myAttendance.check_in_time).toLocaleString('id-ID')}</p>
                </div>
            `;
        } else if (!hasOpenRegistration) {
            if (eventIsOngoing) {
                btnPresensi.style.display = 'flex';
            } else if (eventIsUpcoming) {
                registrationStatusInfo.style.display = 'block';
                registrationStatusInfo.innerHTML = `
                    <div class="registration-info-box approved">
                        <div class="registration-info-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <h4>Event Terbuka untuk Semua</h4>
                        </div>
                        <p>Event ini tidak memerlukan pendaftaran. Silakan upload presensi saat event berlangsung.</p>
                    </div>
                `;
            }
        } else if (!registration && eventIsUpcoming) {
            btnRegister.style.display = 'flex';
        } else if (registration) {
            if (registration.status === 'pending') {
                registrationStatusInfo.style.display = 'block';
                registrationStatusInfo.innerHTML = getRegistrationStatusInfo(registration.status);
                btnCancelRegistration.style.display = 'flex';
            } else if (registration.status === 'approved') {
                if (eventIsOngoing) {
                    btnPresensi.style.display = 'flex';
                } else {
                    registrationStatusInfo.style.display = 'block';
                    registrationStatusInfo.innerHTML = getRegistrationStatusInfo(registration.status);
                }
            } else {
                registrationStatusInfo.style.display = 'block';
                registrationStatusInfo.innerHTML = getRegistrationStatusInfo(registration.status);
            }
        }

        const attendanceCard = document.getElementById('attendanceCard');
        
        if (hasAttended) {
            const statusLabels = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit' };
            const statusColors = { hadir: '#10b981', izin: '#f59e0b', sakit: '#ef4444' };
            attendanceCard.innerHTML = `
                <div class="attendance-status registered" style="border-color: ${statusColors[myAttendance.status] || '#10b981'}">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${statusColors[myAttendance.status] || '#10b981'}" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <h4>Presensi: ${statusLabels[myAttendance.status] || 'Tercatat'}</h4>
                    <p>Anda sudah melakukan presensi</p>
                </div>
            `;
        } else if (!hasOpenRegistration) {
            if (eventIsOngoing) {
                attendanceCard.innerHTML = `
                    <div class="attendance-status ongoing">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <h4>Event Sedang Berlangsung</h4>
                        <p>Silakan upload presensi Anda</p>
                    </div>
                `;
            } else {
                attendanceCard.innerHTML = `
                    <div class="attendance-status registered">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <h4>Terbuka untuk Semua Anggota</h4>
                        <p>Upload presensi saat event berlangsung</p>
                    </div>
                `;
            }
        } else if (eventIsOngoing && registration && registration.status === 'approved') {
            attendanceCard.innerHTML = `
                <div class="attendance-status ongoing">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <h4>Event Sedang Berlangsung</h4>
                    <p>Silakan upload presensi Anda</p>
                </div>
            `;
        } else if (registration) {
            attendanceCard.innerHTML = getAttendanceCardHTML(registration.status);
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
    // GET REGISTRATION STATUS INFO
    // ========================================
    function getRegistrationStatusInfo(status) {
        const info = {
            pending: `
                <div class="registration-info-box pending">
                    <div class="registration-info-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <h4>Menunggu Persetujuan Admin</h4>
                    </div>
                    <p>Pendaftaran Anda sedang dalam proses verifikasi. Harap tunggu konfirmasi dari admin.</p>
                </div>
            `,
            approved: `
                <div class="registration-info-box approved">
                    <div class="registration-info-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <h4>Pendaftaran Disetujui</h4>
                    </div>
                    <p>Selamat! Pendaftaran Anda telah disetujui. Jangan lupa upload presensi saat event berlangsung.</p>
                </div>
            `,
            rejected: `
                <div class="registration-info-box rejected">
                    <div class="registration-info-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <h4>Pendaftaran Ditolak</h4>
                    </div>
                    <p>Mohon maaf, pendaftaran Anda tidak dapat disetujui. Silakan hubungi admin untuk info lebih lanjut.</p>
                </div>
            `,
            cancelled: `
                <div class="registration-info-box cancelled">
                    <div class="registration-info-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                        <h4>Pendaftaran Dibatalkan</h4>
                    </div>
                    <p>Pendaftaran ini telah dibatalkan. Anda dapat mendaftar ulang jika masih tersedia.</p>
                </div>
            `
        };
        return info[status] || '';
    }

    // ========================================
    // GET ATTENDANCE CARD HTML
    // ========================================
    function getAttendanceCardHTML(status) {
        const cards = {
            pending: `
                <div class="attendance-status">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <h4>Menunggu Approval</h4>
                    <p>Pendaftaran sedang diproses admin</p>
                </div>
            `,
            approved: `
                <div class="attendance-status registered">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <h4>Terdaftar & Disetujui</h4>
                    <p>Anda dapat upload presensi</p>
                </div>
            `,
            rejected: `
                <div class="attendance-status not-registered">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    <h4>Pendaftaran Ditolak</h4>
                    <p>Hubungi admin untuk info lebih lanjut</p>
                </div>
            `,
            cancelled: `
                <div class="attendance-status not-registered">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    <h4>Dibatalkan</h4>
                    <p>Anda membatalkan pendaftaran</p>
                </div>
            `
        };
        return cards[status] || '';
    }

    // ========================================
    // CLOSE EVENT DETAIL MODAL
    // ========================================
    function closeEventDetailModal() {
        eventModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Re-render sections untuk update urutan (event yang baru dibuka ke atas)
        const wasMyEvent = myRegistrations.some(r => r.event_id === currentEventId);
        if (wasMyEvent) {
            renderAllSections();
        }
        
        currentEventId = null;
    }

    // ========================================
    // HANDLE EVENT REGISTRATION
    // ========================================
    async function registerEvent() {
        if (!currentEventId) return;
        
        const event = allEvents.find(e => e.id === currentEventId);
        if (!event) return;
        
        if (event.open_registration) {
            openRegistrationModal();
        } else {
            showToast('Event ini tidak memerlukan pendaftaran. Silakan upload presensi saat event berlangsung.', 'info');
        }
    }

    // ========================================
    // CANCEL REGISTRATION
    // ========================================
    async function cancelRegistration() {
        if (!currentEventId) return;
        
        showConfirmModal(
            'Batalkan Pendaftaran',
            'Yakin ingin membatalkan pendaftaran event ini? Anda mungkin perlu mendaftar ulang jika berubah pikiran.',
            async () => {
                await submitCancelRegistration();
            }
        );
    }

    async function submitCancelRegistration() {
        btnCancelRegistration.disabled = true;
        btnCancelRegistration.innerHTML = `<div class="spinner-sm"></div> Membatalkan...`;

        try {
            const registration = myRegistrations.find(r => r.event_id === currentEventId);
            if (!registration || !registration.registration_id) {
                showToast('Data pendaftaran tidak ditemukan', 'error');
                return;
            }

            const response = await fetch(`${API_BASE}/registrations.php?action=cancel&id=${registration.registration_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                closeEventDetailModal();
                await loadMyRegistrations();
                renderAllSections();
                showToast('Pendaftaran berhasil dibatalkan', 'info');
            } else {
                showToast(result.message || 'Gagal membatalkan pendaftaran', 'error');
            }
        } catch (error) {
            console.error('Error cancelling registration:', error);
            showToast('Gagal terhubung ke server', 'error');
        } finally {
            btnCancelRegistration.disabled = false;
            btnCancelRegistration.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Batalkan Pendaftaran
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

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Format file tidak valid. Gunakan JPG, JPEG, atau PNG', 'error');
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast('Ukuran file terlalu besar. Maksimal 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            uploadPreview.style.display = 'block';
            uploadPlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    });

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

    document.querySelectorAll('input[name="attendance_status"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const status = e.target.value;
            const photoHint = document.getElementById('photoHint');
            const notesRequired = document.getElementById('notesRequired');
            const notesField = document.getElementById('presensiNotes');
            
            if (status === 'hadir') {
                photoHint.textContent = 'Upload foto selfie di lokasi event';
                notesRequired.style.display = 'none';
                notesField.removeAttribute('required');
                notesField.placeholder = 'Tambahkan keterangan jika perlu...';
            } else if (status === 'izin') {
                photoHint.textContent = 'Upload bukti surat izin atau dokumen pendukung';
                notesRequired.style.display = 'inline';
                notesField.setAttribute('required', 'required');
                notesField.placeholder = 'Jelaskan alasan izin Anda...';
            } else if (status === 'sakit') {
                photoHint.textContent = 'Upload foto surat dokter atau bukti sakit';
                notesRequired.style.display = 'inline';
                notesField.setAttribute('required', 'required');
                notesField.placeholder = 'Jelaskan kondisi kesehatan Anda...';
            }
        });
    });

    presensiForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const eventId = document.getElementById('presensiEventId').value;
        const photoFile = presensiPhoto.files[0];
        const notes = document.getElementById('presensiNotes').value;
        const attendanceStatus = document.querySelector('input[name="attendance_status"]:checked').value;

        if (!photoFile) {
            showToast('Mohon upload foto bukti', 'error');
            return;
        }

        if ((attendanceStatus === 'izin' || attendanceStatus === 'sakit') && !notes.trim()) {
            showToast('Mohon isi keterangan untuk izin/sakit', 'error');
            return;
        }

        const statusLabels = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit' };
        showConfirmModal(
            'Konfirmasi Presensi',
            `Anda akan mengirim presensi dengan status "${statusLabels[attendanceStatus]}". Lanjutkan?`,
            async () => {
                await submitPresensi(eventId, photoFile, notes, attendanceStatus);
            }
        );
    });

    async function submitPresensi(eventId, photoFile, notes, attendanceStatus) {
        const btnSubmit = document.getElementById('btnSubmitPresensi');
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<div class="spinner-sm"></div> Mengirim...`;

        try {
            const formData = new FormData();
            formData.append('event_id', eventId);
            formData.append('photo', photoFile);
            formData.append('status', attendanceStatus || 'hadir');
            if (notes) formData.append('notes', notes);

            const response = await fetch(`${API_BASE}/attendance.php?action=checkin`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                closePresensiModalFunc();
                closeEventDetailModal();
                const statusMessages = {
                    hadir: 'Presensi kehadiran Anda telah berhasil dicatat.',
                    izin: 'Permohonan izin Anda telah berhasil dikirim.',
                    sakit: 'Keterangan sakit Anda telah berhasil dikirim. Semoga lekas sembuh!'
                };
                showSuccessModalFunc('Presensi Berhasil!', statusMessages[attendanceStatus] || 'Presensi telah dicatat.');
                await loadMyRegistrations();
                renderAllSections();
            } else {
                showToast(result.message || 'Gagal mengirim presensi', 'error');
            }
        } catch (error) {
            console.error('Error uploading presensi:', error);
            showToast('Gagal terhubung ke server', 'error');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Kirim Presensi
            `;
        }
    }

    // ========================================
    // REGISTRATION MODAL HANDLERS
    // ========================================
    const registrationModal = document.getElementById('registrationModal');
    const registrationModalOverlay = document.getElementById('registrationModalOverlay');
    const closeRegistrationModal = document.getElementById('closeRegistrationModal');
    const registrationForm = document.getElementById('registrationForm');
    const btnCancelRegistration2 = document.getElementById('btnCancelRegistration2');

    function openRegistrationModal() {
        document.getElementById('regEventId').value = currentEventId;
        registrationForm.reset();
        registrationModal.classList.add('active');
    }

    function closeRegistrationModalFunc() {
        registrationModal.classList.remove('active');
        registrationForm.reset();
    }

    // Registration Form Submit
    registrationForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const eventId = document.getElementById('regEventId').value;
        const division = document.getElementById('regDivision').value;
        const reason = document.getElementById('regReason').value;
        const experience = document.getElementById('regExperience').value;

        // Show confirmation modal
        showConfirmModal(
            'Konfirmasi Pendaftaran',
            `Anda akan mendaftar sebagai panitia divisi "${getDivisionName(division)}". Lanjutkan?`,
            async () => {
                await submitRegistration(eventId, division, reason, experience);
            }
        );
    });

    async function submitRegistration(eventId, division, reason, experience) {
        const btnSubmit = document.getElementById('btnSubmitRegistration');
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<div class="spinner-sm"></div> Mengirim...';

        try {
            const response = await fetch(`${API_BASE}/registrations.php?action=register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    event_id: parseInt(eventId),
                    division: division,
                    reason: reason,
                    experience: experience
                })
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                closeRegistrationModalFunc();
                closeEventDetailModal();
                
                await loadMyRegistrations();
                renderAllSections();
                showSuccessModalFunc('Pendaftaran Terkirim!', 'Pendaftaran Anda sedang menunggu persetujuan admin. Silakan cek kembali secara berkala.');
            } else {
                showToast(result.message || 'Gagal mendaftar', 'error');
            }
        } catch (error) {
            console.error('Error submitting registration:', error);
            showToast('Gagal terhubung ke server', 'error');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Kirim Pendaftaran
            `;
        }
    }

    function getDivisionName(code) {
        const divisions = {
            'acara': 'Acara',
            'perkap': 'Perlengkapan',
            'humas': 'Humas',
            'pubdok': 'Publikasi & Dokumentasi',
            'konsumsi': 'Konsumsi',
            'dana': 'Dana',
            'dekor': 'Dekorasi',
            'keamanan': 'Keamanan',
            'lainnya': 'Lainnya'
        };
        return divisions[code] || code;
    }

    // ========================================
    // CONFIRMATION & SUCCESS MODALS
    // ========================================
    const confirmModal = document.getElementById('confirmModal');
    const confirmModalOverlay = document.getElementById('confirmModalOverlay');
    const btnConfirmCancel = document.getElementById('btnConfirmCancel');
    const btnConfirmOk = document.getElementById('btnConfirmOk');
    let confirmCallback = null;

    function showConfirmModal(title, message, callback) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        confirmCallback = callback;
        confirmModal.classList.add('active');
    }

    function closeConfirmModal() {
        confirmModal.classList.remove('active');
        confirmCallback = null;
    }

    btnConfirmCancel?.addEventListener('click', closeConfirmModal);
    confirmModalOverlay?.addEventListener('click', closeConfirmModal);

    btnConfirmOk?.addEventListener('click', async () => {
        if (confirmCallback) {
            await confirmCallback();
        }
        closeConfirmModal();
    });

    const successModal = document.getElementById('successModal');
    const successModalOverlay = document.getElementById('successModalOverlay');
    const btnSuccessOk = document.getElementById('btnSuccessOk');

    function showSuccessModalFunc(title, message) {
        document.getElementById('successTitle').textContent = title;
        document.getElementById('successMessage').textContent = message;
        successModal.classList.add('active');
    }

    function closeSuccessModal() {
        successModal.classList.remove('active');
    }

    btnSuccessOk?.addEventListener('click', closeSuccessModal);
    successModalOverlay?.addEventListener('click', closeSuccessModal);

    // ========================================
    // EVENT LISTENERS
    // ========================================
    function setupEventListeners() {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderAllSections();
        });

        filterStatusSelect.addEventListener('change', (e) => {
            filterStatus = e.target.value;
            renderAllSections();
        });

        closeEventModal.addEventListener('click', closeEventDetailModal);
        eventModalOverlay.addEventListener('click', closeEventDetailModal);
        btnCloseDetail.addEventListener('click', closeEventDetailModal);

        btnRegister.addEventListener('click', registerEvent);
        btnPresensi.addEventListener('click', openPresensiModal);
        btnCancelRegistration.addEventListener('click', cancelRegistration);

        closePresensiModal.addEventListener('click', closePresensiModalFunc);
        presensiModalOverlay.addEventListener('click', closePresensiModalFunc);
        btnCancelPresensi.addEventListener('click', closePresensiModalFunc);

        // Registration Modal Listeners
        closeRegistrationModal?.addEventListener('click', closeRegistrationModalFunc);
        registrationModalOverlay?.addEventListener('click', closeRegistrationModalFunc);
        btnCancelRegistration2?.addEventListener('click', closeRegistrationModalFunc);

        // LOGOUT LISTENER DIHAPUS - Dipindahkan ke logout-helper.js
        // Logout sekarang menggunakan modal konfirmasi profesional mint green

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
        myEventsSection.style.display = 'none';
        allEventsSection.style.display = 'none';
        emptyState.style.display = 'none';
    }

    function hideLoading() {
        loadingState.style.display = 'none';
    }

    function showEmptyState() {
        myEventsSection.style.display = 'none';
        allEventsSection.style.display = 'none';
        emptyState.style.display = 'flex';
    }

    function hideEmptyState() {
        emptyState.style.display = 'none';
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
            workshop: '💻',
            seminar: '🎓',
            gathering: '🥳',
            meeting: '👥',
            webinar: '🖥️',
            competition: '🏆',
            training: '📚'
        };
        return icons[type] || '📅';
    }

    function getStatusBadge(status) {
        const badges = {
            upcoming: '<span class="event-status-badge status-upcoming">Mendatang</span>',
            ongoing: '<span class="event-status-badge status-ongoing">Sedang Berlangsung</span>',
            completed: '<span class="event-status-badge status-completed">Selesai</span>',
            cancelled: '<span class="event-status-badge status-cancelled">Dibatalkan</span>'
        };
        return badges[status] || '';
    }

    function getStatusText(status) {
        const texts = {
            upcoming: 'Mendatang',
            ongoing: 'Sedang Berlangsung',
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
        }, 3500);
    }

    init();
});
