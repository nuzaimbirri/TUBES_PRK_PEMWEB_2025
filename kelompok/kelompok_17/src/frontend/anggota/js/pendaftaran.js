/**
 * pendaftaran.js
 * Feature: Daftar ke Event (JOIN event)
 *
 * - Fetch list events (paginated)
 * - Show skeletons while loading
 * - Show grid of event cards + table fallback
 * - Modal detail + register confirmation
 * - POST register to API_REGISTER_URL with FormData { event_id, note }
 * - Use credentials: 'include' so session cookie works
 *
 * NOTE: adjust API endpoints if backend uses different file/action
 */

/* ================================
   CONFIG
   ================================ */

// Base API path (relative like dashboard)
const API_BASE = '../../backend/api';

// Endpoints (change if server uses different names)
const API_LIST_EVENTS = `${API_BASE}/events.php?action=upcoming`; // read-only list of events
const API_REGISTER_URL = `${API_BASE}/events.php?action=register`; // register for event (POST)

console.log('📍 pendaftaran.js - API_LIST_EVENTS', API_LIST_EVENTS);
console.log('📍 pendaftaran.js - API_REGISTER_URL', API_REGISTER_URL);

/* ================================
   Helpers (utilities)
   ================================ */

/**
 * safeFetchJson - fetch wrapper with timeout + credentials include
 */
async function safeFetchJson(url, opts = {}, timeout = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal, credentials: 'include', cache: 'no-store' });
    clearTimeout(timer);
    const text = await res.text();
    try {
      return { ok: res.ok, status: res.status, data: JSON.parse(text), raw: text };
    } catch (e) {
      return { ok: res.ok, status: res.status, data: null, raw: text };
    }
  } catch (err) {
    clearTimeout(timer);
    console.error('safeFetchJson Error', err);
    return { ok: false, status: 0, data: null, error: err };
  }
}

/**
 * createElementFromHTML - helper to create DOM from html string
 */
function createElementFromHTML(htmlString) {
  const div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstChild;
}

