/**
 * SIMORA - Admin Logout Helper
 * Centralized logout functionality with professional modal confirmation for Admin
 */

(function() {
    'use strict';
    
    // Auto-detect API base path
    const currentPath = window.location.pathname;
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
    const LOGIN_PAGE = `${basePath}/frontend/auth/login.html`;
    
    /**
     * Create and inject logout confirmation modal
     */
    function createLogoutModal() {
        // Check if modal already exists
        if (document.getElementById('logoutModal')) return;
        
        const modalHTML = `
            <div id="logoutModal" class="logout-modal-overlay">
                <div class="logout-modal">
                    <div class="logout-modal-icon admin-gradient">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                    </div>
                    <h3 class="logout-modal-title">Konfirmasi Keluar</h3>
                    <p class="logout-modal-text">Apakah Anda yakin ingin keluar dari dashboard admin?</p>
                    <div class="logout-modal-actions">
                        <button id="cancelLogout" class="logout-btn logout-btn-cancel">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            Batal
                        </button>
                        <button id="confirmLogout" class="logout-btn logout-btn-confirm admin-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Ya, Keluar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Inject modal styles
        const styles = `
            <style>
                .logout-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }
                
                .logout-modal-overlay.active {
                    opacity: 1;
                    visibility: visible;
                }
                
                .logout-modal {
                    background: white;
                    border-radius: 16px;
                    padding: 32px;
                    max-width: 420px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    transform: scale(0.9) translateY(-20px);
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                .logout-modal-overlay.active .logout-modal {
                    transform: scale(1) translateY(0);
                }
                
                .logout-modal-icon {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    animation: pulse 2s ease-in-out infinite;
                }
                
                .logout-modal-icon.admin-gradient {
                    background: linear-gradient(135deg, #01A29D 0%, #00877C 100%);
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .logout-modal-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1f2937;
                    margin: 0 0 12px;
                }
                
                .logout-modal-text {
                    font-size: 15px;
                    color: #6b7280;
                    margin: 0 0 28px;
                    line-height: 1.6;
                }
                
                .logout-modal-actions {
                    display: flex;
                    gap: 12px;
                }
                
                .logout-btn {
                    flex: 1;
                    padding: 14px 24px;
                    border: none;
                    border-radius: 10px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                    font-family: inherit;
                }
                
                .logout-btn-cancel {
                    background: #f3f4f6;
                    color: #374151;
                }
                
                .logout-btn-cancel:hover {
                    background: #e5e7eb;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                
                .logout-btn-confirm.admin-btn {
                    background: linear-gradient(135deg, #01A29D 0%, #00877C 100%);
                    color: white;
                    position: relative;
                    overflow: hidden;
                }
                
                .logout-btn-confirm.admin-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    transition: left 0.5s ease;
                }
                
                .logout-btn-confirm.admin-btn:hover::before {
                    left: 100%;
                }
                
                .logout-btn-confirm.admin-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(1, 162, 157, 0.4);
                }
                
                .logout-btn:active {
                    transform: translateY(0);
                }
                
                .logout-btn.loading {
                    pointer-events: none;
                    opacity: 0.7;
                }
                
                .logout-btn.loading svg {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @media (max-width: 480px) {
                    .logout-modal {
                        padding: 24px;
                    }
                    
                    .logout-modal-title {
                        font-size: 20px;
                    }
                    
                    .logout-modal-text {
                        font-size: 14px;
                    }
                    
                    .logout-modal-actions {
                        flex-direction: column-reverse;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    /**
     * Show logout modal
     */
    function showLogoutModal() {
        const modal = document.getElementById('logoutModal');
        if (!modal) {
            createLogoutModal();
            setTimeout(showLogoutModal, 10);
            return;
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Hide logout modal
     */
    function hideLogoutModal() {
        const modal = document.getElementById('logoutModal');
        if (!modal) return;
        
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    /**
     * Handle logout action
     */
    async function handleLogout() {
        const confirmBtn = document.getElementById('confirmLogout');
        const originalHTML = confirmBtn.innerHTML;
        
        try {
            confirmBtn.classList.add('loading');
            confirmBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10"/>
                </svg>
                Memproses...
            `;
            
            const response = await fetch(`${API_BASE}/auth.php?action=logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            console.log('✅ Logout response:', data);
            
            localStorage.removeItem('user');
            sessionStorage.clear();
            
            confirmBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Berhasil!
            `;
            
            setTimeout(() => {
                window.location.href = LOGIN_PAGE;
            }, 500);
            
        } catch (error) {
            console.error('❌ Logout error:', error);
            confirmBtn.classList.remove('loading');
            confirmBtn.innerHTML = originalHTML;
            
            setTimeout(() => {
                window.location.href = LOGIN_PAGE;
            }, 500);
        }
    }
    
    // Track if already initialized to prevent double initialization
    let isInitialized = false;
    
    /**
     * Initialize logout button
     */
    function initLogoutButton() {
        if (isInitialized) {
            console.warn('⚠️ Logout already initialized, skipping...');
            return;
        }
        
        // Admin has multiple logout buttons with different IDs
        const logoutButtons = [
            document.getElementById('btnLogout'),
            document.getElementById('btn-logout-desktop'),
            document.getElementById('btn-logout-mobile'),
            document.getElementById('btn-logout-dropdown')
        ].filter(btn => btn !== null);
        
        if (logoutButtons.length === 0) {
            console.warn('⚠️ No logout button found');
            return;
        }
        
        createLogoutModal();
        
        // Attach click handler to all logout buttons
        logoutButtons.forEach(btn => {
            // Remove any existing listeners first
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showLogoutModal();
            });
        });
        
        // Handle modal buttons with event delegation (one-time setup)
        document.addEventListener('click', handleModalClick);
        
        // Close on ESC key
        document.addEventListener('keydown', handleEscKey);
        
        isInitialized = true;
        console.log(`✅ Admin logout initialized (${logoutButtons.length} buttons found)`);
    }
    
    /**
     * Handle modal clicks
     */
    function handleModalClick(e) {
        if (e.target.id === 'cancelLogout' || e.target.closest('#cancelLogout')) {
            e.preventDefault();
            e.stopPropagation();
            hideLogoutModal();
        }
        
        if (e.target.id === 'confirmLogout' || e.target.closest('#confirmLogout')) {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
        }
        
        if (e.target.id === 'logoutModal') {
            hideLogoutModal();
        }
    }
    
    /**
     * Handle ESC key
     */
    function handleEscKey(e) {
        if (e.key === 'Escape') {
            hideLogoutModal();
        }
    }
    
    // Auto-initialize (only once)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLogoutButton);
    } else {
        initLogoutButton();
    }
    
    window.SIMORALogout = {
        handleLogout,
        initLogoutButton,
        showLogoutModal,
        hideLogoutModal
    };
    
})();
