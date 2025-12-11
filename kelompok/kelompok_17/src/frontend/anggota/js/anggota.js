document.addEventListener('DOMContentLoaded', async () => {
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
    async function loadAndUpdateUser() {
        try {
            const response = await fetch(`${API_BASE}/auth.php?action=me`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();
            if (!response.ok || result.status !== 'success') {
                window.location.href = LOGIN_PAGE;
                return;
            }
            const user = result.data;
            const navUsername = document.getElementById('navUsername');
            const userInitials = document.getElementById('userInitials');
            const userAvatar = document.getElementById('userAvatar');
            if (navUsername) {
                navUsername.textContent = user.full_name || user.username;
            }
            if (userInitials && userAvatar) {
                if (user.profile_photo) {
                    userAvatar.innerHTML = `<img src="${UPLOAD_BASE}/profile/${user.profile_photo}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                } else {
                    const name = user.full_name || user.username;
                    const initials = name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
                    userInitials.textContent = initials;
                }
            }
        } catch (error) {
            console.error('Error loading user:', error);
            window.location.href = LOGIN_PAGE;
        }
    }
    let members = [];
    let filteredMembers = [];
    let currentStatusFilter = 'all';
    let currentRoleFilter = 'all';
    let searchQuery = '';
    async function loadMembersFromAPI() {
        try {
            const response = await fetch(`${API_BASE}/auth.php?action=all_members`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();
            if (response.ok && result.status === 'success' && result.data && result.data.members) {
                members = result.data.members.map(m => ({
                    id: m.user_id,
                    name: m.full_name || m.username,
                    username: m.username,
                    initials: (m.full_name || m.username).split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase(),
                    email: m.email,
                    role: m.role === 'admin' ? 'Admin' : 'Anggota',
                    department: m.department || '-',
                    status: m.activity_status === 'aktif' ? 'active' : 'inactive',
                    activity_status: m.activity_status || 'aktif',
                    npm: m.npm || '-',
                    phone: m.phone_number || '-',
                    address: m.address || '-',
                    photo: m.profile_photo || null,
                    created_at: m.created_at
                }));
            } else {
                members = [];
            }
        } catch (error) {
            console.error('Error loading members:', error);
            members = [];
        }
        filteredMembers = [...members];
        renderMembers();
        updateResultsCount();
    }
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const filterBtn = document.getElementById('filterBtn');
    const filterPanel = document.getElementById('filterPanel');
    const membersGrid = document.getElementById('membersGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsCount = document.getElementById('resultsCount');
    const normalizeText = (text) => {
        if (!text) return '';
        return text.toString().toLowerCase().trim();
    };
    const matchesSearch = (member, query) => {
        if (!query) return true;
        const normalizedQuery = normalizeText(query);
        const searchableFields = [
            member.name,
            member.email,
            member.role,
            member.department,
            member.npm,
            member.username
        ];
        return searchableFields.some(field => 
            normalizeText(field).includes(normalizedQuery)
        );
    };
    const filterMembers = () => {
        filteredMembers = members.filter(member => {
            if (!matchesSearch(member, searchQuery)) return false;
            if (currentStatusFilter !== 'all') {
                if (currentStatusFilter === 'active' && member.status !== 'active') return false;
                if (currentStatusFilter === 'inactive' && member.status !== 'inactive') return false;
            }
            if (currentRoleFilter !== 'all') {
                const roleNorm = normalizeText(member.role);
                if (currentRoleFilter === 'admin' && roleNorm !== 'admin') return false;
                if (currentRoleFilter === 'anggota' && roleNorm !== 'anggota') return false;
                if (currentRoleFilter === 'pengurus' && !roleNorm.includes('pengurus')) return false;
            }
            return true;
        });
        renderMembers();
        updateResultsCount();
    };
    const updateResultsCount = () => {
        const total = members.length;
        const shown = filteredMembers.length;
        if (resultsCount) {
            resultsCount.textContent = `Menampilkan ${shown} dari ${total} anggota`;
        }
    };
    const createMemberCard = (member) => {
        const avatarContent = member.photo 
            ? `<img src="${UPLOAD_BASE}/profile/${member.photo}" alt="${member.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : member.initials;
        return `
            <div class="member-card" data-member-id="${member.id}">
                <div class="member-header">
                    <div class="member-avatar">
                        ${avatarContent}
                    </div>
                    <div class="member-info">
                        <h3 class="member-name">${member.name}</h3>
                        <p class="member-role">${member.role}</p>
                    </div>
                </div>
                <div class="member-details">
                    <div class="detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <span>${member.email}</span>
                    </div>
                    <div class="detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span>${member.department}</span>
                    </div>
                    <div class="detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="8.5" cy="7" r="4"/>
                            <line x1="20" y1="8" x2="20" y2="14"/>
                            <line x1="23" y1="11" x2="17" y2="11"/>
                        </svg>
                        <span>NPM: ${member.npm}</span>
                    </div>
                </div>
                <div class="member-footer">
                    <span class="status-badge ${member.status}">
                        <span class="status-dot"></span>
                        ${member.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                    <button class="contact-btn" data-member-id="${member.id}">
                        Hubungi
                    </button>
                </div>
            </div>
        `;
    };
    const renderMembers = () => {
        if (!membersGrid) return;
        if (filteredMembers.length === 0) {
            membersGrid.innerHTML = '';
            membersGrid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        membersGrid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';
        membersGrid.innerHTML = filteredMembers.map(member => createMemberCard(member)).join('');
        membersGrid.querySelectorAll('.contact-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const memberId = parseInt(btn.dataset.memberId);
                showMemberDetail(memberId);
            });
        });
    };
    const showMemberDetail = (memberId) => {
        const member = members.find(m => m.id === memberId);
        if (!member) return;
        const modal = document.getElementById('memberDetailModal');
        const modalBody = document.getElementById('modalBody');
        if (!modal || !modalBody) return;
        const avatarContent = member.photo 
            ? `<img src="${UPLOAD_BASE}/profile/${member.photo}" alt="${member.name}">`
            : member.initials;
        const statusText = member.activity_status === 'aktif' ? 'Aktif' : 
                          member.activity_status === 'sp1' ? 'SP 1' :
                          member.activity_status === 'sp2' ? 'SP 2' : 'Tidak Aktif';
        const joinDate = member.created_at ? new Date(member.created_at).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        }) : '-';
        modalBody.innerHTML = `
            <div class="modal-profile-section">
                <div class="modal-avatar">
                    ${avatarContent}
                </div>
                <div class="modal-name">${member.name}</div>
                <div class="modal-role">${member.role}</div>
            </div>
            <div class="modal-info-grid">
                <div class="modal-info-item">
                    <div class="modal-info-icon npm">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                    </div>
                    <div class="modal-info-content">
                        <div class="modal-info-label">NPM</div>
                        <div class="modal-info-value">${member.npm}</div>
                    </div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-icon department">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                        </svg>
                    </div>
                    <div class="modal-info-content">
                        <div class="modal-info-label">Jurusan</div>
                        <div class="modal-info-value">${member.department}</div>
                    </div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-icon email">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                    </div>
                    <div class="modal-info-content">
                        <div class="modal-info-label">Email</div>
                        <div class="modal-info-value"><a href="mailto:${member.email}">${member.email}</a></div>
                    </div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-icon phone">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                    </div>
                    <div class="modal-info-content">
                        <div class="modal-info-label">Nomor HP</div>
                        <div class="modal-info-value">${member.phone !== '-' ? `<a href="tel:${member.phone}">${member.phone}</a>` : '-'}</div>
                    </div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-icon address">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                    </div>
                    <div class="modal-info-content">
                        <div class="modal-info-label">Alamat</div>
                        <div class="modal-info-value">${member.address}</div>
                    </div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-icon status">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                    </div>
                    <div class="modal-info-content">
                        <div class="modal-info-label">Status Keanggotaan</div>
                        <div class="modal-info-value">${statusText} (Bergabung: ${joinDate})</div>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <a href="mailto:${member.email}" class="modal-btn modal-btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Kirim Email
                </a>
                ${member.phone !== '-' ? `
                <a href="https://wa.me/${member.phone.replace(/[^0-9]/g, '')}" target="_blank" class="modal-btn modal-btn-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                </a>
                ` : ''}
            </div>
        `;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    window.closeMemberModal = () => {
        const modal = document.getElementById('memberDetailModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };
    const handleSearch = (e) => {
        searchQuery = e.target.value;
        if (clearSearchBtn) {
            clearSearchBtn.style.display = searchQuery.length > 0 ? 'flex' : 'none';
        }
        filterMembers();
    };
    const clearSearch = () => {
        if (searchInput) {
            searchInput.value = '';
            searchQuery = '';
            if (clearSearchBtn) clearSearchBtn.style.display = 'none';
            searchInput.focus();
            filterMembers();
        }
    };
    const toggleFilterPanel = () => {
        if (filterPanel) {
            const isVisible = filterPanel.style.display !== 'none';
            filterPanel.style.display = isVisible ? 'none' : 'block';
            if (filterBtn) filterBtn.classList.toggle('active', !isVisible);
        }
    };
    const handleFilterClick = (button, filterType) => {
        const value = button.dataset[filterType];
        const siblings = button.parentElement.querySelectorAll('.filter-option');
        siblings.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        if (filterType === 'filter') {
            currentStatusFilter = value;
        } else if (filterType === 'role') {
            currentRoleFilter = value;
        }
        filterMembers();
    };
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Escape') clearSearch();
        });
    }
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }
    if (filterBtn) {
        filterBtn.addEventListener('click', toggleFilterPanel);
    }
    document.querySelectorAll('[data-filter]').forEach(button => {
        button.addEventListener('click', () => handleFilterClick(button, 'filter'));
    });
    document.querySelectorAll('[data-role]').forEach(button => {
        button.addEventListener('click', () => handleFilterClick(button, 'role'));
    });
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
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMemberModal();
        }
    });
    const memberModal = document.getElementById('memberDetailModal');
    if (memberModal) {
        memberModal.addEventListener('click', (e) => {
            if (e.target === memberModal) {
                closeMemberModal();
            }
        });
    }
    await loadAndUpdateUser();
    initMobileNav();
    await loadMembersFromAPI();
});
