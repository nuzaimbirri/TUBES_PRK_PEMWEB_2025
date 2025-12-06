// Lokasi file: src/frontend/js/admin_app.js

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    const logoutButton = document.getElementById('logoutButton');
    
    // --- Config API (PATH HARUS DIPASTIKAN BENAR) ---
    const BASE_URL = 'http://localhost/TUBES PPW/TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17/src/backend/api/'; 
    const LOGOUT_API_URL = encodeURI(`${BASE_URL}auth.php?action=logout`);
    const ME_API_URL = encodeURI(`${BASE_URL}auth.php?action=me`);
    const USER_STATS_URL = encodeURI(`${BASE_URL}users.php?action=statistics`);
    const EVENT_STATS_URL = encodeURI(`${BASE_URL}events.php?action=statistics`);

    const headers = { 'Content-Type': 'application/json' };

    // --- Sidebar Toggle Logic (untuk mobile) ---
    if (sidebarCollapse) {
        sidebarCollapse.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // --- Authentication Check and User Info Load ---
    const checkAuthAndLoadUser = async () => {
        try {
            const response = await fetch(ME_API_URL, { method: 'GET' });

            if (!response.ok) {
                throw new Error('Unauthorized');
            }

            const result = await response.json();
            const user = result.data.user;
            
            // Tampilkan informasi user
            document.getElementById('currentUsername').textContent = user.username;
            document.getElementById('userRoleDisplay').textContent = user.role.toUpperCase();

            // Jika user bukan admin, redirect keluar (opsional, tergantung kebijakan)
            if (user.role !== 'admin') {
                console.warn("User is not admin, redirecting.");
                // FIX 1: Redirect jika bukan admin
                window.location.href = '../../auth/login.html'; 
            }
            
            // Muat data statistik
            loadStatistics(); 

        } catch (error) {
            console.error('Authentication Error:', error);
            // FIX 2: Redirect jika gagal auth/sesi habis
            window.location.href = '../../auth/login.html'; 
        }
    };

    // --- Logout Handler ---
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!confirm('Apakah Anda yakin ingin keluar dari sistem?')) return;
            
            try {
                await fetch(LOGOUT_API_URL, { method: 'POST' });
                // FIX 3: Redirect setelah logout sukses
                window.location.href = '../../auth/login.html'; 

            } catch (error) {
                console.error('Logout failed but redirecting:', error);
                // FIX 4: Redirect jika error logout
                window.location.href = '../../auth/login.html'; 
            }
        });
    }

    // --- Data Fetching Logic ---
    // ... (rest of the loadStatistics function remains the same) ...

    const loadStatistics = async () => {
        try {
            // 1. Fetch User Stats
            const userRes = await fetch(USER_STATS_URL, { headers });
            const userResult = await userRes.json();
            
            if (userResult.status === 'success') {
                const data = userResult.data;
                document.getElementById('totalUsersCount').textContent = data.total || 0;
                document.getElementById('pendingRegCount').textContent = data.anggota || 0; 
            }

            // 2. Fetch Event Stats
            const eventRes = await fetch(EVENT_STATS_URL, { headers });
            const eventResult = await eventRes.json();

            if (eventResult.status === 'success') {
                const data = eventResult.data;
                document.getElementById('pendingEventsCount').textContent = data.draft || 0; 
            }

        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
            document.getElementById('totalUsersCount').textContent = 'N/A';
            document.getElementById('pendingRegCount').textContent = 'N/A';
            document.getElementById('pendingEventsCount').textContent = 'N/A';
        }
        
        document.getElementById('spUsersCount').textContent = '4';
    };

    checkAuthAndLoadUser();

    // --- Router Logic Placeholder ---
    // Logika untuk memuat konten dinamis (misalnya saat klik Kelola Anggota) akan ditambahkan di fitur selanjutnya.
});