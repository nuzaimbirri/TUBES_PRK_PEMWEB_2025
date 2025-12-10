// Lokasi file: src/frontend/admin/js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    
    // --- API Configuration ---
    const BASE_API_URL =
        "http://localhost/TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17/src/backend/api/auth.php"; 
    const PENDING_MEMBERS_API_URL = `${BASE_API_URL}?action=pending_members`;
    const APPROVE_MEMBER_API_URL = `${BASE_API_URL}?action=approve_member`;
    const LOGOUT_API_URL = `${BASE_API_URL}?action=logout`; 
    
    const LOGIN_PAGE_URL = "http://localhost/TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17/src/frontend/auth/login.html"; 
    const DATA_ANGGOTA_PAGE_URL = "kelola_anggota.html"; // Digunakan setelah persetujuan
    
    // --- URL BARU UNTUK DATA ANGGOTA AKTIF ---
    const ACTIVE_MEMBERS_API_URL = `${BASE_API_URL}?action=active_members`; 
    
    // Elemen Halaman
    const statsContainer = document.getElementById('stats-container');
    const agendaList = document.getElementById('agenda-list');
    const pendingMembersList = document.getElementById('pending-members-list'); // UL di notifikasi.html
    const adminMessage = document.getElementById('adminMessage'); 
    const pendingCountText = document.getElementById('pending-count'); 
    const notificationBadge = document.getElementById('notification-badge');
    const logoutButtonDesktop = document.getElementById('btn-logout-desktop'); 
    const logoutButtonMobile = document.getElementById('btn-logout-mobile'); 

    // --- VARIABEL BARU UNTUK KELOLA ANGGOTA ---
    const activeMembersList = document.getElementById('active-members-list'); // tbody di data_anggota.html
    const IS_MEMBERS_PAGE = !!activeMembersList;
    // ------------------------------------------

    // Cek apakah ini halaman notifikasi dan inisialisasi variabel modal
    const IS_APPROVALS_PAGE = !!pendingMembersList;
    let cachedPendingMembers = []; // Cache data yang sudah difetch untuk modal

    // --- PERBAIKAN: INISIALISASI VARIABEL MODAL HANYA JIKA ELEMEN ADA ---
    let memberDetailModal = null;
    let modalContentPlaceholder = null;
    let modalActionsContainer = null;

    if (IS_APPROVALS_PAGE) {
        const modalElement = document.getElementById('memberDetailModal');
        if (modalElement) {
            memberDetailModal = new bootstrap.Modal(modalElement);
            modalContentPlaceholder = document.getElementById('modal-content-placeholder');
            modalActionsContainer = document.getElementById('modal-actions');
        }
    }
    // ------------------------------------------------------------------

    // --- 1. Data Simulation (Tidak Berubah) ---
    const statsData = [
        { title: "TOTAL ANGGOTA", value: "1,247", icon: "fas fa-users", status: "Total Keanggotaan Terdaftar", id: "stats-card-1" },
        { title: "AGENDA BULAN INI", value: "23", icon: "fas fa-calendar-check", status: "Kegiatan Terpublikasi", id: "stats-card-2" },
        { title: "ANGGOTA NON-AKTIF", value: "89", icon: "fas fa-user-times", status: "Perlu Tindak Lanjut (SP)", id: "stats-card-3" },
        { title: "RATA-RATA PRESENSI (%)", value: "88.5", icon: "fas fa-chart-line", status: "Target Kehadiran Kritis", id: "stats-card-4" }
    ];

    const agendaData = [
        { title: "Electrical Engineering in Action (EEA) 2025", date: "Senin, 15 Des 2025", time: "09:00 WIB", location: "Ruang Serbaguna A", icon: "fas fa-laptop-code", description: "Pembukaan program kerja besar himpunan, wajib dihadiri seluruh anggota." },
        { title: "Rapat Koordinasi Divisi Baru", date: "Rabu, 17 Des 2025", time: "14:00 WIB", location: "Zoom Meeting", icon: "fas fa-users-gear", description: "Rapat internal untuk membahas struktur dan program kerja triwulan pertama." }
    ];

    // --- 2. Helper Functions ---
    const safeJson = async (res) => { 
        try { return await res.json(); } catch (e) { console.error('JSON Parse Error:', e); return null; } 
    };

    const displayMessage = (message, type) => { /* ... (logika displayMessage) ... */ 
        if (!adminMessage) return;
        adminMessage.classList.remove("d-none", "alert-danger", "alert-success", "alert-warning", "alert-info");
        adminMessage.classList.add(`alert-${type}`);
        adminMessage.textContent = message;
        
        if (type !== 'd-none') {
            setTimeout(() => {
                adminMessage.classList.add("d-none");
                adminMessage.textContent = '';
            }, 5000);
        }
    };

    const updateNotificationBadge = (count) => { /* ... (logika updateNotificationBadge) ... */
        if (notificationBadge) {
            notificationBadge.textContent = count > 99 ? '99+' : count;
            if (count > 0) {
                notificationBadge.classList.remove('d-none');
            } else {
                notificationBadge.classList.add('d-none');
            }
        }
    };
    
    // --- 3. Data Rendering (Hanya untuk Dashboard) ---
    
    function renderStatsCards(container) { /* ... (logika renderStatsCards) ... */
        if (!container) return;
        container.innerHTML = ''; 
        statsData.slice(0, 3).forEach((stat) => {
            let statusClass;
            if (stat.status.includes('Terdaftar')) { statusClass = 'status-text-positive'; } 
            else if (stat.status.includes('Perlu Tindak Lanjut') || stat.status.includes('Kritis')) { statusClass = 'status-text-negative'; } 
            else { statusClass = 'status-text-neutral'; }

            const html = `
                <div class="bg-white p-5 card-ringkasan-base shadow-lg hover:shadow-xl" id="${stat.id}">
                    <div class="flex flex-col">
                        <p class="text-sm font-medium text-gray-500 mb-2">${stat.title}</p>
                        <div class="flex items-center justify-between">
                            <p class="text-4xl font-extrabold text-gray-900">${stat.value}</p>
                            <div class="card-icon-circle">
                                <i class="${stat.icon}"></i>
                            </div>
                        </div>
                        <p class="text-sm mt-2 ${statusClass}">${stat.status}</p>
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });
    }

    function renderAgendaList(list) { /* ... (logika renderAgendaList) ... */
        if (!list) return;
        list.innerHTML = ''; 
        agendaData.forEach((item) => {
            const locationIcon = item.location.includes('Zoom') ? 'fas fa-video' : 'fas fa-location-dot'; 
            const html = `
                <div class="p-4 border-b last:border-b-0 border-gray-100 flex justify-between items-start">
                    <div class="flex space-x-3 w-3/4">
                        <div class="card-icon-circle bg-gray-200 text-xl w-12 h-12 flex-shrink-0" style="background: none; box-shadow: none;">
                            <i class="${item.icon}" style="color: var(--clr-primary-brand);"></i>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-800 mb-1">${item.title}</p>
                            <p class="text-xs text-gray-500 mb-2">${item.description}</p>
                            <p class="text-xs text-gray-500 flex items-center mt-1">
                                <i class="fas fa-clock mr-1"></i> ${item.date}, ${item.time}
                            </p>
                            <p class="text-xs text-gray-500 flex items-center">
                                <i class="${locationIcon} mr-1"></i> ${item.location}
                            </p>
                        </div>
                    </div>
                    <button class="btn-agenda-action text-sm">Lihat Detail</button>
                </div>
            `;
            list.innerHTML += html;
        });
    }


    // ----------------------------------------------------------------------
    // --- LOGIKA KELOLA ANGGOTA (DATA ANGGOTA AKTIF) ---
    // ----------------------------------------------------------------------
    
    function getStatusBadgeClass(status) {
        if (!status) return 'bg-gray-100 text-gray-700';
        const normalizedStatus = status.toUpperCase();
        if (normalizedStatus === 'AKTIF') return 'badge-aktif';
        if (normalizedStatus.includes('SP')) return 'badge-sp'; // Mencakup SP1, SP2, REKOMENDASI SP
        if (normalizedStatus === 'NON-AKTIF') return 'badge-nonaktif';
        return 'bg-gray-100 text-gray-700';
    }

    async function fetchAndRenderActiveMembers() {
        if (!IS_MEMBERS_PAGE || !activeMembersList) return;

        activeMembersList.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">Memuat data anggota...</td></tr>';
        
        try {
            // Perlu menyesuaikan API URL jika API Anda menggunakan format lain
            const response = await fetch(ACTIVE_MEMBERS_API_URL, { method: "GET", credentials: "include" });
            const result = await safeJson(response);

            if (result && result.status === "success" && Array.isArray(result.data)) {
                const members = result.data;
                
                if (members.length === 0) {
                    activeMembersList.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">Belum ada anggota yang terdaftar atau disetujui.</td></tr>';
                    return;
                }

                activeMembersList.innerHTML = '';
                members.forEach(member => {
                    const statusText = member.activity_status ? member.activity_status.toUpperCase() : 'AKTIF';
                    const badgeClass = getStatusBadgeClass(statusText);
                    
                    const row = `
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-3 font-medium text-gray-900">${member.full_name || member.username}</td>
                            <td class="px-4 py-3">${member.email}</td>
                            <td class="px-4 py-3">${member.npm || 'N/A'}</td>
                            <td class="px-4 py-3">
                                <span class="text-xs font-semibold px-2.5 py-0.5 rounded ${badgeClass}">
                                    ${statusText}
                                </span>
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap">
                                <a href="#" class="text-blue-600 hover:text-blue-800 text-sm mr-2">Lihat Detail</a>
                                <button class="text-red-500 hover:text-red-700 text-sm ml-2"><i class="fas fa-trash-alt"></i></button>
                            </td>
                        </tr>
                    `;
                    activeMembersList.innerHTML += row;
                });

            } else {
                activeMembersList.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Gagal memuat data anggota: ${(result && result.message) || 'Kesalahan sesi atau API.'}</td></tr>`;
            }

        } catch (error) {
            console.error('Network Error:', error);
            activeMembersList.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Kesalahan jaringan atau server.</td></tr>';
        }
    }


    // ----------------------------------------------------------------------
    // --- 4. Logika Persetujuan Anggota (Dijalankan di Halaman notifikasi.html) ---
    // ----------------------------------------------------------------------
    
    function renderPendingMembersTable(members) { /* ... (Logika renderPendingMembersTable tetap sama) ... */
        if (!pendingMembersList || !pendingCountText) return;

        pendingCountText.textContent = `(${members.length} Pending)`;
        cachedPendingMembers = members; // Simpan data di cache
        
        if (members.length === 0) {
            pendingMembersList.innerHTML = `<li class="notification-card text-center py-2 font-medium text-green-600">🎉 Tidak ada pemberitahuan baru.</li>`;
            pendingMembersList.removeEventListener('click', delegateApprovalClick);
            return;
        }

        pendingMembersList.innerHTML = '';
        members.forEach(member => {
            const fullName = member.full_name || member.username || 'Pendaftar Baru';
            const notificationMessage = `<span class="font-semibold text-red-600">${fullName}</span> sudah melakukan pendaftaran anggota.`;
            
            const li = document.createElement('li');
            li.className = 'notification-card border-l-4 border-red-400';
            li.setAttribute('data-member-id', member.user_id); 

            li.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="w-3/4">
                        <p class="text-xs text-gray-500 mb-1">ID: ${member.user_id}</p>
                        <p class="text-sm text-gray-800">${notificationMessage}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-700 font-semibold underline">Lihat untuk setujui/tolak</p>
                    </div>
                </div>
            `;
            pendingMembersList.appendChild(li);
        });
        
        pendingMembersList.removeEventListener('click', delegateApprovalClick); 
        pendingMembersList.addEventListener('click', delegateApprovalClick);
    }
    
    function delegateApprovalClick(e) { /* ... (Logika delegateApprovalClick tetap sama) ... */
        const li = e.target.closest('.notification-card');
        if (li && li.getAttribute('data-member-id') && memberDetailModal) {
            const memberId = li.getAttribute('data-member-id');
            showMemberDetailModal(memberId);
        }
    }

    function showMemberDetailModal(memberId) { /* ... (Logika showMemberDetailModal tetap sama) ... */
        if (!memberDetailModal || !modalContentPlaceholder || !modalActionsContainer) return;

        const member = cachedPendingMembers.find(m => m.user_id == memberId);
        if (!member) return;

        const contact = member.phone_number || member.contact || member.email || 'N/A';
        const npm = member.npm || member.nim || 'N/A';
        const fullName = member.full_name || member.username || 'Pendaftar';

        modalContentPlaceholder.innerHTML = `
            <h6 class="font-bold text-lg text-gray-800 mb-3">Informasi Pendaftar</h6>
            <div class="border rounded-lg p-3 bg-gray-50">
                <div class="detail-row"><span class="font-medium">Nama Lengkap:</span> <span>${fullName}</span></div>
                <div class="detail-row"><span class="font-medium">Username:</span> <span>${member.username || 'N/A'}</span></div>
                <div class="detail-row"><span class="font-medium">Email:</span> <span>${member.email || 'N/A'}</span></div>
                <div class="detail-row"><span class="font-medium">NPM/NIM:</span> <span>${npm}</span></div>
                <div class="detail-row"><span class="font-medium">Nomor Telepon:</span> <span>${contact}</span></div>
                <div class="detail-row"><span class="font-medium">Status:</span> <span class="text-red-500 font-semibold">Pending Persetujuan</span></div>
            </div>
        `;
        

        modalActionsContainer.innerHTML = `
            <button id="modal-btn-approve" class="btn-approve text-white px-3 py-2 rounded" 
                data-member-id="${memberId}" data-member-name="${fullName}">Setujui Pendaftaran</button>
            <button id="modal-btn-reject" class="btn-reject text-white px-3 py-2 rounded" 
                data-member-id="${memberId}" data-member-name="${fullName}">Tolak Pendaftaran</button>
        `;
        
        document.getElementById('modal-actions').removeEventListener('click', handleModalAction);
        document.getElementById('modal-actions').addEventListener('click', handleModalAction);

        memberDetailModal.show();
    }

    async function handleModalAction(e) { /* ... (Logika handleModalAction tetap sama) ... */
        const button = e.target;
        if (button.id === 'modal-btn-approve' || button.id === 'modal-btn-reject') {
            const memberId = button.getAttribute('data-member-id');
            const memberName = button.getAttribute('data-member-name');
            const action = button.id === 'modal-btn-approve' ? 'approved' : 'rejected';
            
            const allModalButtons = modalActionsContainer.querySelectorAll('button');
            allModalButtons.forEach(btn => {
                btn.disabled = true;
                if (btn === button) btn.textContent = 'Memproses...';
            });
            
            await handleApprovalLogic(memberId, action, memberName, button);
        }
    }

    async function handleApprovalLogic(memberId, action, memberName, button) { /* ... (Logika handleApprovalLogic tetap sama) ... */
        const liElement = document.querySelector(`li[data-member-id="${memberId}"]`);
        
        try {
            const response = await fetch(APPROVE_MEMBER_API_URL, {
                method: "POST", headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ member_id: memberId, status: action }),
                credentials: "include"
            });
            const result = await safeJson(response);

            memberDetailModal.hide(); 

            if (result && result.status === "success") {
                displayMessage(result.message, 'success'); 
                
                if (liElement) {
                    if (action === 'approved') {
                        const messageElement = liElement.querySelector('.text-sm.text-gray-800');
                        messageElement.innerHTML = `<span class="font-semibold text-green-600">${memberName}</span> sudah bergabung menjadi anggota SIMORA.`;
                        
                        liElement.querySelector('div:last-child').innerHTML = `<a href="${DATA_ANGGOTA_PAGE_URL}" class="text-[var(--clr-primary-brand)] font-semibold hover:underline text-sm">Lihat Data Anggota</a>`;
                        
                        liElement.classList.remove('border-red-400', 'cursor-pointer');
                        liElement.classList.add('border-green-400');
                        liElement.removeEventListener('click', delegateApprovalClick);
                    } else {
                        liElement.remove(); 
                    }
                }
                
                fetchPendingMembers(); 
            } else {
                displayMessage(`Gagal ${action}: ${(result && result.message) || 'Kesalahan API.'}`, 'danger');
            }

        } catch (err) {
            memberDetailModal.hide();
            console.error('Network Error:', err);
            displayMessage('Kesalahan jaringan saat memproses permintaan.', 'danger');
        }
    }


    // Logika utama fetch (Universal)
    async function fetchPendingMembers() { /* ... (Logika fetchPendingMembers tetap sama) ... */
        if (IS_APPROVALS_PAGE && pendingMembersList) {
             pendingMembersList.innerHTML = `<li class="text-center py-4 text-gray-500">Memuat data pendaftar...</li>`;
        }

        try {
            const response = await fetch(PENDING_MEMBERS_API_URL, { method: "GET", credentials: "include" });
            const result = await safeJson(response);

            if (result && result.status === "success" && Array.isArray(result.data)) {
                const members = result.data;
                updateNotificationBadge(members.length); 

                if (IS_APPROVALS_PAGE) {
                    renderPendingMembersTable(members);
                }
            } else {
                updateNotificationBadge(0);
                if (IS_APPROVALS_PAGE) {
                    pendingMembersList.innerHTML = `<li class="notification-card text-center py-2 font-medium text-green-600">🎉 Tidak ada pemberitahuan baru.</li>`;
                }
            }

        } catch (error) {
            console.error('Network Error:', error);
            updateNotificationBadge(0);
            if (IS_APPROVALS_PAGE) {
                pendingMembersList.innerHTML = `<li class="text-center py-4 text-red-500 font-semibold">Kesalahan jaringan atau sesi berakhir. Silakan coba refresh.</li>`;
            }
        }
    }


    // ----------------------------------------------------------------------
    // Logika Logout & Initialization
    // ----------------------------------------------------------------------
    async function handleLogout(e) { /* ... (Logika handleLogout tetap sama) ... */
        e.preventDefault();
        console.log('Logging out...');

        try {
            const response = await fetch(LOGOUT_API_URL, { method: 'POST', credentials: 'include' });
            await safeJson(response);
            
            setTimeout(() => { window.location.href = LOGIN_PAGE_URL; }, 500);
        } catch (error) {
            console.error('Network error during logout:', error);
            setTimeout(() => { window.location.href = LOGIN_PAGE_URL; }, 1000);
        }
    }

    function initialize() {
        // --- HOVER CARD LOGIC (JavaScript Fallback/Tambahan) ---
        if (statsContainer) {
            const cardIds = ['#stats-card-1', '#stats-card-2', '#stats-card-3'];
            const hoverColors = ['rgba(96, 165, 250, 0.4)', 'rgba(1, 162, 157, 0.4)', 'rgba(255, 133, 61, 0.4)'];
            
            cardIds.forEach((id, index) => {
                const card = document.querySelector(id);
                if (card) {
                    card.addEventListener('mouseenter', () => {
                        card.style.boxShadow = `0 10px 20px ${hoverColors[index]}`;
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                    });
                }
            });

            renderStatsCards(statsContainer);
            renderAgendaList(agendaList);
        }
        
        fetchPendingMembers();
        
        // 🆕 Panggil fetch data anggota jika di halaman yang tepat
        if (IS_MEMBERS_PAGE) {
            fetchAndRenderActiveMembers();
        }

        if (logoutButtonDesktop) {
            logoutButtonDesktop.addEventListener('click', handleLogout);
        }
        if (logoutButtonMobile) {
            logoutButtonMobile.addEventListener('click', handleLogout);
        }
    }
    
    initialize();

    // Sidebar Toggle
    window.toggleMobileSidebar = function() { /* ... (Logika toggleMobileSidebar tetap sama) ... */
        const sidebar = document.getElementById('sidebar-mobile');
        const overlay = document.getElementById('sidebar-mobile-overlay');
        
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.classList.toggle('overflow-hidden');
    }

});