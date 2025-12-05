/**
 * SIMORA Dashboard - Member Dashboard JavaScript
 * Features: Auth Check, Stats, Events, Hero Slider, Mobile Nav
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ========================================
    // CONFIGURATION - Use Relative Path!
    // ========================================
    // Dari frontend/anggota/dashboard.html ke backend/api/ = naik 2 level lalu masuk backend/api
    // dashboard.html -> ../ = anggota -> ../ = frontend -> masuk backend/api
    const API_BASE = '../../backend/api';
    
    // DEBUG: Log the full URL being used
    console.log('📍 API_BASE:', API_BASE);
    console.log('📍 Full auth URL would be:', new URL(`${API_BASE}/auth.php?action=me`, window.location.href).href);

    // ========================================
    // HERO SLIDER - Auto-scrolling Carousel
    // ========================================
    const initSlider = () => {
        const wrapper = document.getElementById('sliderWrapper');
        const slides = wrapper?.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.dot');
        const prevBtn = document.getElementById('sliderPrev');
        const nextBtn = document.getElementById('sliderNext');
        
        if (!slides || slides.length === 0) return;
        
        let currentIndex = 0;
        let autoSlideInterval;
        const SLIDE_DURATION = 5000; // 5 detik per slide
        
        const showSlide = (index) => {
            // Wrap around
            if (index >= slides.length) index = 0;
            if (index < 0) index = slides.length - 1;
            
            currentIndex = index;
            
            // Update slides
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
            
            // Update dots
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        };
        
        const nextSlide = () => showSlide(currentIndex + 1);
        const prevSlide = () => showSlide(currentIndex - 1);
        
        const startAutoSlide = () => {
            stopAutoSlide();
            autoSlideInterval = setInterval(nextSlide, SLIDE_DURATION);
        };
        
        const stopAutoSlide = () => {
            if (autoSlideInterval) {
                clearInterval(autoSlideInterval);
            }
        };
        
        // Event Listeners
        prevBtn?.addEventListener('click', () => {
            prevSlide();
            startAutoSlide(); // Reset timer
        });
        
        nextBtn?.addEventListener('click', () => {
            nextSlide();
            startAutoSlide(); // Reset timer
        });
        
        // Dot navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showSlide(index);
                startAutoSlide(); // Reset timer
            });
        });
        
        // Pause on hover
        wrapper?.addEventListener('mouseenter', stopAutoSlide);
        wrapper?.addEventListener('mouseleave', startAutoSlide);
        
        // Touch support for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        wrapper?.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoSlide();
        }, { passive: true });
        
        wrapper?.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > 50) { // Minimum swipe distance
                if (diff > 0) nextSlide();
                else prevSlide();
            }
            startAutoSlide();
        }, { passive: true });
        
        // Start auto-slide
        startAutoSlide();
        
        console.log('✅ Slider initialized');
    };

    // ========================================
    // MOBILE NAVIGATION
    // ========================================
    const initMobileNav = () => {
        const toggle = document.getElementById('navToggle');
        const menu = document.getElementById('navMenu');
        
        toggle?.addEventListener('click', () => {
            menu?.classList.toggle('active');
            toggle.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        menu?.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
                toggle?.classList.remove('active');
            });
        });
    };

    // ========================================
    // 1. AUTHENTICATION CHECK
    // ========================================
    try {
        console.log('🔍 Checking authentication...');
        console.log('🔍 Fetching:', `${API_BASE}/auth.php?action=me`);
        
        const response = await fetch(`${API_BASE}/auth.php?action=me`, {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', [...response.headers.entries()]);
        
        const text = await response.text();
        console.log('📡 Raw response:', text);
        
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('❌ Failed to parse JSON:', e);
            console.error('❌ Response was:', text);
            throw new Error('Invalid JSON response from server');
        }
        
        console.log('📡 Parsed result:', result);

        if (!response.ok || result.status !== 'success') {
            console.error('❌ Auth failed:', result.message || 'Unknown error');
            console.error('❌ Full result:', result);
            // SEMENTARA DISABLE REDIRECT UNTUK DEBUG
            // window.location.href = '../auth/login_register.html';
            alert('Auth failed: ' + (result.message || 'Unknown error') + '\n\nCheck console for details.');
            return;
        }

        console.log('✅ Auth successful!');
        const user = result.data;

        // Update UI User info
        const navUsername = document.getElementById('navUsername');
        const userInitials = document.getElementById('userInitials');
        
        if (navUsername) {
            navUsername.textContent = user.full_name || user.username;
        }
        
        // Initials for avatar
        if (userInitials) {
            const name = user.full_name || user.username;
            const initials = name.split(' ')
                .map(word => word.charAt(0))
                .join('')
                .substring(0, 2)
                .toUpperCase();
            userInitials.textContent = initials;
        }

    } catch (error) {
        console.error('❌ Auth Error:', error);
        console.error('❌ Error details:', error.message, error.stack);
        // SEMENTARA DISABLE REDIRECT UNTUK DEBUG
        // window.location.href = '../auth/login_register.html';
        alert('Auth Error: ' + error.message + '\n\nCheck console for details.');
        return;
    }

    // ========================================
    // 2. FETCH STATISTICS
    // ========================================
    const loadStats = async () => {
        try {
            const response = await fetch(`${API_BASE}/attendance.php?action=my-attendance`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();

            if (response.ok && result.status === 'success') {
                const stats = result.data.statistics;
                
                // Update stats with animation
                animateValue('statTotalAnggota', 0, stats.total || 1247, 1000);
                animateValue('statKegiatanAktif', 0, stats.hadir || 23, 1000);
                animateValue('statBulanIni', 0, stats.alpha || 89, 1000);
            }
        } catch (error) {
            console.error('Gagal mengambil statistik:', error);
        }
    };

    // Animate number counting
    const animateValue = (elementId, start, end, duration) => {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const range = end - start;
        const startTime = performance.now();
        
        const updateValue = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + range * easeOutQuart);
            
            element.textContent = current.toLocaleString('id-ID');
            
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        };
        
        requestAnimationFrame(updateValue);
    };

    // ========================================
    // 3. FETCH UPCOMING EVENTS
    // ========================================
    const loadUpcomingEvents = async () => {
        try {
            const response = await fetch(`${API_BASE}/events.php?action=upcoming&limit=3`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();
            const container = document.getElementById('upcomingEventsContainer');

            if (response.ok && result.status === 'success' && result.data.length > 0) {
                container.innerHTML = '';
                
                const colors = ['blue', 'purple', 'green'];

                result.data.forEach((event, index) => {
                    const dateObj = new Date(event.event_date);
                    const day = dateObj.getDate();
                    const month = dateObj.toLocaleString('id-ID', { month: 'short' });
                    const colorClass = colors[index % colors.length];
                    
                    const cardHtml = `
                        <div class="event-card">
                            <div class="event-date-badge ${colorClass}">
                                <span class="date-number">${day}</span>
                                <span class="date-month">${month}</span>
                            </div>
                            <div class="event-details">
                                <h4 class="event-title">${event.title}</h4>
                                <p class="event-desc">${event.description || 'Tidak ada deskripsi.'}</p>
                                <div class="event-meta">
                                    <span>🕒 ${event.start_time?.substring(0, 5) || '00:00'}</span>
                                    <span>📍 ${event.location || 'Online'}</span>
                                </div>
                            </div>
                        </div>
                    `;
                    container.insertAdjacentHTML('beforeend', cardHtml);
                });
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    // ========================================
    // 4. LOGOUT HANDLER
    // ========================================
    const initLogout = () => {
        const btnLogout = document.getElementById('btnLogout');
        
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
    // INITIALIZE ALL COMPONENTS
    // ========================================
    initSlider();
    initMobileNav();
    initLogout();
    
    // Load data (can run in parallel)
    loadStats();
    loadUpcomingEvents();
    
    console.log('✅ Dashboard initialized successfully');
});