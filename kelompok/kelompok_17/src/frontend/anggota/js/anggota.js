/**
 * SIMORA - Member Directory JavaScript
 * Features: Real-time search, filtering, member display
 */

document.addEventListener('DOMContentLoaded', () => {
    // ========================================
    // MOCK DATA - Member Database
    // ========================================
    const members = [
        {
            id: 1,
            name: 'Budi Santoso',
            initials: 'BS',
            email: 'budi.santoso@mail.com',
            role: 'Ketua Umum',
            department: 'Teknik Elektro',
            status: 'active',
            npm: '2106001',
            phone: '+62 812-3456-7890'
        },
        {
            id: 2,
            name: 'Siti Nurhaliza',
            initials: 'SN',
            email: 'siti.nurhaliza@mail.com',
            role: 'Sekretaris',
            department: 'Teknik Komputer',
            status: 'active',
            npm: '2106002',
            phone: '+62 813-4567-8901'
        },
        {
            id: 3,
            name: 'Ahmad Fauzi',
            initials: 'AF',
            email: 'ahmad.fauzi@mail.com',
            role: 'Bendahara',
            department: 'Teknik Elektro',
            status: 'active',
            npm: '2106003',
            phone: '+62 814-5678-9012'
        },
        {
            id: 4,
            name: 'Dewi Lestari',
            initials: 'DL',
            email: 'dewi.lestari@mail.com',
            role: 'Koordinator Acara',
            department: 'Teknik Informatika',
            status: 'active',
            npm: '2106004',
            phone: '+62 815-6789-0123'
        },
        {
            id: 5,
            name: 'Rizky Pratama',
            initials: 'RP',
            email: 'rizky.pratama@mail.com',
            role: 'Anggota',
            department: 'Teknik Elektro',
            status: 'active',
            npm: '2106005',
            phone: '+62 816-7890-1234'
        },
        {
            id: 6,
            name: 'Maya Putri',
            initials: 'MP',
            email: 'maya.putri@mail.com',
            role: 'Anggota',
            department: 'Teknik Komputer',
            status: 'inactive',
            npm: '2106006',
            phone: '+62 817-8901-2345'
        },
        {
            id: 7,
            name: 'Andi Wijaya',
            initials: 'AW',
            email: 'andi.wijaya@mail.com',
            role: 'Pengurus Humas',
            department: 'Teknik Informatika',
            status: 'active',
            npm: '2106007',
            phone: '+62 818-9012-3456'
        },
        {
            id: 8,
            name: 'Ratna Sari',
            initials: 'RS',
            email: 'ratna.sari@mail.com',
            role: 'Anggota',
            department: 'Teknik Elektro',
            status: 'active',
            npm: '2106008',
            phone: '+62 819-0123-4567'
        },
        {
            id: 9,
            name: 'Farhan Hakim',
            initials: 'FH',
            email: 'farhan.hakim@mail.com',
            role: 'Pengurus Media',
            department: 'Teknik Komputer',
            status: 'active',
            npm: '2106009',
            phone: '+62 821-1234-5678'
        },
        {
            id: 10,
            name: 'Linda Susanti',
            initials: 'LS',
            email: 'linda.susanti@mail.com',
            role: 'Anggota',
            department: 'Teknik Informatika',
            status: 'inactive',
            npm: '2106010',
            phone: '+62 822-2345-6789'
        },
        {
            id: 11,
            name: 'Hendra Gunawan',
            initials: 'HG',
            email: 'hendra.gunawan@mail.com',
            role: 'Anggota',
            department: 'Teknik Elektro',
            status: 'active',
            npm: '2106011',
            phone: '+62 823-3456-7890'
        },
        {
            id: 12,
            name: 'Indah Permata',
            initials: 'IP',
            email: 'indah.permata@mail.com',
            role: 'Koordinator Keuangan',
            department: 'Teknik Komputer',
            status: 'active',
            npm: '2106012',
            phone: '+62 824-4567-8901'
        }
    ];

    // ========================================
    // STATE
    // ========================================
    let filteredMembers = [...members];
    let currentStatusFilter = 'all';
    let currentRoleFilter = 'all';
    let searchQuery = '';

    // ========================================
    // DOM ELEMENTS
    // ========================================
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const filterBtn = document.getElementById('filterBtn');
    const filterPanel = document.getElementById('filterPanel');
    const membersGrid = document.getElementById('membersGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsCount = document.getElementById('resultsCount');

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    /**
     * Normalize text for search (lowercase, remove accents)
     */
    const normalizeText = (text) => {
        return text.toLowerCase().trim();
    };

    /**
     * Check if member matches search query
     */
    const matchesSearch = (member, query) => {
        if (!query) return true;
        
        const normalizedQuery = normalizeText(query);
        const searchableFields = [
            member.name,
            member.email,
            member.role,
            member.department,
            member.npm
        ];
        
        return searchableFields.some(field => 
            normalizeText(field).includes(normalizedQuery)
        );
    };

    /**
     * Filter members based on criteria
     */
    const filterMembers = () => {
        filteredMembers = members.filter(member => {
            // Search filter
            if (!matchesSearch(member, searchQuery)) return false;
            
            // Status filter
            if (currentStatusFilter !== 'all' && member.status !== currentStatusFilter) {
                return false;
            }
            
            // Role filter
            if (currentRoleFilter !== 'all') {
                const roleCategory = getRoleCategory(member.role);
                if (roleCategory !== currentRoleFilter) return false;
            }
            
            return true;
        });
        
        renderMembers();
        updateResultsCount();
    };

    /**
     * Get role category (anggota, pengurus, admin)
     */
    const getRoleCategory = (role) => {
        const roleNormalized = normalizeText(role);
        if (roleNormalized.includes('anggota')) return 'anggota';
        if (roleNormalized.includes('pengurus') || roleNormalized.includes('koordinator')) return 'pengurus';
        if (roleNormalized.includes('ketua') || roleNormalized.includes('sekretaris') || roleNormalized.includes('bendahara')) return 'pengurus';
        return 'anggota';
    };

    /**
     * Update results count display
     */
    const updateResultsCount = () => {
        const total = members.length;
        const shown = filteredMembers.length;
        resultsCount.textContent = `Menampilkan ${shown} dari ${total} anggota`;
    };

    // ========================================
    // RENDER FUNCTIONS
    // ========================================

    /**
     * Render member card HTML
     */
    const createMemberCard = (member) => {
        return `
            <div class="member-card" data-member-id="${member.id}">
                <div class="member-header">
                    <div class="member-avatar">
                        ${member.initials}
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
                    <button class="contact-btn" onclick="contactMember(${member.id})">
                        Hubungi
                    </button>
                </div>
            </div>
        `;
    };

    /**
     * Render all member cards
     */
    const renderMembers = () => {
        if (filteredMembers.length === 0) {
            membersGrid.innerHTML = '';
            membersGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        membersGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        membersGrid.innerHTML = filteredMembers
            .map(member => createMemberCard(member))
            .join('');
    };

    // ========================================
    // EVENT HANDLERS
    // ========================================

    /**
     * Handle search input
     */
    const handleSearch = (e) => {
        searchQuery = e.target.value;
        
        // Show/hide clear button
        if (searchQuery.length > 0) {
            clearSearchBtn.classList.add('show');
        } else {
            clearSearchBtn.classList.remove('show');
        }
        
        // Filter members (real-time)
        filterMembers();
    };

    /**
     * Clear search
     */
    const clearSearch = () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.remove('show');
        searchInput.focus();
        filterMembers();
    };

    /**
     * Toggle filter panel
     */
    const toggleFilterPanel = () => {
        const isVisible = filterPanel.style.display !== 'none';
        filterPanel.style.display = isVisible ? 'none' : 'block';
        filterBtn.classList.toggle('active', !isVisible);
    };

    /**
     * Handle filter option click
     */
    const handleFilterClick = (button, filterType) => {
        const value = button.dataset[filterType];
        
        // Update active state
        const siblings = button.parentElement.querySelectorAll('.filter-option');
        siblings.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update filter state
        if (filterType === 'filter') {
            currentStatusFilter = value;
        } else if (filterType === 'role') {
            currentRoleFilter = value;
        }
        
        // Apply filters
        filterMembers();
    };

    // ========================================
    // GLOBAL FUNCTIONS (for onclick)
    // ========================================
    
    window.contactMember = (memberId) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            alert(
                `Hubungi ${member.name}\n\n` +
                `📧 Email: ${member.email}\n` +
                `📱 Phone: ${member.phone}\n` +
                `🏢 Department: ${member.department}`
            );
            // In production, this could open email client or messaging system
        }
    };

    // ========================================
    // EVENT LISTENERS
    // ========================================
    
    // Search
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') {
            clearSearch();
        }
    });
    
    clearSearchBtn.addEventListener('click', clearSearch);
    
    // Filter toggle
    filterBtn.addEventListener('click', toggleFilterPanel);
    
    // Filter options
    document.querySelectorAll('[data-filter]').forEach(button => {
        button.addEventListener('click', () => handleFilterClick(button, 'filter'));
    });
    
    document.querySelectorAll('[data-role]').forEach(button => {
        button.addEventListener('click', () => handleFilterClick(button, 'role'));
    });

    // ========================================
    // MOBILE NAVIGATION (Reuse from dashboard)
    // ========================================
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

    // ========================================
    // LOGOUT HANDLER
    // ========================================
    const initLogout = () => {
        const btnLogout = document.getElementById('btnLogout');
        const API_BASE = '../../backend/api';
        
        btnLogout?.addEventListener('click', async () => {
            try {
                btnLogout.textContent = 'Loading...';
                btnLogout.disabled = true;
                
                await fetch(`${API_BASE}/auth.php?action=logout`, {
                    method: 'POST',
                    credentials: 'include'
                });
                
                window.location.href = '../auth/login_register.html';
            } catch (error) {
                console.error('Logout error:', error);
                window.location.href = '../auth/login_register.html';
            }
        });
    };

    // ========================================
    // INITIALIZE
    // ========================================
    
    // Simulate loading
    setTimeout(() => {
        initMobileNav();
        initLogout();
        renderMembers();
        updateResultsCount();
        
        console.log('✅ Member Directory initialized');
        console.log(`📊 Total members: ${members.length}`);
    }, 500);
});
