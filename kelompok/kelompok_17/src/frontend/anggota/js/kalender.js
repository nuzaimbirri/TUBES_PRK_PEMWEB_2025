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
    const UPLOAD_BASE = basePath.replace('/src', '/upload');
    const LOGIN_PAGE = `${basePath}/frontend/auth/login.html`;
    const EVENTS_PAGE = `${basePath}/frontend/anggota/events.html`;

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
            
            if (userAvatar && user.profile_photo) {
                userAvatar.innerHTML = `<img src="${UPLOAD_BASE}/profile/${user.profile_photo}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            } else if (userInitials) {
                const name = user.full_name || user.username;
                const initials = name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
                userInitials.textContent = initials;
            }
        } catch (error) {
            console.error('Error loading user:', error);
            window.location.href = LOGIN_PAGE;
        }
    }

    let events = [];

    async function loadEventsFromAPI(year, month) {
        try {
            const response = await fetch(`${API_BASE}/events.php?action=list&limit=100`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();
            
            if (response.ok && result.status === 'success' && result.data && result.data.data) {
                const colors = ['blue', 'purple', 'green', 'orange'];
                events = result.data.data.map((event, index) => ({
                    id: event.event_id,
                    date: event.event_date,
                    title: event.title,
                    description: event.description || 'Tidak ada deskripsi',
                    time: `${event.start_time?.substring(0, 5) || '00:00'} - ${event.end_time?.substring(0, 5) || 'selesai'}`,
                    location: event.location || 'TBD',
                    color: colors[index % colors.length]
                }));
            } else {
                events = [];
            }
        } catch (error) {
            console.error('Error loading events:', error);
            events = [];
        }
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }

    let currentDate = new Date();
    
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const calendarGrid = document.querySelector('.calendar-grid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const eventsList = document.getElementById('eventsList');

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const formatDate = (year, month, day) => {
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    };

    const getEventsForDate = (dateString) => {
        return events.filter(event => event.date === dateString);
    };

    const getEventsForMonth = (year, month) => {
        const monthStr = String(month + 1).padStart(2, '0');
        const prefix = `${year}-${monthStr}`;
        return events.filter(event => event.date.startsWith(prefix));
    };

    const isToday = (year, month, day) => {
        const today = new Date();
        return today.getFullYear() === year && 
               today.getMonth() === month && 
               today.getDate() === day;
    };

    const renderCalendar = (year, month) => {
        currentMonthYear.textContent = `${monthNames[month]} ${year}`;

        const existingDays = calendarGrid.querySelectorAll('.calendar-day');
        existingDays.forEach(day => day.remove());

        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const daysInPrevMonth = getDaysInMonth(year, month - 1);

        calendarGrid.classList.add('fade-out');
        
        setTimeout(() => {
            const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

            for (let i = 0; i < totalCells; i++) {
                const dayCell = document.createElement('div');
                dayCell.classList.add('calendar-day');

                let dayNumber;
                let cellYear = year;
                let cellMonth = month;
                let isOtherMonth = false;

                if (i < firstDay) {
                    dayNumber = daysInPrevMonth - firstDay + i + 1;
                    cellMonth = month - 1;
                    if (cellMonth < 0) {
                        cellMonth = 11;
                        cellYear--;
                    }
                    isOtherMonth = true;
                } else if (i >= firstDay + daysInMonth) {
                    dayNumber = i - firstDay - daysInMonth + 1;
                    cellMonth = month + 1;
                    if (cellMonth > 11) {
                        cellMonth = 0;
                        cellYear++;
                    }
                    isOtherMonth = true;
                } else {
                    dayNumber = i - firstDay + 1;
                }

                if (!isOtherMonth && isToday(year, month, dayNumber)) {
                    dayCell.classList.add('today');
                }

                if (isOtherMonth) {
                    dayCell.classList.add('other-month');
                }

                const dayNumberEl = document.createElement('span');
                dayNumberEl.classList.add('day-number');
                dayNumberEl.textContent = dayNumber;
                dayCell.appendChild(dayNumberEl);

                const dateString = formatDate(cellYear, cellMonth, dayNumber);
                const dayEvents = getEventsForDate(dateString);

                if (dayEvents.length > 0 && !isOtherMonth) {
                    dayCell.classList.add('has-event');

                    const eventsContainer = document.createElement('div');
                    eventsContainer.classList.add('day-events');

                    const maxVisible = 2;
                    dayEvents.slice(0, maxVisible).forEach(event => {
                        const eventTag = document.createElement('div');
                        eventTag.classList.add('event-tag', event.color || 'blue');
                        eventTag.textContent = event.title;
                        eventTag.title = `${event.title}\n${event.time}\n${event.location}`;
                        eventTag.style.cursor = 'pointer';
                        eventTag.addEventListener('click', (e) => {
                            e.stopPropagation();
                            navigateToEventDetail(event.id);
                        });
                        eventsContainer.appendChild(eventTag);
                    });

                    if (dayEvents.length > maxVisible) {
                        const moreEl = document.createElement('div');
                        moreEl.classList.add('more-events');
                        moreEl.textContent = `+${dayEvents.length - maxVisible} lagi`;
                        eventsContainer.appendChild(moreEl);
                    }

                    dayCell.appendChild(eventsContainer);
                }

                dayCell.dataset.date = dateString;
                dayCell.dataset.year = cellYear;
                dayCell.dataset.month = cellMonth;
                dayCell.dataset.day = dayNumber;

                if (!isOtherMonth) {
                    dayCell.addEventListener('click', () => handleDayClick(dayCell));
                }

                calendarGrid.appendChild(dayCell);
            }

            calendarGrid.classList.remove('fade-out');
            calendarGrid.classList.add('fade-in');
            
            setTimeout(() => {
                calendarGrid.classList.remove('fade-in');
            }, 200);
        }, 150);

        renderEventsList(year, month);
    };

    const renderEventsList = (year, month) => {
        const monthEvents = getEventsForMonth(year, month);
        
        if (monthEvents.length === 0) {
            eventsList.innerHTML = `
                <div class="no-events">
                    <div class="no-events-icon">📅</div>
                    <p>Tidak ada kegiatan bulan ini</p>
                </div>
            `;
            return;
        }

        // Sort by date
        monthEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        eventsList.innerHTML = monthEvents.map(event => {
            const date = new Date(event.date);
            const day = date.getDate();
            const monthShort = monthNames[date.getMonth()].substring(0, 3);
            
            return `
                <div class="event-item ${event.color || 'blue'}" data-event-id="${event.id}">
                    <div class="event-date">
                        <span class="day">${day}</span>
                        <span class="month">${monthShort}</span>
                    </div>
                    <div class="event-info">
                        <div class="title">${event.title}</div>
                        <div class="time">🕒 ${event.time}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers
        eventsList.querySelectorAll('.event-item').forEach(item => {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                const eventId = parseInt(item.dataset.eventId);
                if (eventId) navigateToEventDetail(eventId);
            });
        });
    };

    const handleDayClick = (dayCell) => {
        const dateString = dayCell.dataset.date;
        const dayEvents = getEventsForDate(dateString);
        
        if (dayEvents.length > 0) {
            navigateToEventDetail(dayEvents[0].id);
        }
    };

    const navigateToEventDetail = (eventId) => {
        window.location.href = `${EVENTS_PAGE}?event=${eventId}`;
    };

    const showEventDetails = (event) => {
        navigateToEventDetail(event.id);
    };

    const goToPrevMonth = () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    };

    const goToNextMonth = () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    };
    
    prevMonthBtn.addEventListener('click', goToPrevMonth);
    nextMonthBtn.addEventListener('click', goToNextMonth);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            goToPrevMonth();
        } else if (e.key === 'ArrowRight') {
            goToNextMonth();
        }
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

    loadAndUpdateUser();
    initMobileNav();
    loadEventsFromAPI(currentDate.getFullYear(), currentDate.getMonth());
});