/**
 * escapeHtml
 */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ================================
   DOM cache
   ================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Controls & UI
  const searchInput = document.getElementById('searchEventsInput');
  const searchBtn = document.getElementById('searchEventsBtn');
  const categorySelect = document.getElementById('categorySelect');
  const dateFilter = document.getElementById('dateFilter');
  const sortSelect = document.getElementById('sortEvents');
  const clearFiltersBtn = document.getElementById('clearFilters');

  const eventsSkeleton = document.getElementById('eventsSkeleton');
  const eventsGrid = document.getElementById('eventsGrid');
  const eventsTableWrapper = document.getElementById('eventsTableWrapper');
  const eventsTableBody = document.getElementById('eventsTableBody');
  const eventsEmpty = document.getElementById('eventsEmpty');

  const prevPageBtn = document.getElementById('prevEventsPage');
  const nextPageBtn = document.getElementById('nextEventsPage');
  const paginationControls = document.getElementById('eventsPagination');

  // Modal
  const registerModal = document.getElementById('registerModal');
  const registerModalBackdrop = document.getElementById('registerModalBackdrop');
  const registerModalBody = document.getElementById('registerModalBody');
  const registerModalTitle = document.getElementById('registerModalTitle');
  const closeRegisterModal = document.getElementById('closeRegisterModal');
  const registerCancelBtn = document.getElementById('registerCancelBtn');
  const registerConfirmBtn = document.getElementById('registerConfirmBtn');
  const modalSkeleton = document.getElementById('modalContentSkeleton');

  // Toast
  const toastContainer = document.getElementById('toastContainer');

  /* ================================
     STATE
  ================================ */
  let currentPage = 1;
  const PAGE_SIZE = 8;
  let totalPages = 1;
  let lastEvents = []; // last fetched items (array)
  let totalItems = 0;
  let eventCache = new Map(); // cache by query+filters+page (simple)

  /* ================================
     UI Helpers
  ================================ */

  function showToast(title, message, variant = 'info', timeout = 4200) {
    const t = document.createElement('div');
    t.className = `toast ${variant === 'success' ? 'success' : variant === 'error' ? 'error' : ''}`;
    t.innerHTML = `<div class="title">${escapeHtml(title)}</div><div class="msg" style="margin-top:6px">${escapeHtml(message)}</div>`;
    toastContainer.appendChild(t);
    setTimeout(() => t.remove(), timeout);
  }

  function showSkeletonCards(count = 4) {
    eventsSkeleton.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'skeleton skeleton-card';
      eventsSkeleton.appendChild(s);
    }
  }

  function clearSkeletons() { eventsSkeleton.innerHTML = ''; }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  }

  function buildCacheKey(q, cat, date, page, sort) {
    return `${q}::cat=${cat}::date=${date}::page=${page}::sort=${sort}`;
  }

  function renderPagination() {
    paginationControls.innerHTML = '';
    if (totalPages <= 1) return;
    for (let p = 1; p <= totalPages; p++) {
      const btn = document.createElement('button');
      btn.className = 'btn btn-ghost btn-sm';
      btn.textContent = p;
      if (p === currentPage) btn.classList.add('active');
      btn.addEventListener('click', () => {
        if (p === currentPage) return;
        currentPage = p;
        runListEvents();
      });
      paginationControls.appendChild(btn);
    }
  }

  /* ================================
     Renderers: grid & table
  ================================ */

  function renderEventsGrid(events = []) {
    eventsGrid.innerHTML = '';
    if (!events || events.length === 0) {
      eventsEmpty.classList.remove('hidden');
      eventsGrid.classList.add('hidden');
      eventsTableWrapper.classList.add('hidden');
      return;
    }

    eventsEmpty.classList.add('hidden');
    eventsGrid.classList.remove('hidden');

    events.forEach(ev => {
      const card = document.createElement('div');
      card.className = 'event-card';
      card.innerHTML = `
        <div style="display:flex;gap:18px;align-items:flex-start;">
          <div style="flex-shrink:0;width:110px;">
            <div class="event-date-badge ${ev.category === 'workshop' ? 'blue' : ev.category === 'seminar' ? 'purple' : 'green'}">
              <div class="date-number">${(new Date(ev.event_date)).getDate()}</div>
              <div class="date-month">${(new Date(ev.event_date)).toLocaleString('id-ID',{month:'short'})}</div>
            </div>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
              <div style="min-width:0;">
                <div style="font-weight:800;font-size:1.05rem;">${escapeHtml(ev.title || ev.name || '—')}</div>
                <div class="event-meta">${formatDate(ev.event_date)} • ${escapeHtml(ev.location || 'Online')}</div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
                <div>${ev.joined ? '<span class="status-joined">Terdaftar</span>' : (ev.is_closed ? '<span class="status-closed">Tutup</span>' : '<span class="badge-soft">Tersisa: ' + (ev.quota ? ev.quota : '—') + '</span>')}</div>
                <div>
                  <button class="btn btn-ghost btn-sm" data-id="${ev.id}" data-action="details">Detail</button>
                  ${ev.joined ? `<button class="btn btn-ghost btn-sm" data-id="${ev.id}" data-action="cancel">Batal</button>` : (ev.is_closed ? `` : `<button class="btn btn-primary btn-sm" data-id="${ev.id}" data-action="register">Daftar</button>`)}
                </div>
              </div>
            </div>
            <div class="helper mt-8">${escapeHtml(ev.short_description || ev.summary || '')}</div>
          </div>
        </div>
      `;
      // attach handlers
      card.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = btn.dataset.action;
          const id = btn.dataset.id;
          if (action === 'details') openRegisterModal(id);
          else if (action === 'register') openRegisterModal(id);
          else if (action === 'cancel') cancelRegistration(id);
        });
      });

      eventsGrid.appendChild(card);
    });
  }

  function renderEventsTable(events = []) {
    eventsTableBody.innerHTML = '';
    if (!events || events.length === 0) {
      eventsTableWrapper.classList.add('hidden');
      return;
    }
    eventsTableWrapper.classList.remove('hidden');

    events.forEach(ev => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="min-width:240px;">
          <div style="font-weight:700">${escapeHtml(ev.title || ev.name || '—')}</div>
          <div class="caption text-muted">${escapeHtml(ev.short_description || '')}</div>
        </td>
        <td>${formatDate(ev.event_date)}</td>
        <td>${escapeHtml(ev.location || 'Online')}</td>
        <td>${ev.joined ? '<span class="status-joined">Terdaftar</span>' : (ev.is_closed ? '<span class="status-closed">Tutup</span>' : '<span class="badge-soft">Terbuka</span>')}</td>
        <td>
          ${ev.joined ? `<button class="btn btn-ghost btn-sm" data-id="${ev.id}" data-action="cancel">Batal</button>` : (ev.is_closed ? '' : `<button class="btn btn-primary btn-sm" data-id="${ev.id}" data-action="register">Daftar</button>`)}
        </td>
      `;
      tr.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const action = btn.dataset.action;
          if (action === 'register') openRegisterModal(id);
          else if (action === 'cancel') cancelRegistration(id);
        });
      });
      eventsTableBody.appendChild(tr);
    });
  }

  /* ================================
     Modal: open / close / populate
  ================================ */

  function openRegisterModal(eventId) {
    // find event in lastEvents
    const ev = lastEvents.find(x => String(x.id) === String(eventId));
    if (!ev) {
      showToast('Error', 'Data kegiatan tidak ditemukan.', 'error');
      return;
    }
    // populate modal
    registerModalTitle.textContent = `Daftar: ${ev.title || ev.name || ''}`;
    registerModalBody.innerHTML = `
      <div style="display:flex;gap:18px;align-items:flex-start;">
        <div style="min-width:160px;">
          <div class="event-date-badge ${ev.category === 'workshop' ? 'blue' : ev.category === 'seminar' ? 'purple' : 'green'}">
            <div class="date-number">${(new Date(ev.event_date)).getDate()}</div>
            <div class="date-month">${(new Date(ev.event_date)).toLocaleString('id-ID',{month:'short'})}</div>
          </div>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:800">${escapeHtml(ev.title || ev.name)}</div>
          <div class="event-meta mt-1">${formatDate(ev.event_date)} • ${escapeHtml(ev.location || 'Online')}</div>
          <div class="mt-3">${escapeHtml(ev.description || ev.long_description || ev.summary || '')}</div>

          <form id="modalRegisterForm" class="mt-4">
            <div class="form-group">
              <label for="regNote" class="label">Catatan / Alasan ikut (opsional)</label>
              <textarea id="regNote" name="note" class="input" placeholder="Contoh: Ingin belajar tentang X..."></textarea>
              <div class="form-note">Isi catatan singkat jika perlu (opsional).</div>
            </div>

            ${ev.requires_file ? `
            <div class="form-group">
              <label for="regFile" class="label">Upload berkas (proposal / bukti pembayaran)</label>
              <input id="regFile" type="file" name="file" class="input" />
              <div class="form-note">Tipe file: PDF, JPG. Maks 3MB.</div>
            </div>` : ''}

          </form>
        </div>
      </div>
    `;

    // show modal
    registerModal.classList.add('show');
    registerModalBackdrop.classList.add('show');
    registerModal.setAttribute('aria-hidden', 'false');

    // ensure confirm handler uses the event id
    registerConfirmBtn.dataset.eventId = eventId;
  }

  function closeRegisterModalFn() {
    registerModal.classList.remove('show');
    registerModalBackdrop.classList.remove('show');
    registerModal.setAttribute('aria-hidden', 'true');
    // cleanup form
    const form = document.getElementById('modalRegisterForm');
    if (form) form.reset();
    registerConfirmBtn.removeAttribute('data-event-id');
  }

  closeRegisterModal?.addEventListener('click', closeRegisterModalFn);
  registerCancelBtn?.addEventListener('click', closeRegisterModalFn);
  registerModalBackdrop?.addEventListener('click', closeRegisterModalFn);

  /* ================================
     Core: register flow (confirm -> post)
  ================================ */

  async function doRegister(eventId) {
    // Get form data from modal
    const form = document.getElementById('modalRegisterForm');
    if (!form) {
      showToast('Error', 'Form pendaftaran tidak ditemukan.', 'error');
      return;
    }

    // collect
    const fd = new FormData();
    fd.append('event_id', eventId);
    const note = form.querySelector('[name="note"]') ? form.querySelector('[name="note"]').value.trim() : '';
    if (note) fd.append('note', note);

    const fileInput = form.querySelector('[type="file"]');
    if (fileInput && fileInput.files && fileInput.files[0]) {
      fd.append('file', fileInput.files[0]);
    }

    // disable button and show loading
    registerConfirmBtn.disabled = true;
    registerConfirmBtn.innerHTML = 'Memproses...';

    showToast('Mendaftar', 'Mengirim pendaftaran ke server...', 'info', 2200);

    try {
      const res = await safeFetchJson(API_REGISTER_URL, { method: 'POST', body: fd }, 15000);

      if (!res.ok) {
        console.error('Register failed', res);
        const msg = (res.data && res.data.message) ? res.data.message : (res.raw || 'Gagal mendaftar.');
        showToast('Gagal', msg, 'error', 6000);
        registerConfirmBtn.disabled = false;
        registerConfirmBtn.innerHTML = 'Konfirmasi Daftar';
        return;
      }

      // Expect server returns { status:'success', data: { registration_id: ... }, message: '...' }
      if (res.data && res.data.status && res.data.status.toLowerCase() === 'success') {
        showToast('Berhasil', res.data.message || 'Pendaftaran berhasil.', 'success', 4200);

        // Update local event state: mark as joined
        const idx = lastEvents.findIndex(x => String(x.id) === String(eventId));
        if (idx !== -1) {
          lastEvents[idx].joined = true;
        }
        // re-render current view
        renderEventsGrid(paginateLocalResults());
        renderEventsTable(paginateLocalResults());

        closeRegisterModalFn();
        registerConfirmBtn.disabled = false;
        registerConfirmBtn.innerHTML = 'Konfirmasi Daftar';
        return;
      } else {
        const message = (res.data && res.data.message) ? res.data.message : 'Pendaftaran gagal.';
        showToast('Gagal', message, 'error', 6000);
        registerConfirmBtn.disabled = false;
        registerConfirmBtn.innerHTML = 'Konfirmasi Daftar';
        return;
      }

    } catch (err) {
      console.error('Network/register error', err);
      showToast('Kesalahan', 'Gagal menghubungi server. Cek koneksi.', 'error', 6000);
      registerConfirmBtn.disabled = false;
      registerConfirmBtn.innerHTML = 'Konfirmasi Daftar';
    }
  }

  // Confirm button
  registerConfirmBtn?.addEventListener('click', () => {
    const eventId = registerConfirmBtn.dataset.eventId;
    if (!eventId) {
      showToast('Error', 'Tidak ada event yang dipilih.', 'error');
      return;
    }
    // Basic confirmation UX
    registerConfirmBtn.disabled = true;
    registerConfirmBtn.innerHTML = 'Memproses...';
    // small delay to allow UI update
    setTimeout(() => doRegister(eventId), 120);
  });

  /* ================================
     Cancel registration (optional)
     If backend supports cancellation, call the endpoint. For now: optimistic.
  ================================ */

  async function cancelRegistration(eventId) {
    // TODO: Replace with proper API endpoint if exists (attendance.php?action=cancel)
    const confirm = window.confirm('Batalkan pendaftaran untuk kegiatan ini?');
    if (!confirm) return;

    // optimistic: call cancel endpoint if exists
    // Example assumed endpoint: events.php?action=cancel_registration
    const CANCEL_URL = `${API_BASE}/events.php?action=cancel_registration`;

    showToast('Batal', 'Mengirim permintaan pembatalan...', 'info', 2500);

    try {
      const fd = new FormData();
      fd.append('event_id', eventId);
      const res = await safeFetchJson(CANCEL_URL, { method: 'POST', body: fd }, 12000);
      if (res.ok && res.data && res.data.status && res.data.status.toLowerCase() === 'success') {
        showToast('Berhasil', 'Pendaftaran dibatalkan.', 'success', 3000);
        // reflect in UI
        const idx = lastEvents.findIndex(x => String(x.id) === String(eventId));
        if (idx !== -1) {
          lastEvents[idx].joined = false;
        }
        renderEventsGrid(paginateLocalResults());
        renderEventsTable(paginateLocalResults());
      } else {
        showToast('Gagal', res.data?.message || 'Gagal membatalkan pendaftaran.', 'error', 5000);
      }
    } catch (err) {
      console.error('Cancel error', err);
      showToast('Error', 'Tidak dapat menghubungi server.', 'error', 5000);
    }
  }

  /* ================================
     Pagination utilities (local fallback)
  ================================ */

  function paginateLocalResults() {
    // If server returns only current page, use it directly
    // Otherwise slice the array (fallback)
    const items = lastEvents || [];
    if (!items) return [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }

  /* ================================
     MAIN: fetch events list with filters
  ================================ */

  async function runListEvents() {
    const q = (searchInput.value || '').trim();
    const cat = (categorySelect.value || '').trim();
    const date = (dateFilter.value || 'upcoming').trim();
    const sort = (sortSelect.value || 'recommended').trim();

    const key = buildCacheKey(q, cat, date, currentPage, sort);
    if (eventCache.has(key)) {
      const cached = eventCache.get(key);
      console.log('Using cached events for', key);
      lastEvents = cached.items;
      totalItems = cached.total;
      totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
      renderEventsGrid(paginateLocalResults());
      renderEventsTable(paginateLocalResults());
      renderPagination();
      return;
    }

    // Show skeletons
    showSkeletonCards(4);
    eventsGrid.classList.add('hidden');
    eventsTableWrapper.classList.add('hidden');
    eventsEmpty.classList.add('hidden');

    // Build query params
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (cat) params.append('category', cat);
    if (date) params.append('date_filter', date);
    params.append('page', String(currentPage));
    params.append('page_size', String(PAGE_SIZE));
    params.append('sort', sort);

    const url = `${API_LIST_EVENTS}&${params.toString()}`;
    console.log('Request events URL:', url);

    const res = await safeFetchJson(url, { method: 'GET' }, 14000);

    clearSkeletons();

    if (!res.ok) {
      console.error('Failed fetch events', res);
      showToast('Gagal', 'Gagal mengambil daftar kegiatan. Periksa koneksi/server.', 'error', 6000);
      eventsEmpty.classList.remove('hidden');
      return;
    }

    // normalize response: expect { status:'success', data: { total: N, items: [...] }, message: '' }
    let items = [];
    let total = 0;
    if (res.data) {
      if (Array.isArray(res.data)) {
        items = res.data;
        total = items.length;
      } else if (res.data.items) {
        items = res.data.items;
        total = res.data.total || items.length;
      } else if (res.data.data && Array.isArray(res.data.data)) {
        items = res.data.data;
        total = items.length;
      }
    }

    // defensive defaults
    lastEvents = items || [];
    totalItems = total || lastEvents.length;
    totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

    // cache for short time
    eventCache.set(key, { items: lastEvents, total: totalItems, ts: Date.now() });

    // render page items
    renderEventsGrid(paginateLocalResults());
    renderEventsTable(paginateLocalResults());
    renderPagination();

    // if nothing, show empty
    if (!lastEvents || lastEvents.length === 0) {
      eventsEmpty.classList.remove('hidden');
    }
  }

  /* ================================
     EVENTS: bindings
  ================================ */

  // search debounce
  let searchTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentPage = 1;
      runListEvents();
    }, 420);
  });

  searchBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    currentPage = 1;
    runListEvents();
  });

  // filters
  categorySelect?.addEventListener('change', () => { currentPage = 1; runListEvents(); });
  dateFilter?.addEventListener('change', () => { currentPage = 1; runListEvents(); });
  sortSelect?.addEventListener('change', () => { currentPage = 1; runListEvents(); });

  clearFiltersBtn?.addEventListener('click', () => {
    searchInput.value = '';
    categorySelect.value = '';
    dateFilter.value = 'upcoming';
    sortSelect.value = 'recommended';
    currentPage = 1;
    eventCache.clear();
    runListEvents();
  });

  prevPageBtn?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage -= 1; runListEvents(); }
  });
  nextPageBtn?.addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage += 1; runListEvents(); }
  });

  /* ================================
     INITIALIZE
  ================================ */

  (function init() {
    // initial skeleton and load
    showSkeletonCards(4);
    runListEvents();
    console.log('✅ pendaftaran.js initialized');
  })();

  /* ================================
     Periodic cache clean
  ================================ */
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of eventCache.entries()) {
      if (now - (v.ts || 0) > 5 * 60 * 1000) eventCache.delete(k);
    }
  }, 60 * 1000);

}); // end DOMContentLoaded
