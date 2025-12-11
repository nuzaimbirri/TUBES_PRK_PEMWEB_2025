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
    const EVENTS_PAGE = `${basePath}/frontend/anggota/events.html`;

    const initSlider = () => {
        const wrapper = document.getElementById('sliderWrapper');
        const slides = wrapper?.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.dot');
        const prevBtn = document.getElementById('sliderPrev');
        const nextBtn = document.getElementById('sliderNext');
        
        if (!slides || slides.length === 0) return;
        
        let currentIndex = 0;
        let autoSlideInterval;
        const SLIDE_DURATION = 5000;
        
        const showSlide = (index) => {
            if (index >= slides.length) index = 0;
            if (index < 0) index = slides.length - 1;
            currentIndex = index;
            slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
            dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
        };
        
        const nextSlide = () => showSlide(currentIndex + 1);
        const prevSlide = () => showSlide(currentIndex - 1);
        
        const startAutoSlide = () => {
            stopAutoSlide();
            autoSlideInterval = setInterval(nextSlide, SLIDE_DURATION);
        };
        
        const stopAutoSlide = () => {
            if (autoSlideInterval) clearInterval(autoSlideInterval);
        };
        
        prevBtn?.addEventListener('click', () => { prevSlide(); startAutoSlide(); });
        nextBtn?.addEventListener('click', () => { nextSlide(); startAutoSlide(); });
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => { showSlide(index); startAutoSlide(); });
        });
        
        wrapper?.addEventListener('mouseenter', stopAutoSlide);
        wrapper?.addEventListener('mouseleave', startAutoSlide);
        
        let touchStartX = 0;
        wrapper?.addEventListener('touchstart', (e) => { 
            touchStartX = e.changedTouches[0].screenX; 
            stopAutoSlide(); 
        }, { passive: true });
        
        wrapper?.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) { diff > 0 ? nextSlide() : prevSlide(); }
            startAutoSlide();
        }, { passive: true });
        
        startAutoSlide();
    };

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

    let currentUserData = null;

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

        currentUserData = result.data;
        const navUsername = document.getElementById('navUsername');
        const userInitials = document.getElementById('userInitials');
        const userAvatar = document.getElementById('userAvatar');
        
        if (navUsername) navUsername.textContent = currentUserData.full_name || currentUserData.username;
        
        if (userAvatar && currentUserData.profile_photo) {
            userAvatar.innerHTML = `<img src="${UPLOAD_BASE}/profile/${currentUserData.profile_photo}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else if (userInitials) {
            const name = currentUserData.full_name || currentUserData.username;
            const initials = name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
            userInitials.textContent = initials;
        }

    } catch (error) {
        window.location.href = LOGIN_PAGE;
        return;
    }

    const animateValue = (elementId, start, end, duration) => {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const range = end - start;
        const startTime = performance.now();
        
        const updateValue = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + range * easeOutQuart);
            element.textContent = current.toLocaleString('id-ID');
            if (progress < 1) requestAnimationFrame(updateValue);
        };
        
        requestAnimationFrame(updateValue);
    };

    const loadStats = async () => {
        try {
            const response = await fetch(`${API_BASE}/auth.php?action=all_members`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();

            if (response.ok && result.status === 'success') {
                animateValue('statTotalAnggota', 0, result.data.total || 0, 1000);
            }
            
            // Use public-stats endpoint (accessible by all logged-in users)
            const eventsRes = await fetch(`${API_BASE}/events.php?action=public-stats`, {
                method: 'GET',
                credentials: 'include'
            });
            const eventsResult = await eventsRes.json();
            
            if (eventsRes.ok && eventsResult.status === 'success') {
                animateValue('statKegiatanAktif', 0, eventsResult.data.published || 0, 1000);
            }

            const attendRes = await fetch(`${API_BASE}/attendance.php?action=my-attendance`, {
                method: 'GET',
                credentials: 'include'
            });
            const attendResult = await attendRes.json();
            
            if (attendRes.ok && attendResult.status === 'success') {
                animateValue('statBulanIni', 0, attendResult.data?.statistics?.total || 0, 1000);
            }
        } catch (error) {
            console.error('Stats error:', error);
        }
    };

    const loadUpcomingEvents = async () => {
        try {
            const response = await fetch(`${API_BASE}/events.php?action=upcoming&limit=3`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();
            const container = document.getElementById('upcomingEventsContainer');

            if (response.ok && result.status === 'success' && result.data && result.data.length > 0) {
                container.innerHTML = '';
                const colors = ['blue', 'purple', 'green'];

                result.data.forEach((event, index) => {
                    const dateObj = new Date(event.event_date);
                    const day = dateObj.getDate();
                    const month = dateObj.toLocaleString('id-ID', { month: 'short' });
                    const colorClass = colors[index % colors.length];
                    
                    const cardHtml = `
                        <div class="event-card clickable-event" data-event-id="${event.event_id}">
                            <div class="event-date-badge ${colorClass}">
                                <span class="date-number">${day}</span>
                                <span class="date-month">${month}</span>
                            </div>
                            <div class="event-details">
                                <h4 class="event-title">${event.title}</h4>
                                <p class="event-desc">${event.description || 'Tidak ada deskripsi.'}</p>
                                <div class="event-meta">
                                    <span> ${event.start_time?.substring(0, 5) || '00:00'}</span>
                                    <span> ${event.location || 'TBD'}</span>
                                </div>
                            </div>
                        </div>
                    `;
                    container.insertAdjacentHTML('beforeend', cardHtml);
                });

                container.querySelectorAll('.clickable-event').forEach(card => {
                    card.style.cursor = 'pointer';
                    card.addEventListener('click', () => {
                        const eventId = card.dataset.eventId;
                        window.location.href = `${EVENTS_PAGE}?event=${eventId}`;
                    });
                });
            } else {
                container.innerHTML = '<p class="text-gray-500 text-center">Tidak ada event mendatang.</p>';
            }
        } catch (error) {
            console.error('Events error:', error);
        }
    };

    const updateSliderWithEvents = async () => {
        try {
            console.log(' Loading slider events...');
            const response = await fetch(`${API_BASE}/events.php?action=latest&limit=5`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();
            console.log(' Slider API response:', result);

            const wrapper = document.getElementById('sliderWrapper');
            const dotsContainer = document.getElementById('sliderDots');
            
            if (!wrapper) return;

            if (response.ok && result.status === 'success' && result.data && result.data.length > 0) {
                wrapper.innerHTML = '';
                if (dotsContainer) dotsContainer.innerHTML = '';
                
                const badges = [
                    { text: ' Event Utama', class: '' },
                    { text: ' Seminar', class: 'purple' },
                    { text: ' Kegiatan', class: 'green' },
                    { text: ' Workshop', class: '' },
                    { text: ' Acara', class: 'purple' }
                ];

                result.data.forEach((event, index) => {
                    const dateObj = new Date(event.event_date);
                    const formattedDate = dateObj.toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                    });
                    
                    // Check if banner exists and is not default
                    const hasBanner = event.banner && 
                                      event.banner.trim() !== '' && 
                                      event.banner !== 'default.jpg' &&
                                      event.banner !== 'null';
                    const bannerUrl = hasBanner ? `${UPLOAD_BASE}/event/${event.banner}` : '';
                    console.log(` Event ${index + 1}: "${event.title}" - Banner: "${event.banner}" - HasBanner: ${hasBanner}`);
                    if (hasBanner) console.log(`   Banner URL: ${bannerUrl}`);
                    
                    const slideHtml = `
                        <div class="slide ${index === 0 ? 'active' : ''} ${hasBanner ? 'has-banner' : ''}" 
                             data-event-id="${event.event_id}" 
                             style="${hasBanner ? `background-image: url('${bannerUrl}');` : ''}">
                            <div class="slide-overlay"></div>
                            <div class="slide-content">
                                <span class="slide-badge ${badges[index % 5].class}">${badges[index % 5].text}</span>
                                <h2 class="slide-title">${event.title}</h2>
                                <p class="slide-desc">${event.description || 'Event organisasi'}</p>
                                <div class="slide-meta">
                                    <span> ${formattedDate}</span>
                                    <span> ${event.location || 'TBD'}</span>
                                </div>
                                <button class="slide-btn">Lihat Detail</button>
                            </div>
                        </div>
                    `;
                    wrapper.insertAdjacentHTML('beforeend', slideHtml);
                    
                    if (dotsContainer) {
                        const dotHtml = `<button class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></button>`;
                        dotsContainer.insertAdjacentHTML('beforeend', dotHtml);
                    }
                });

                wrapper.querySelectorAll('.slide').forEach(slide => {
                    slide.style.cursor = 'pointer';
                    slide.addEventListener('click', (e) => {
                        if (!e.target.closest('.slider-btn')) {
                            const eventId = slide.dataset.eventId;
                            console.log(' Slide clicked! Event ID:', eventId);
                            console.log(' Navigating to:', `${EVENTS_PAGE}?event=${eventId}`);
                            window.location.href = `${EVENTS_PAGE}?event=${eventId}`;
                        }
                    });
                });
                
                initSlider();
            } else {
                wrapper.innerHTML = `
                    <div class="slide active">
                        <div class="slide-overlay"></div>
                        <div class="slide-content">
                            <span class="slide-badge"> Info</span>
                            <h2 class="slide-title">Belum Ada Event</h2>
                            <p class="slide-desc">Tidak ada event yang tersedia saat ini. Silakan cek kembali nanti.</p>
                            <div class="slide-meta">
                                <span> -</span>
                                <span> -</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Slider events error:', error);
        }
    };

    initMobileNav();
    loadStats();
    loadUpcomingEvents();
    await updateSliderWithEvents();
});
