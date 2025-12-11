document.addEventListener('DOMContentLoaded', () => {
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
    const AUTH_API = `${API_BASE}/auth.php`;
    const EVENTS_API = `${API_BASE}/events.php`;
    const PROFILE_API = `${API_BASE}/profile.php`;
    const UPLOAD_BASE = basePath.replace('/src', '/upload');

    const statsContainer = document.getElementById('stats-container');
    const agendaList = document.getElementById('agenda-list');
    const pendingMembersList = document.getElementById('pending-members-list');
    const adminMessage = document.getElementById('adminMessage');
    const pendingCountText = document.getElementById('pending-count');
    const notificationBadge = document.getElementById('notification-badge');
    const activeMembersList = document.getElementById('active-members-list');
    const searchMemberInput = document.getElementById('search-member');

    const IS_MEMBERS_PAGE = !!activeMembersList;
    const IS_APPROVALS_PAGE = !!pendingMembersList;
    
    let cachedPendingMembers = [];
    let cachedActiveMembers = [];
    let memberDetailModal = null;
    let changeStatusModal = null;
    let confirmDeleteModal = null;
    let confirmStatusModal = null;

    if (IS_MEMBERS_PAGE && typeof bootstrap !== 'undefined') {
        const detailEl = document.getElementById('memberDetailModal');
        const statusEl = document.getElementById('changeStatusModal');
        const deleteEl = document.getElementById('confirmDeleteModal');
        const confirmStatusEl = document.getElementById('confirmStatusModal');
        
        if (detailEl) memberDetailModal = new bootstrap.Modal(detailEl);
        if (statusEl) changeStatusModal = new bootstrap.Modal(statusEl);
        if (deleteEl) confirmDeleteModal = new bootstrap.Modal(deleteEl);
        if (confirmStatusEl) confirmStatusModal = new bootstrap.Modal(confirmStatusEl);
        
        // Expose modals to window for onclick handlers
        window.memberDetailModal = memberDetailModal;
        window.changeStatusModal = changeStatusModal;
        window.confirmDeleteModal = confirmDeleteModal;
        window.confirmStatusModal = confirmStatusModal;
    }

    const safeJson = async (res) => {
        try { return await res.json(); } catch (e) { return null; }
    };

    const displayMessage = (message, type) => {
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

    const updateNotificationBadge = (count) => {
        if (notificationBadge) {
            notificationBadge.textContent = count > 99 ? '99+' : count;
            if (count > 0) {
                notificationBadge.classList.remove('d-none');
            } else {
                notificationBadge.classList.add('d-none');
            }
        }
    };

    async function fetchDashboardStats() {
        if (!statsContainer) return;
        
        try {
            const response = await fetch(`${AUTH_API}?action=dashboard_stats`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await safeJson(response);
            
            if (result && result.status === 'success') {
                renderStatsCards(result.data);
            } else {
                renderStatsCards(null);
            }
        } catch (error) {
            renderStatsCards(null);
        }
    }

    function renderStatsCards(data) {
        if (!statsContainer) return;
        
        const stats = data ? [
            { 
                title: "TOTAL ANGGOTA", 
                value: data.total_members || 0, 
                icon: "fas fa-users", 
                status: "Anggota Aktif Terdaftar",
                id: "stats-card-1"
            },
            { 
                title: "EVENT BULAN INI", 
                value: data.this_month_events || 0, 
                icon: "fas fa-calendar-check", 
                status: "Kegiatan Terjadwal",
                id: "stats-card-2"
            },
            { 
                title: "MENUNGGU PERSETUJUAN", 
                value: data.pending_members || 0, 
                icon: "fas fa-user-clock", 
                status: "Pendaftar Baru",
                id: "stats-card-3"
            }
        ] : [
            { title: "TOTAL ANGGOTA", value: "-", icon: "fas fa-users", status: "Memuat data...", id: "stats-card-1" },
            { title: "EVENT BULAN INI", value: "-", icon: "fas fa-calendar-check", status: "Memuat data...", id: "stats-card-2" },
            { title: "MENUNGGU PERSETUJUAN", value: "-", icon: "fas fa-user-clock", status: "Memuat data...", id: "stats-card-3" }
        ];
        
        statsContainer.innerHTML = '';
        stats.forEach((stat) => {
            let statusClass = 'status-text-neutral';
            if (stat.status.includes('Aktif')) statusClass = 'status-text-positive';
            if (stat.status.includes('Pendaftar') || stat.status.includes('Menunggu')) statusClass = 'status-text-negative';

            const html = `
                <div class="bg-white p-5 card-ringkasan-base shadow-lg hover:shadow-xl" id="${stat.id}">
                    <div class="flex flex-col">
                        <p class="text-sm font-medium text-gray-500 mb-2">${stat.title}</p>
                        <div class="flex items-center justify-between">
                            <p class="text-4xl font-extrabold text-gray-900">${typeof stat.value === 'number' ? stat.value.toLocaleString('id-ID') : stat.value}</p>
                            <div class="card-icon-circle">
                                <i class="${stat.icon}"></i>
                            </div>
                        </div>
                        <p class="text-sm mt-2 ${statusClass}">${stat.status}</p>
                    </div>
                </div>
            `;
            statsContainer.innerHTML += html;
        });
    }

    async function fetchUpcomingEvents() {
        if (!agendaList) return;
        
        agendaList.innerHTML = '<p class="text-gray-500">Memuat data event...</p>';
        
        try {
            const response = await fetch(`${EVENTS_API}?action=upcoming&limit=5`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await safeJson(response);
            
            if (result && result.status === 'success' && Array.isArray(result.data)) {
                renderAgendaList(result.data);
            } else {
                agendaList.innerHTML = '<p class="text-gray-500">Tidak ada event mendatang.</p>';
            }
        } catch (error) {
            agendaList.innerHTML = '<p class="text-red-500">Gagal memuat data event.</p>';
        }
    }

    function renderAgendaList(events) {
        if (!agendaList) return;
        
        if (!events || events.length === 0) {
            agendaList.innerHTML = '<p class="text-gray-500 text-center py-4">Tidak ada event mendatang.</p>';
            return;
        }
        
        agendaList.innerHTML = '';
        events.forEach((event) => {
            const eventDate = new Date(event.event_date);
            const options = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
            const formattedDate = eventDate.toLocaleDateString('id-ID', options);
            const timeFormatted = event.start_time ? event.start_time.substring(0, 5) : '00:00';
            const locationIcon = event.location && event.location.toLowerCase().includes('zoom') ? 'fas fa-video' : 'fas fa-location-dot';
            
            const html = `
                <div class="p-4 border-b last:border-b-0 border-gray-100 flex justify-between items-start hover:bg-gray-50 transition-colors">
                    <div class="flex space-x-3 w-3/4">
                        <div class="card-icon-circle bg-gray-200 text-xl w-12 h-12 flex-shrink-0" style="background: none; box-shadow: none;">
                            <i class="fas fa-calendar-day" style="color: var(--clr-primary-brand);"></i>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-800 mb-1">${event.title}</p>
                            <p class="text-xs text-gray-500 mb-2 line-clamp-2">${event.description || 'Tidak ada deskripsi'}</p>
                            <p class="text-xs text-gray-500 flex items-center mt-1">
                                <i class="fas fa-clock mr-1"></i> ${formattedDate}, ${timeFormatted} WIB
                            </p>
                            <p class="text-xs text-gray-500 flex items-center">
                                <i class="${locationIcon} mr-1"></i> ${event.location || 'TBD'}
                            </p>
                        </div>
                    </div>
                    <a href="kelola_event.html?id=${event.event_id}" class="btn-agenda-action text-sm">Lihat Detail</a>
                </div>
            `;
            agendaList.innerHTML += html;
        });
    }

    function getStatusBadgeClass(status) {
        if (!status) return 'bg-gray-100 text-gray-700';
        const s = status.toUpperCase();
        if (s === 'AKTIF') return 'badge-aktif';
        if (s.includes('SP')) return 'badge-sp';
        if (s === 'NON-AKTIF') return 'badge-nonaktif';
        return 'bg-gray-100 text-gray-700';
    }

    async function fetchAndRenderActiveMembers() {
        if (!IS_MEMBERS_PAGE || !activeMembersList) return;

        activeMembersList.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">Memuat data anggota...</td></tr>';
        
        try {
            const response = await fetch(`${AUTH_API}?action=active_members`, { 
                method: "GET", 
                credentials: "include" 
            });
            const result = await safeJson(response);

            if (result && result.status === "success" && Array.isArray(result.data)) {
                cachedActiveMembers = result.data;
                renderMembersList(cachedActiveMembers);
            } else {
                activeMembersList.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Gagal memuat data: ${(result && result.message) || 'Error'}</td></tr>`;
            }
        } catch (error) {
            activeMembersList.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Kesalahan jaringan.</td></tr>';
        }
    }

    function renderMembersList(members) {
        if (!activeMembersList) return;
        
        if (members.length === 0) {
            activeMembersList.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">Tidak ada anggota yang ditemukan.</td></tr>';
            return;
        }

        activeMembersList.innerHTML = '';
        members.forEach(member => {
            const statusText = member.activity_status ? member.activity_status.toUpperCase() : 'AKTIF';
            const badgeClass = getStatusBadgeClass(statusText);
            const name = member.full_name || member.username;
            const escapedName = name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const initials = name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
            
            const avatarHtml = member.profile_photo
                ? `<img src="${UPLOAD_BASE}/profile/${member.profile_photo}" alt="${name}" class="w-8 h-8 rounded-full object-cover">`
                : `<span class="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-semibold">${initials}</span>`;
            
            const row = `
                <tr class="hover:bg-gray-50" data-member-id="${member.user_id}">
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                            ${avatarHtml}
                            <span class="font-medium text-gray-900">${name}</span>
                        </div>
                    </td>
                    <td class="px-4 py-3">${member.email}</td>
                    <td class="px-4 py-3">${member.npm || '-'}</td>
                    <td class="px-4 py-3">
                        <span class="text-xs font-semibold px-2.5 py-0.5 rounded cursor-pointer hover:opacity-80 ${badgeClass}" 
                                onclick="openChangeStatusModal(${member.user_id}, '${escapedName}', '${member.activity_status || 'aktif'}')"
                                title="Klik untuk ubah status">
                            ${statusText}
                        </span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                        <button class="text-blue-600 hover:text-blue-800 text-sm mr-3" onclick="openMemberDetail(${member.user_id})">Detail</button>
                        <button class="text-red-500 hover:text-red-700 text-sm" onclick="openDeleteConfirm(${member.user_id}, '${escapedName}')"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `;
            activeMembersList.innerHTML += row;
        });
    }

    function filterMembers(searchTerm) {
        if (!cachedActiveMembers.length) return;
        
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            renderMembersList(cachedActiveMembers);
            return;
        }
        
        const filtered = cachedActiveMembers.filter(member => {
            const name = (member.full_name || member.username || '').toLowerCase();
            const email = (member.email || '').toLowerCase();
            const npm = (member.npm || '').toLowerCase();
            return name.includes(term) || email.includes(term) || npm.includes(term);
        });
        
        renderMembersList(filtered);
    }

    window.openMemberDetail = async function(memberId) {
        const contentEl = document.getElementById('member-detail-content');
        if (!contentEl) return;
        
        contentEl.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-2">Memuat data...</p></div>';
        memberDetailModal.show();
        
        try {
            const response = await fetch(`${PROFILE_API}?action=get&user_id=${memberId}`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await safeJson(response);
            
            if (result && result.status === 'success' && result.data) {
                const m = result.data;
                const statusText = m.activity_status ? m.activity_status.toUpperCase() : 'AKTIF';
                const badgeClass = getStatusBadgeClass(statusText);
                const name = m.full_name || m.username;
                const escapedName = name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                const initials = name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
                
                const avatarHtml = m.profile_photo
                    ? `<img src="${UPLOAD_BASE}/profile/${m.profile_photo}" alt="${name}" class="w-24 h-24 rounded-full object-cover border-4 border-teal-200">`
                    : `<div class="w-24 h-24 rounded-full bg-teal-500 text-white flex items-center justify-center text-2xl font-bold border-4 border-teal-200">${initials}</div>`;
                
                const joinDate = m.created_at ? new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
                
                contentEl.innerHTML = `
                    <div class="text-center mb-4">
                        <div class="flex justify-center mb-3">${avatarHtml}</div>
                        <h4 class="text-xl font-bold text-gray-800">${name}</h4>
                        <p class="text-gray-500">${m.email}</p>
                        <span class="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded ${badgeClass}">${statusText}</span>
                    </div>
                    <hr class="my-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-500">Username</p>
                            <p class="font-medium">${m.username || '-'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">NPM</p>
                            <p class="font-medium">${m.npm || '-'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Jurusan/Prodi</p>
                            <p class="font-medium">${m.department || '-'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">No. Telepon</p>
                            <p class="font-medium">${m.phone_number || '-'}</p>
                        </div>
                        <div class="md:col-span-2">
                            <p class="text-sm text-gray-500">Alamat</p>
                            <p class="font-medium">${m.address || '-'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Tanggal Bergabung</p>
                            <p class="font-medium">${joinDate}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Role</p>
                            <p class="font-medium">${m.role === 'admin' ? 'Administrator' : 'Anggota'}</p>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="flex justify-center gap-3">
                        <button class="btn btn-primary btn-sm" style="background-color: var(--clr-primary-brand); border-color: var(--clr-primary-brand);" 
                                onclick="memberDetailModal.hide(); openChangeStatusModal(${m.user_id}, '${escapedName}', '${m.activity_status || 'aktif'}')">
                            <i class="fas fa-edit me-1"></i> Ubah Status
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="memberDetailModal.hide(); openDeleteConfirm(${m.user_id}, '${escapedName}')">
                            <i class="fas fa-trash-alt me-1"></i> Hapus Anggota
                        </button>
                    </div>
                `;
            } else {
                contentEl.innerHTML = '<div class="text-center py-4 text-red-500">Gagal memuat detail anggota.</div>';
            }
        } catch (error) {
            contentEl.innerHTML = '<div class="text-center py-4 text-red-500">Kesalahan jaringan.</div>';
        }
    };

    window.openChangeStatusModal = function(memberId, memberName, currentStatus) {
        document.getElementById('status-member-id').value = memberId;
        document.getElementById('status-member-name').textContent = memberName;
        
        document.querySelectorAll('.status-option').forEach(btn => {
            btn.classList.remove('active', 'ring-2', 'ring-offset-2');
            if (btn.dataset.status === currentStatus) {
                btn.classList.add('ring-2', 'ring-offset-2');
            }
        });
        
        changeStatusModal.show();
    };

    window.openDeleteConfirm = function(memberId, memberName) {
        document.getElementById('delete-member-id').value = memberId;
        document.getElementById('delete-member-name').textContent = memberName;
        confirmDeleteModal.show();
    };

    function initStatusChangeHandlers() {
        document.querySelectorAll('.status-option').forEach(btn => {
            btn.addEventListener('click', function() {
                const memberId = document.getElementById('status-member-id').value;
                const memberName = document.getElementById('status-member-name').textContent;
                const newStatus = this.dataset.status;
                
                changeStatusModal.hide();
                
                document.getElementById('confirm-status-member-id').value = memberId;
                document.getElementById('confirm-status-member-name').textContent = memberName;
                document.getElementById('confirm-status-new').textContent = newStatus.toUpperCase();
                document.getElementById('confirm-status-value').value = newStatus;
                
                confirmStatusModal.show();
            });
        });
        
        const confirmStatusBtn = document.getElementById('confirm-status-btn');
        if (confirmStatusBtn) {
            confirmStatusBtn.addEventListener('click', async function() {
                const memberId = document.getElementById('confirm-status-member-id').value;
                const newStatus = document.getElementById('confirm-status-value').value;
                
                this.disabled = true;
                this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Memproses...';
                
                try {
                    const response = await fetch(`${PROFILE_API}?action=update-status`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: memberId, activity_status: newStatus })
                    });
                    const result = await safeJson(response);
                    
                    if (result && result.status === 'success') {
                        confirmStatusModal.hide();
                        displayMessage('Status anggota berhasil diubah!', 'success');
                        fetchAndRenderActiveMembers();
                    } else {
                        displayMessage(result?.message || 'Gagal mengubah status', 'danger');
                    }
                } catch (error) {
                    displayMessage('Kesalahan jaringan', 'danger');
                }
                
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-check me-2"></i> Ya, Ubah';
            });
        }
        
        const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', async function() {
                const memberId = document.getElementById('delete-member-id').value;
                
                this.disabled = true;
                this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Menghapus...';
                
                try {
                    const response = await fetch(`${AUTH_API}?action=delete_member`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ member_id: memberId })
                    });
                    const result = await safeJson(response);
                    
                    if (result && result.status === 'success') {
                        confirmDeleteModal.hide();
                        displayMessage('Anggota berhasil dihapus!', 'success');
                        fetchAndRenderActiveMembers();
                        fetchDashboardStats();
                    } else {
                        displayMessage(result?.message || 'Gagal menghapus anggota', 'danger');
                    }
                } catch (error) {
                    displayMessage('Kesalahan jaringan', 'danger');
                }
                
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-trash-alt me-2"></i> Ya, Hapus';
            });
        }
    }

    if (searchMemberInput) {
        let searchTimeout;
        searchMemberInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterMembers(this.value);
            }, 300);
        });
    }

    function renderPendingMembersTable(members) {
        if (!pendingMembersList || !pendingCountText) return;

        pendingCountText.textContent = `(${members.length} Pending)`;
        cachedPendingMembers = members;
        
        if (members.length === 0) {
            pendingMembersList.innerHTML = `<li class="notification-card text-center py-2 font-medium text-green-600">🎉 Tidak ada pemberitahuan baru.</li>`;
            return;
        }

        pendingMembersList.innerHTML = '';
        members.forEach(member => {
            const fullName = member.full_name || member.username || 'Pendaftar Baru';
            const li = document.createElement('li');
            li.className = 'notification-card border-l-4 border-red-400';
            li.setAttribute('data-member-id', member.user_id);

            li.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="w-3/4">
                        <p class="text-xs text-gray-500 mb-1">ID: ${member.user_id}</p>
                        <p class="text-sm text-gray-800"><span class="font-semibold text-red-600">${fullName}</span> sudah melakukan pendaftaran anggota.</p>
                    </div>
                    <div class="flex space-x-2">
                        <button class="btn-approve-inline" data-action="approve" data-member-id="${member.user_id}" title="Setujui">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-reject-inline" data-action="reject" data-member-id="${member.user_id}" title="Tolak">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
            pendingMembersList.appendChild(li);
        });

        pendingMembersList.addEventListener('click', delegateApprovalClick);
    }

    async function delegateApprovalClick(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const memberId = btn.getAttribute('data-member-id');
        const action = btn.getAttribute('data-action');
        
        if (!memberId || !action) return;

        const statusAction = action === 'approve' ? 'approved' : 'rejected';
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const response = await fetch(`${AUTH_API}?action=approve_member`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ member_id: memberId, status: statusAction })
            });
            
            const result = await safeJson(response);
            
            if (result && result.status === 'success') {
                displayMessage(result.message || 'Berhasil!', 'success');
                fetchPendingMembers();
                fetchDashboardStats();
            } else {
                displayMessage(result?.message || 'Gagal memproses', 'danger');
                btn.disabled = false;
                btn.innerHTML = action === 'approve' ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
            }
        } catch (error) {
            displayMessage('Kesalahan jaringan', 'danger');
            btn.disabled = false;
            btn.innerHTML = action === 'approve' ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
        }
    }

    async function fetchPendingMembers() {
        try {
            const response = await fetch(`${AUTH_API}?action=pending_members`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await safeJson(response);

            if (result && result.status === 'success') {
                const members = Array.isArray(result.data) ? result.data : [];
                updateNotificationBadge(members.length);
                if (IS_APPROVALS_PAGE) {
                    renderPendingMembersTable(members);
                }
            } else {
                updateNotificationBadge(0);
            }
        } catch (error) {
            updateNotificationBadge(0);
        }
    }

    function initialize() {
        if (statsContainer) {
            fetchDashboardStats();
            fetchUpcomingEvents();
        }
        
        fetchPendingMembers();
        
        if (IS_MEMBERS_PAGE) {
            fetchAndRenderActiveMembers();
            initStatusChangeHandlers();
        }
    }
    
    initialize();

    window.toggleMobileSidebar = function() {
        const sidebar = document.getElementById('sidebar-mobile');
        const overlay = document.getElementById('sidebar-mobile-overlay');
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.classList.toggle('overflow-hidden');
    }
});