/**
 * SIMORA - Logout Helper
 * Centralized logout functionality with professional modal confirmation
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
                    <div class="logout-modal-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                    </div>
                    <h3 class="logout-modal-title">Konfirmasi Keluar</h3>
                    <p class="logout-modal-text">Apakah Anda yakin ingin keluar dari SIMORA?</p>
                    <div class="logout-modal-actions">
                        <button id="cancelLogout" class="logout-btn logout-btn-cancel">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            Batal
                        </button>
                        <button id="confirmLogout" class="logout-btn logout-btn-confirm">
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
                    background: linear-gradient(135deg, #0D9488 0%, #10B981 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    animation: pulse 2s ease-in-out infinite;
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
                
                .logout-btn-confirm {
                    background: linear-gradient(135deg, #0D9488 0%, #10B981 100%);
                    color: white;
                    position: relative;
                    overflow: hidden;
                }
                
                .logout-btn-confirm::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    transition: left 0.5s ease;
                }
                
                .logout-btn-confirm:hover::before {
                    left: 100%;
                }
                
                .logout-btn-confirm:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(13, 148, 136, 0.4);
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
        
        // Prevent body scroll
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
            // Update button to loading state
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
            
            // Clear any local storage/session storage
            localStorage.removeItem('user');
            sessionStorage.clear();
            
            // Success animation
            confirmBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Berhasil!
            `;
            
            // Redirect to login after short delay
            setTimeout(() => {
                window.location.href = LOGIN_PAGE;
            }, 500);
            
        } catch (error) {
            console.error('❌ Logout error:', error);
            
            // Reset button
            confirmBtn.classList.remove('loading');
            confirmBtn.innerHTML = originalHTML;
            
            // Still redirect even on error
            setTimeout(() => {
                window.location.href = LOGIN_PAGE;
            }, 500);
        }
    }
    
    /**
     * Initialize logout button
     */
    function initLogoutButton() {
        const btnLogout = document.getElementById('btnLogout');
        
        if (!btnLogout) {
            console.warn('⚠️ Logout button not found');
            return;
        }
        
        // Create modal on init
        createLogoutModal();
        
        // Show modal on logout button click
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            showLogoutModal();
        });
        
        // Handle modal buttons
        document.addEventListener('click', (e) => {
            if (e.target.id === 'cancelLogout' || e.target.closest('#cancelLogout')) {
                hideLogoutModal();
            }
            
            if (e.target.id === 'confirmLogout' || e.target.closest('#confirmLogout')) {
                handleLogout();
            }
            
            // Close on overlay click
            if (e.target.id === 'logoutModal') {
                hideLogoutModal();
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideLogoutModal();
            }
        });
        
        console.log('✅ Logout button initialized with modal');
    }
    
    /**
     * Check if user is authenticated
     */
    async function checkAuth() {
        try {
            const response = await fetch(`${API_BASE}/auth.php?action=check`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store'
            });
            
            const data = await response.json();
            
            if (data.status === 'success' && data.data && data.data.logged_in) {
                console.log('✅ User authenticated:', data.data.user);
                return true;
            } else {
                console.warn('⚠️ User not authenticated, redirecting to login...');
                window.location.href = LOGIN_PAGE;
                return false;
            }
            
        } catch (error) {
            console.error('❌ Auth check failed:', error);
            window.location.href = LOGIN_PAGE;
            return false;
        }
    }
    
    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initLogoutButton();
        });
    } else {
        initLogoutButton();
    }
    
    // Export to window for manual use
    window.SIMORALogout = {
        handleLogout,
        initLogoutButton,
        checkAuth,
        showLogoutModal,
        hideLogoutModal
    };
    
})();
