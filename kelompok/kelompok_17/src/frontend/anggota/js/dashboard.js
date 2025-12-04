document.addEventListener('DOMContentLoaded', async () => {
    // Konfigurasi API Path - GUNAKAN ABSOLUTE URL
    const API_BASE = 'http://localhost/TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17/src/backend/api'; 
    
    // --------------------------------------------------------
    // 1. Cek Auth & Ambil Data User
    // --------------------------------------------------------
    try {
        console.log('🔍 Checking authentication...');
        const response = await fetch(`${API_BASE}/auth.php?action=me`, {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Auth result:', result);

        if (!response.ok || result.status !== 'success') {
            console.error('❌ Auth failed, redirecting to login...');
            window.location.href = '../auth/login_register.html';
            return;
        }

        console.log('✅ Auth successful!');
        const user = result.data;

        // Update UI User info
        document.getElementById('navUsername').textContent = user.full_name || user.username;
        
        // Inisial untuk avatar
        const name = user.full_name || user.username;
        document.getElementById('userInitials').textContent = name.substring(0, 2).toUpperCase();

    } catch (error) {
        console.error('❌ Auth Error:', error);
        window.location.href = '../auth/login_register.html';
        return;
    }

    // --------------------------------------------------------
    // 2. Fetch Statistik Kehadiran (PERLU CREDENTIALS JUGA)
    // --------------------------------------------------------
    try {
        // TAMBAHKAN credentials: 'include' DI SINI JUGA
        const response = await fetch(`${API_BASE}/attendance.php?action=my-attendance`, {
            method: 'GET',
            credentials: 'include' 
        });
        const result = await response.json();

        if (response.ok && result.status === 'success') {
            const stats = result.data.statistics;
            // Update Card Statistik
            document.getElementById('statTotalEvents').textContent = stats.total || 0;
            document.getElementById('statHadir').textContent = stats.hadir || 0;
            document.getElementById('statAlpha').textContent = stats.alpha || 0;
        }
    } catch (error) {
        console.error('Gagal mengambil statistik:', error);
    }

    // --------------------------------------------------------
    // 3. Fetch Kegiatan Mendatang (PERLU CREDENTIALS JUGA)
    // --------------------------------------------------------
    try {
        // TAMBAHKAN credentials: 'include' DI SINI JUGA
        const response = await fetch(`${API_BASE}/events.php?action=upcoming&limit=3`, {
            method: 'GET',
            credentials: 'include'
        });
        const result = await response.json();
        const container = document.getElementById('upcomingEventsContainer');

        if (response.ok && result.status === 'success' && result.data.length > 0) {
            container.innerHTML = ''; // Kosongkan loader

            result.data.forEach(event => {
                const dateObj = new Date(event.event_date);
                const day = dateObj.getDate();
                const month = dateObj.toLocaleString('id-ID', { month: 'short' });
                
                const cardHtml = `
                    <div class="col-md-4">
                        <div class="event-card">
                            <div class="event-date-box">
                                ${day} ${month}
                            </div>
                            <h5 class="text-white fw-bold text-truncate">${event.title}</h5>
                            <p class="text-muted small mb-3 text-truncate">
                                ${event.description || 'Tidak ada deskripsi singkat.'}
                            </p>
                            <div class="d-flex align-items-center text-muted small">
                                <span class="me-3">🕒 ${event.start_time.substring(0, 5)} WIB</span>
                                <span>📍 ${event.location || 'Online'}</span>
                            </div>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', cardHtml);
            });
        } else {
            container.innerHTML = '<div class="col-12 text-center text-muted">Tidak ada kegiatan mendatang.</div>';
        }

    } catch (error) {
        console.error('Error fetching events:', error);
        document.getElementById('upcomingEventsContainer').innerHTML = 
            '<div class="col-12 text-danger">Gagal memuat data kegiatan.</div>';
    }

    // --------------------------------------------------------
    // 4. Handle Logout (PERLU CREDENTIALS JUGA)
    // --------------------------------------------------------
    document.getElementById('btnLogout').addEventListener('click', async () => {
        try {
            // TAMBAHKAN credentials: 'include' DI SINI JUGA
            await fetch(`${API_BASE}/auth.php?action=logout`, { 
                method: 'POST',
                credentials: 'include'
            });
            window.location.href = '../auth/login_register.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Tetap redirect meski error (opsional, biar user ga stuck)
            window.location.href = '../auth/login_register.html';
        }
    });
});