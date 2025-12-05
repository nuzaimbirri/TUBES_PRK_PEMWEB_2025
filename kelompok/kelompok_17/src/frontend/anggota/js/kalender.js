/**
 * SIMORA Kalender - Calendar JavaScript
 * Features: Dynamic calendar rendering, event display, month navigation
 */

document.addEventListener('DOMContentLoaded', () => {
    // ========================================
    // MOCK DATA - Event Data
    // ========================================
    const events = [
        {
            id: 1,
            date: '2025-09-15',
            title: 'EEA 2025',
            description: 'Electrical Engineering in Action 2025',
            time: '09:00 - 17:00',
            location: 'Aula Utama',
            color: 'blue'
        },
        {
            id: 2,
            date: '2025-09-22',
            title: 'Dioda 2025',
            description: 'Dies Natalis Organisasi',
            time: '14:00 - 18:00',
            location: 'Gedung Serbaguna',
            color: 'blue'
        },
        {
            id: 3,
            date: '2025-09-28',
            title: 'Hi-Class',
            description: 'Himatro Class - Pelatihan Web Development',
            time: '10:00 - 12:00',
            location: 'Lab Komputer',
            color: 'blue'
        },
        {
            id: 4,
            date: '2025-12-10',
            title: 'Workshop AI',
            description: 'Workshop Artificial Intelligence',
            time: '13:00 - 16:00',
            location: 'Online',
            color: 'purple'
        },
        {
            id: 5,
            date: '2025-12-15',
            title: 'Rapat Akhir Tahun',
            description: 'Rapat Evaluasi Akhir Tahun',
            time: '09:00 - 12:00',
            location: 'Ruang Rapat',
            color: 'green'
        },
        {
            id: 6,
            date: '2025-12-20',
            title: 'Year End Party',
            description: 'Perayaan Akhir Tahun Bersama',
            time: '18:00 - 21:00',
            location: 'Garden Cafe',
            color: 'orange'
        }
    ];

    // ========================================
    // STATE
    // ========================================
    let currentDate = new Date(2025, 8, 1); // September 2025 (month is 0-indexed)
    
    // Indonesian month names
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // ========================================
    // DOM ELEMENTS
    // ========================================
    const calendarGrid = document.querySelector('.calendar-grid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const eventsList = document.getElementById('eventsList');

    // ========================================
    // HELPER FUNCTIONS
    // ========================================
    
    /**
     * Get the number of days in a month
     */
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    /**
     * Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
     */
    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    /**
     * Format date to YYYY-MM-DD string
     */
    const formatDate = (year, month, day) => {
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    };

    /**
     * Get events for a specific date
     */
    const getEventsForDate = (dateString) => {
        return events.filter(event => event.date === dateString);
    };

    /**
     * Get events for a specific month
     */
    const getEventsForMonth = (year, month) => {
        const monthStr = String(month + 1).padStart(2, '0');
        const prefix = `${year}-${monthStr}`;
        return events.filter(event => event.date.startsWith(prefix));
    };

    /**
     * Check if a date is today
     */
    const isToday = (year, month, day) => {
        const today = new Date();
        return today.getFullYear() === year && 
               today.getMonth() === month && 
               today.getDate() === day;
    };

    // ========================================
    // RENDER FUNCTIONS
    // ========================================

    /**
     * Main function to render the calendar
     */
    const renderCalendar = (year, month) => {
        // Update header
        currentMonthYear.textContent = `${monthNames[month]} ${year}`;

        // Clear existing day cells (keep headers)
        const existingDays = calendarGrid.querySelectorAll('.calendar-day');
        existingDays.forEach(day => day.remove());

        // Get calendar data
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const daysInPrevMonth = getDaysInMonth(year, month - 1);

        // Add fade effect
        calendarGrid.classList.add('fade-out');
        
        setTimeout(() => {
            // Calculate total cells needed (6 rows x 7 columns = 42 max)
            const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

            // Generate day cells
            for (let i = 0; i < totalCells; i++) {
                const dayCell = document.createElement('div');
                dayCell.classList.add('calendar-day');

                let dayNumber;
                let cellYear = year;
                let cellMonth = month;
                let isOtherMonth = false;

                if (i < firstDay) {
                    // Previous month days
                    dayNumber = daysInPrevMonth - firstDay + i + 1;
                    cellMonth = month - 1;
                    if (cellMonth < 0) {
                        cellMonth = 11;
                        cellYear--;
                    }
                    isOtherMonth = true;
                } else if (i >= firstDay + daysInMonth) {
                    // Next month days
                    dayNumber = i - firstDay - daysInMonth + 1;
                    cellMonth = month + 1;
                    if (cellMonth > 11) {
                        cellMonth = 0;
                        cellYear++;
                    }
                    isOtherMonth = true;
                } else {
                    // Current month days
                    dayNumber = i - firstDay + 1;
                }

                // Check if it's today
                if (!isOtherMonth && isToday(year, month, dayNumber)) {
                    dayCell.classList.add('today');
                }

                // Add other-month class
                if (isOtherMonth) {
                    dayCell.classList.add('other-month');
                }

                // Day number
                const dayNumberEl = document.createElement('span');
                dayNumberEl.classList.add('day-number');
                dayNumberEl.textContent = dayNumber;
                dayCell.appendChild(dayNumberEl);

                // Get events for this date
                const dateString = formatDate(cellYear, cellMonth, dayNumber);
                const dayEvents = getEventsForDate(dateString);

                if (dayEvents.length > 0 && !isOtherMonth) {
                    dayCell.classList.add('has-event');

                    const eventsContainer = document.createElement('div');
                    eventsContainer.classList.add('day-events');

                    // Show max 2 events, then "more" indicator
                    const maxVisible = 2;
                    dayEvents.slice(0, maxVisible).forEach(event => {
                        const eventTag = document.createElement('div');
                        eventTag.classList.add('event-tag', event.color || 'blue');
                        eventTag.textContent = event.title;
                        eventTag.title = `${event.title}\n${event.time}\n${event.location}`;
                        eventTag.addEventListener('click', (e) => {
                            e.stopPropagation();
                            showEventDetails(event);
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

                // Store date data
                dayCell.dataset.date = dateString;
                dayCell.dataset.year = cellYear;
                dayCell.dataset.month = cellMonth;
                dayCell.dataset.day = dayNumber;

                // Click handler
                if (!isOtherMonth) {
                    dayCell.addEventListener('click', () => handleDayClick(dayCell));
                }

                calendarGrid.appendChild(dayCell);
            }

            // Remove fade effect
            calendarGrid.classList.remove('fade-out');
            calendarGrid.classList.add('fade-in');
            
            setTimeout(() => {
                calendarGrid.classList.remove('fade-in');
            }, 200);
        }, 150);

        // Update events sidebar
        renderEventsList(year, month);
    };

    /**
     * Render events list in sidebar
     */
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
            item.addEventListener('click', () => {
                const eventId = parseInt(item.dataset.eventId);
                const event = events.find(e => e.id === eventId);
                if (event) showEventDetails(event);
            });
        });
    };

    /**
     * Handle day cell click
     */
    const handleDayClick = (dayCell) => {
        const dateString = dayCell.dataset.date;
        const dayEvents = getEventsForDate(dateString);
        
        if (dayEvents.length > 0) {
            // If multiple events, show first one (could enhance to show list)
            showEventDetails(dayEvents[0]);
        } else {
            console.log('Clicked date:', dateString);
            // Could add functionality to create new event here
        }
    };

    /**
     * Show event details (simple alert for now, could be modal)
     */
    const showEventDetails = (event) => {
        const date = new Date(event.date);
        const formattedDate = `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        
        alert(
            `📅 ${event.title}\n\n` +
            `📆 Tanggal: ${formattedDate}\n` +
            `🕒 Waktu: ${event.time}\n` +
            `📍 Lokasi: ${event.location}\n\n` +
            `📝 ${event.description}`
        );
    };

    // ========================================
    // NAVIGATION
    // ========================================

    /**
     * Go to previous month
     */
    const goToPrevMonth = () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    };

    /**
     * Go to next month
     */
    const goToNextMonth = () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    };

    // ========================================
    // EVENT LISTENERS
    // ========================================
    
    prevMonthBtn.addEventListener('click', goToPrevMonth);
    nextMonthBtn.addEventListener('click', goToNextMonth);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            goToPrevMonth();
        } else if (e.key === 'ArrowRight') {
            goToNextMonth();
        }
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
    initMobileNav();
    initLogout();
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());

    console.log('✅ Calendar initialized successfully');
});
