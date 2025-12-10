// Lokasi: js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    
    // --- API Configuration ---
    const BASE_API_URL = "http://localhost/TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17/src/backend/api/auth.php"; 
    // Endpoint Dashboard yang sudah final
    const DASHBOARD_API_URL = `${BASE_API_URL}?action=dashboard_stats`; 
    const LOGOUT_API_URL = `${BASE_API_URL}?action=logout`; 
    const LOGIN_PAGE_URL = "http://localhost/TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17/src/frontend/auth/login.html"; 
    
    // Elemen Halaman
    const statsContainer = document.getElementById('stats-container');
    const agendaList = document.getElementById('agenda-list'); // Tetap pakai agendaList untuk elemen HTML
    const notificationBadge = document.getElementById('notification-badge');
    const logoutButtonDesktop = document.getElementById('btn-logout-desktop'); 
    const logoutButtonMobile = document.getElementById('btn-logout-mobile'); 
    const logoutButtonDropdown = document.getElementById('btn-logout-dropdown'); 
    
    const IS_DASHBOARD_PAGE = !!statsContainer;

    // --- Helper Functions ---
    const safeJson = async (res) => { 
        try { 
            if (res.headers.get('content-length') === '0') return null;
            return await res.json(); 
        } catch (e) { 
            console.error('JSON Parse Error:', e); 
            console.error('Response status:', res.status, res.statusText);
            return null; 
        } 
    };

    // --- Data Rendering: Stats Cards ---
    function renderStatsCards(data) {
        if (!statsContainer) return;
        
        const cards = [
            { label: "TOTAL ANGGOTA", value: data.total_anggota.toLocaleString(), info: "Total Keseluruhan Terdaftar", icon: "fas fa-users", color: "#60A5FA" }, 
            { label: "EVENT BULAN INI", value: data.event_bulan_ini, info: "Kegiatan Terjadwal", icon: "fas fa-calendar-alt", color: "var(--clr-primary-brand)" }, 
            { label: "ANGGOTA NON-AKTIF", value: data.anggota_non_aktif, info: "Perlu Tindak Lanjut (SP)", icon: "fas fa-user-times", color: "var(--clr-btn-orange)" }
        ];

        statsContainer.innerHTML = cards.map((card, index) => `
            <div id="stats-card-${index + 1}" class="bg-white p-4 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm font-semibold text-gray-500 uppercase mb-1">${card.label}</p>
                        <h3 class="text-3xl font-bold text-gray-900">${card.value}</h3>
                        <p class="text-xs text-gray-400 mt-1">${card.info}</p>
                    </div>
                    <div class="w-10 h-10 flex items-center justify-center rounded-full text-white" style="background-color: ${card.color};">
                        <i class="${card.icon} text-lg"></i>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // --- Data Rendering: Upcoming Events ---
    function renderUpcomingEvents(events) {
        if (!agendaList) return;
        
        if (events.length === 0) {
             agendaList.innerHTML = '<p class="text-gray-500 py-4">Tidak ada event yang akan datang saat ini.</p>';
             return;
        }

        agendaList.innerHTML = events.map(event => `
            <div class="border-l-4 border-[var(--clr-primary-brand)] p-3 bg-white shadow-md rounded-lg flex justify-between items-center">
                <div class="flex-1">
                    <h4 class="font-bold text-md mb-1">${event.title}</h4>
                    <p class="text-xs text-gray-600 mb-1">${event.description}</p>
                    <div class="text-xs text-gray-500 space-y-0">
                        <p class="mb-0"><i class="far fa-calendar-alt mr-1"></i> ${event.date}</p>
                        <p class="mb-0"><i class="fas fa-map-marker-alt mr-1"></i> ${event.location}</p>
                    </div>
                </div>
                <button class="btn btn-sm btn-info text-white font-semibold py-2 px-3">Lihat Detail</button>
            </div>
        `).join('');
    }


    // --- Core Data Fetcher (Real Logic) ---
    async function fetchDashboardData() {
        if (!IS_DASHBOARD_PAGE) return;

        // Tampilkan indikator loading awal
        statsContainer.innerHTML = `
            <div class="bg-white p-4 rounded-xl shadow-lg border border-gray-100 text-center">Memuat...</div>
            <div class="bg-white p-4 rounded-xl shadow-lg border border-gray-100 text-center">Memuat...</div>
            <div class="bg-white p-4 rounded-xl shadow-lg border border-gray-100 text-center">Memuat...</div>
        `;
        agendaList.innerHTML = '<p class="text-gray-500">Memuat data event...</p>';


        try {
            const response = await fetch(DASHBOARD_API_URL, { 
                method: 'GET', 
                credentials: 'include'
            });

            if (response.status === 401) {
                // Jika server merespons 401 (Unauthorized), redirect ke halaman login
                window.location.href = LOGIN_PAGE_URL; 
                return;
            }

            const result = await safeJson(response);

            if (result && result.status === 'success') {
                const data = result.data;
                
                // 1. Render Statistik
                const stats = {
                    total_anggota: data.total_anggota || 0,
                    event_bulan_ini: data.event_bulan_ini || 0,
                    anggota_non_aktif: data.anggota_non_aktif || 0,
                };
                renderStatsCards(stats);
                
                // 2. Render Event Mendatang
                renderUpcomingEvents(data.upcoming_events || []); 
                
                // Optional: Update notif badge jika data tersedia
                // updateNotificationBadge(data.pending_count || 0);

            } else {
                 throw new Error(result ? result.message : 'Respons API tidak valid.');
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            statsContainer.innerHTML = '<p class="text-red-500 col-span-3">Gagal memuat data dashboard. Periksa koneksi API.</p>';
            agendaList.innerHTML = '<p class="text-red-500">Gagal memuat event.</p>';
        }
    }


    // ----------------------------------------------------------------------
    // Logika Logout & Initialization
    // ----------------------------------------------------------------------
    async function handleLogout(e) { 
        e.preventDefault();
        try {
             // Opsional: Panggil logout API
             await fetch(LOGOUT_API_URL, { method: "POST", credentials: "include" });
        } catch (error) {
             console.error('Logout API error:', error);
        }
        // Redirect ke halaman login
        window.location.href = LOGIN_PAGE_URL; 
    };

    function initialize() {
        fetchDashboardData();
        
        // Setup Logout Listeners
        if (logoutButtonDesktop) { logoutButtonDesktop.addEventListener('click', handleLogout); }
        if (logoutButtonMobile) { logoutButtonMobile.addEventListener('click', handleLogout); }
        if (logoutButtonDropdown) { logoutButtonDropdown.addEventListener('click', handleLogout); }
        
        // Sidebar Toggle
        window.toggleMobileSidebar = function() {
            const sidebar = document.getElementById('sidebar-mobile');
            const overlay = document.getElementById('sidebar-mobile-overlay');
            
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.classList.toggle('overflow-hidden');
        };
    }
    
    initialize();
});