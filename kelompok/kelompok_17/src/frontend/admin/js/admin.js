document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Data Simulation (Mereplikasi data dari gambar) ---
    const statsData = [
        { 
            title: "TOTAL ANGGOTA", 
            value: "1,247", 
            icon: "fas fa-user-group", 
            status: "Status Keanggotaan Terdaftar",
            id: "stats-card-1"
        },
        { 
            title: "AGENDA BULAN INI", 
            value: "23", 
            icon: "fas fa-calendar-check", 
            status: "Kegiatan Terpublikasi",
            id: "stats-card-2"
        },
        { 
            title: "ANGGOTA NON-AKTIF", 
            value: "89", 
            icon: "fas fa-user-times", 
            status: "Perlu Tindak Lanjut (SP)",
            id: "stats-card-3"
        },
        { 
            title: "RATA-RATA PRESENSI (%)", 
            value: "88.5", 
            icon: "fas fa-chart-line", 
            status: "Target Kehadiran Kritis",
            id: "stats-card-4"
        }
    ];

    const agendaData = [
        { 
            title: "Electrical Engineering in Action (EEA) 2025", 
            date: "Senin, 15 Des 2025", 
            time: "09:00 WIB", 
            location: "Ruang Serbaguna A",
            icon: "fas fa-laptop-code",
            isZoom: false
        },
        { 
            title: "Rapat Koordinasi Divisi Baru", 
            date: "Rabu, 17 Des 2025", 
            time: "14:00 WIB", 
            location: "Zoom Meeting",
            icon: "fas fa-users-gear",
            isZoom: true
        }
    ];

    // --- 2. Data Rendering ---
    
    function renderStatsCards(container) {
        container.innerHTML = ''; 

        statsData.forEach((stat) => {
            
            // Tentukan kelas warna status berdasarkan konten
            let statusClass;
            if (stat.status.includes('Terdaftar')) {
                statusClass = 'status-text-positive';
            } else if (stat.status.includes('Perlu Tindak Lanjut') || stat.status.includes('Kritis')) {
                statusClass = 'status-text-negative';
            } else {
                 statusClass = 'status-text-neutral';
            }

            // Gunakan ID unik untuk styling CSS spesifik per kartu
            const html = `
                <div class="bg-white p-5 card-ringkasan-base shadow-lg hover:shadow-xl" id="${stat.id}">
                    <div class="flex flex-col">
                        <p class="text-xs font-medium text-gray-500 mb-4">${stat.title}</p>
                        
                        <div class="flex items-center justify-between">
                            <p class="text-4xl font-extrabold text-gray-900">${stat.value}</p>
                            <div class="card-icon-circle">
                                <i class="${stat.icon}"></i>
                            </div>
                        </div>
                        
                        <p class="text-sm mt-3 ${statusClass}">${stat.status}</p>
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });
    }

    function renderAgendaList(list) {
        list.innerHTML = ''; 
        
        agendaData.forEach((item) => {
            const locationIcon = item.isZoom ? 'fas fa-video' : 'fas fa-map-marker-alt';
            
            const html = `
                <div class="p-4 border-b last:border-b-0 border-gray-100 flex justify-between items-start">
                    
                    <div class="flex space-x-3 w-3/4">
                        <div class="text-2xl text-primary-brand mt-1"><i class="${item.icon}"></i></div>
                        <div>
                            <p class="font-semibold text-gray-800 mb-1">${item.title}</p>
                            <p class="text-xs text-gray-500 flex items-center mt-1">
                                <i class="fas fa-clock mr-1"></i> ${item.date}, ${item.time}
                            </p>
                            <p class="text-xs text-gray-500 flex items-center">
                                <i class="${locationIcon} mr-1"></i> ${item.location}
                            </p>
                        </div>
                    </div>

                    <button class="btn-agenda-action">Kelola Agenda</button>
                </div>
            `;
            list.innerHTML += html;
        });
    }
    
    function simulateAjaxLoad() {
        // ... (loading logic remains the same)
        const statsContainer = document.getElementById('stats-container');
        const agendaList = document.getElementById('agenda-list');
        
        statsContainer.innerHTML = '<p class="text-gray-500 col-span-4 text-center py-8">Memuat data organisasi...</p>';
        agendaList.innerHTML = '';

        setTimeout(() => {
            renderStatsCards(statsContainer);
            renderAgendaList(agendaList);
        }, 600);
    }


    // --- 3. Sidebar Toggle for Mobile Responsiveness (Same as before) ---
    window.toggleMobileSidebar = function() {
        const sidebar = document.getElementById('sidebar-mobile');
        const overlay = document.getElementById('sidebar-mobile-overlay');
        
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.classList.toggle('overflow-hidden');
    }

    // --- 4. Initialization ---
    simulateAjaxLoad();
});