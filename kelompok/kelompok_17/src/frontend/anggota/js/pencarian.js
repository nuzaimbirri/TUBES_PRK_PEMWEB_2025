/**
 * pencarian.js
 * Pencarian Anggota (name | email | type)
 *
 * - API: default uses relative backend path (change if necessary)
 * - Uses credentials: 'include' so session cookie from backend works
 * - Supports: debounce, pagination, filters (type chips), table/card view, skeletons, highlight matches
 * - Very verbose logging & comments, matching style of dashboard.js
 */

/* ================================
   CONFIGURATION
   ================================ */

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

const SEARCH_ENDPOINT = `${API_BASE}/auth.php?action=all_members`;

console.log('📍 pencarian.js - SEARCH_ENDPOINT:', SEARCH_ENDPOINT);

/* ================================
   UTILS / HELPERS (reusable)
   ================================ */

/**
 * debounce(fn, wait) - return debounced function
 * Useful to avoid sending request on every keypress
 */
function debounce(fn, wait = 320) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * safeFetchJson - wrapper for fetch with timeout and safer error messages
 */
async function safeFetchJson(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal, credentials: 'include', cache: 'no-store' });
    clearTimeout(id);
    const text = await res.text();
    try {
      return { ok: res.ok, status: res.status, data: JSON.parse(text) };
    } catch (e) {
      // Non-JSON response
      return { ok: res.ok, status: res.status, data: null, raw: text };
    }
  } catch (err) {
    clearTimeout(id);
    console.error('safeFetchJson error', err);
    return { ok: false, status: 0, data: null, error: err };
  }
}

/**
 * escapeHtml - prevent XSS when injecting text
 */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * highlightText - highlights matched terms (case-insensitive)
 * returns HTML string with <span class="match">...</span>
 */
function highlightText(text = '', terms = []) {
  if (!terms || terms.length === 0) return escapeHtml(text);
  let result = escapeHtml(text);
  terms.forEach((t) => {
    const safe = escapeHtml(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex
    const re = new RegExp(`(${safe})`, 'ig');
    result = result.replace(re, '<span class="match">$1</span>');
  });
  return result;
}

/* ================================
   DOM CACHING
   ================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Inputs & controls
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const clearBtn = document.getElementById('clearBtn');
  const sortSelect = document.getElementById('sortSelect');

  // Views
  const tableView = document.getElementById('tableView');
  const cardsView = document.getElementById('cardsView');
  const resultsTableBody = document.getElementById('resultsTableBody');
  const cardsContainer = document.getElementById('cardsView');
  const skeletonsEl = document.getElementById('skeletons');
  const emptyState = document.getElementById('emptyState');
  const resultsCount = document.getElementById('resultsCount');

  // View toggles and pagination
  const toggleTable = document.getElementById('toggleTable');
  const toggleCards = document.getElementById('toggleCards');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const paginationControls = document.getElementById('paginationControls');

  // Filters / chips
  const typeChipsEl = document.getElementById('typeChips');

  // Profile modal
  const profileModal = document.getElementById('profileModal');
  const profileModalBackdrop = document.getElementById('profileModalBackdrop');
  const profileModalBody = document.getElementById('profileModalBody');
  const closeProfileModal = document.getElementById('closeProfileModal');
  const profileModalCloseBtn = document.getElementById('profileModalCloseBtn');

  // Toast container
  const toastContainer = document.getElementById('toastContainer');

  /* ================================
     STATE
     ================================ */
  let currentView = 'table'; // 'table' or 'cards'
  let currentPage = 1;
  const PAGE_SIZE = 10;
  let lastQuery = '';
  let selectedTypes = new Set(); // e.g. 'anggota','admin'
  let lastResults = []; // last fetched results (full list from server)
  let totalResults = 0;
  let totalPages = 1;
  let cache = new Map(); // simple in-memory caching by query+types+page+sort

  /* ================================
     UI HELPERS
     ================================ */

  function showToast(title, msg, variant = 'info', timeout = 4000) {
    const t = document.createElement('div');
    t.className = `toast ${variant === 'success' ? 'success' : variant === 'error' ? 'error' : ''}`;
    t.innerHTML = `<div class="title">${escapeHtml(title)}</div><div class="msg" style="margin-top:6px">${escapeHtml(msg)}</div>`;
    toastContainer.appendChild(t);
    setTimeout(() => t.remove(), timeout);
  }

  function showSkeletons(count = 5) {
    skeletonsEl.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'skeleton skeleton-row';
      skeletonsEl.appendChild(s);
    }
  }

  function clearSkeletons() {
    skeletonsEl.innerHTML = '';
  }

  function setResultsCount(n) {
    resultsCount.textContent = `${n.toLocaleString('id-ID')} hasil`;
  }

  function buildChip(type, active = false) {
    const c = document.createElement('div');
    c.className = 'chip';
    if (active) c.classList.add('active');
    c.dataset.type = type;
    c.innerHTML = `${escapeHtml(type)} <span class="remove" aria-hidden="true">✕</span>`;
    c.addEventListener('click', (e) => {
      // Toggle selection
      if (selectedTypes.has(type)) {
        selectedTypes.delete(type);
        c.classList.remove('active');
      } else {
        selectedTypes.add(type);
        c.classList.add('active');
      }
      // reset to page 1 and re-run search
      currentPage = 1;
      debouncedSearch();
    });
    return c;
  }

  function renderPagination() {
    paginationControls.innerHTML = '';
    if (totalPages <= 1) return;
    // show up to 7 page buttons (centered on current)
    const visible = 7;
    const half = Math.floor(visible / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + visible - 1);
    if (end - start < visible - 1) start = Math.max(1, end - visible + 1);

    for (let p = start; p <= end; p++) {
      const btn = document.createElement('button');
      btn.textContent = p;
      btn.className = 'btn btn-ghost btn-sm';
      if (p === currentPage) btn.classList.add('active');
      btn.addEventListener('click', () => {
        if (p === currentPage) return;
        currentPage = p;
        runSearch(); // immediate call for page switch
      });
      paginationControls.appendChild(btn);
    }
  }

  function renderTable(results = [], highlightTerms = []) {
    resultsTableBody.innerHTML = '';
    if (!results || results.length === 0) {
      // empty
      emptyState.classList.remove('hidden');
      tableView.classList.add('hidden');
      return;
    }
    emptyState.classList.add('hidden');
    tableView.classList.remove('hidden');

    results.forEach((r) => {
      const tr = document.createElement('tr');

      const nameTd = document.createElement('td');
      nameTd.innerHTML = `<div style="display:flex;gap:12px;align-items:center;">
        <div class="avatar avatar-sm" aria-hidden="true">${escapeHtml(getInitials(r.full_name || r.username || '—'))}</div>
        <div style="min-width:0">
          <div style="font-weight:700;">${highlightText(r.full_name || r.username || '—', highlightTerms)}</div>
          <div class="caption muted">${escapeHtml(r.position || r.role || '')}</div>
        </div>
      </div>`;
      tr.appendChild(nameTd);

      const emailTd = document.createElement('td');
      emailTd.innerHTML = highlightText(r.email || '—', highlightTerms);
      tr.appendChild(emailTd);

      const npmTd = document.createElement('td');
      npmTd.textContent = r.npm || '—';
      tr.appendChild(npmTd);

      const typeTd = document.createElement('td');
      typeTd.innerHTML = `<span class="badge badge-soft">${escapeHtml(r.role || 'anggota')}</span>`;
      tr.appendChild(typeTd);

      const actionsTd = document.createElement('td');
      actionsTd.innerHTML = `<div style="display:flex;gap:8px;align-items:center;">
        <button class="btn btn-ghost btn-sm" data-id="${r.id}" data-action="view">Lihat</button>
        <button class="btn btn-ghost btn-sm" data-id="${r.id}" data-action="message">Pesan</button>
      </div>`;
      tr.appendChild(actionsTd);

      // event delegation via attribute
      tr.querySelectorAll('button[data-action]').forEach((btn) => {
        btn.addEventListener('click', (ev) => {
          const action = btn.dataset.action;
          const id = btn.dataset.id;
          if (action === 'view') openProfileModalById(id);
          else if (action === 'message') showToast('Fitur', 'Fitur pesan belum diimplementasikan', 'info', 2500);
        });
      });

      resultsTableBody.appendChild(tr);
    });
  }

  function renderCards(results = [], highlightTerms = []) {
    cardsContainer.innerHTML = '';
    if (!results || results.length === 0) {
      cardsContainer.classList.add('hidden');
      return;
    }
    cardsContainer.classList.remove('hidden');
    results.forEach((r) => {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <div class="avatar avatar-md">${escapeHtml(getInitials(r.full_name || r.username || '—'))}</div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
              <div style="min-width:0">
                <div style="font-weight:800;">${highlightText(r.full_name || r.username || '—', highlightTerms)}</div>
                <div class="helper">${escapeHtml(r.email || '—')}</div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
                <div class="badge-soft" style="font-weight:800">${escapeHtml(r.role || 'anggota')}</div>
                <div class="text-muted caption">${escapeHtml(r.npm || '')}</div>
              </div>
            </div>
            <div class="result-meta mt-2">
              <div class="caption muted">${escapeHtml(r.bio || '')}</div>
            </div>
            <div style="margin-top:10px;display:flex;gap:8px;">
              <button class="btn btn-ghost btn-sm" data-id="${r.id}" data-action="view">Lihat Profil</button>
              <button class="btn btn-primary btn-sm" data-id="${r.id}" data-action="reg">Daftar Kegiatan</button>
            </div>
          </div>
        </div>
      `;
      // events
      card.querySelectorAll('button[data-action]').forEach((b) => {
        b.addEventListener('click', (e) => {
          const act = b.dataset.action;
          const id = b.dataset.id;
          if (act === 'view') openProfileModalById(id);
          else if (act === 'reg') showToast('Daftar', 'Membuka form pendaftaran...', 'info', 1600);
        });
      });
      cardsContainer.appendChild(card);
    });
  }

  /* ================================
     SMALL UI UTILITIES
     ================================ */

  function getInitials(name = '') {
    if (!name) return 'U';
    return name.split(' ').map(s => s[0] || '').join('').substring(0, 2).toUpperCase();
  }

  function openProfileModalById(id) {
    // find in lastResults
    const r = lastResults.find(x => String(x.id) === String(id));
    if (!r) {
      showToast('Not found', 'Data anggota tidak ditemukan di cache.', 'error');
      return;
    }
    // populate modal
    profileModalBody.innerHTML = `
      <div style="display:flex;gap:16px;align-items:flex-start;">
        <div style="min-width:140px;text-align:center;">
          <div class="avatar avatar-lg">${escapeHtml(getInitials(r.full_name || r.username || 'U'))}</div>
          <div class="mt-3" style="font-weight:800">${escapeHtml(r.full_name || '—')}</div>
          <div class="caption text-muted">${escapeHtml(r.role || '')}</div>
        </div>
        <div style="flex:1;">
          <div class="kv-row">
            <div class="k">Email</div><div class="v">${escapeHtml(r.email || '—')}</div>
          </div>
          <div class="kv-row">
            <div class="k">NPM</div><div class="v">${escapeHtml(r.npm || '—')}</div>
          </div>
          <div class="kv-row">
            <div class="k">No. HP</div><div class="v">${escapeHtml(r.phone || '—')}</div>
          </div>
          <div class="kv-row" style="margin-top:8px;">
            <div class="k">Tentang</div><div class="v">${escapeHtml(r.bio || '—')}</div>
          </div>
        </div>
      </div>
    `;
    // show modal
    profileModal.classList.add('show');
    profileModalBackdrop.classList.add('show');
    profileModal.setAttribute('aria-hidden', 'false');
  }

  function closeProfileModalFn() {
    profileModal.classList.remove('show');
    profileModalBackdrop.classList.remove('show');
    profileModal.setAttribute('aria-hidden', 'true');
  }

  // event listeners for modal close
  closeProfileModal?.addEventListener('click', closeProfileModalFn);
  profileModalCloseBtn?.addEventListener('click', closeProfileModalFn);
  profileModalBackdrop?.addEventListener('click', closeProfileModalFn);

  /* ================================
     CORE SEARCH LOGIC
     ================================ */

  // Build query key for cache
  function buildCacheKey(q, types, page, sort) {
    const t = Array.from(types).sort().join(',');
    return `${q}::types=${t}::page=${page}::sort=${sort}`;
  }

  // transform server results into array we can work with (safety)
  function normalizeServerResults(payload) {
    // Expecting payload to be { status: 'success', data: { total: N, items: [...] } }
    if (!payload) return { total: 0, items: [] };
    // try multiple shapes
    if (payload.data && Array.isArray(payload.data)) {
      // simple array
      return { total: payload.data.length, items: payload.data };
    }
    if (payload.data && payload.data.items) {
      return { total: payload.data.total || payload.data.items.length, items: payload.data.items };
    }
    if (Array.isArray(payload)) return { total: payload.length, items: payload };
    return { total: 0, items: [] };
  }

  let allMembersCache = [];
  let allMembersLoaded = false;

  async function loadAllMembers() {
    if (allMembersLoaded && allMembersCache.length > 0) {
      return allMembersCache;
    }
    
    const res = await safeFetchJson(SEARCH_ENDPOINT, { method: 'GET' }, 12000);
    
    if (!res.ok) {
      console.error('Failed to load members', res);
      showToast('Gagal', 'Gagal mengambil data anggota.', 'error', 5000);
      return [];
    }
    
    const data = res.data;
    if (data && data.status === 'success' && Array.isArray(data.data)) {
      allMembersCache = data.data;
    } else if (Array.isArray(data)) {
      allMembersCache = data;
    } else if (data && Array.isArray(data.data)) {
      allMembersCache = data.data;
    } else {
      allMembersCache = [];
    }
    
    allMembersLoaded = true;
    return allMembersCache;
  }

  async function runSearch() {
    const rawQuery = (searchInput.value || '').trim().toLowerCase();
    const sort = (sortSelect.value || 'relevance');
    const terms = rawQuery.split(/\s+/).filter(Boolean);

    lastQuery = rawQuery;

    showSkeletons(Math.min(PAGE_SIZE, 6));
    emptyState.classList.add('hidden');
    tableView.classList.add('hidden');
    cardsContainer.classList.add('hidden');

    const allMembers = await loadAllMembers();
    
    clearSkeletons();
    
    if (!allMembers || allMembers.length === 0) {
      handleSearchResults({ items: [], total: 0 }, terms, false);
      return;
    }
    
    let filtered = allMembers;
    
    if (rawQuery) {
      filtered = allMembers.filter(m => {
        const fullName = (m.full_name || '').toLowerCase();
        const email = (m.email || '').toLowerCase();
        const npm = (m.npm || '').toLowerCase();
        const username = (m.username || '').toLowerCase();
        return fullName.includes(rawQuery) || 
               email.includes(rawQuery) || 
               npm.includes(rawQuery) ||
               username.includes(rawQuery);
      });
    }
    
    if (selectedTypes.size > 0) {
      filtered = filtered.filter(m => {
        const role = (m.role || 'anggota').toLowerCase();
        return selectedTypes.has(role);
      });
    }
    
    if (sort === 'name') {
      filtered.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    } else if (sort === 'name-desc') {
      filtered.sort((a, b) => (b.full_name || '').localeCompare(a.full_name || ''));
    }
    
    totalResults = filtered.length;
    lastResults = filtered;
    totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
    
    handleSearchResults({ items: filtered, total: filtered.length }, terms, false);
  }

  // handle results and render to correct view
  function handleSearchResults(payload, highlightTerms = [], fromCache = false) {
    // Normalize
    const norm = normalizeServerResults(payload);
    totalResults = norm.total || 0;
    lastResults = norm.items || [];

    // update UI
    setResultsCount(totalResults);
    renderPagination();

    if (!lastResults || lastResults.length === 0) {
      // show empty state
      emptyState.classList.remove('hidden');
      tableView.classList.add('hidden');
      cardsContainer.classList.add('hidden');
      return;
    }

    // Paginate client-side if backend sent full list (defensive)
    let pageItems = lastResults;
    // If server already slices by page, assume it returned page-specific items; otherwise slice here
    if (lastResults.length > PAGE_SIZE && totalResults > PAGE_SIZE) {
      const start = (currentPage - 1) * PAGE_SIZE;
      pageItems = lastResults.slice(start, start + PAGE_SIZE);
    }

    // Render depending on view
    if (currentView === 'table') {
      renderTable(pageItems, highlightTerms);
      cardsContainer.classList.add('hidden');
      tableView.classList.remove('hidden');
    } else {
      renderCards(pageItems, highlightTerms);
      tableView.classList.add('hidden');
      cardsContainer.classList.remove('hidden');
    }
  }

  /* ================================
     EVENT BINDINGS / UX
     ================================ */

  // Debounced search handler (used on input)
  const debouncedSearch = debounce(() => {
    // reset page
    currentPage = 1;
    runSearch();
  }, 420);

  // Key input on search
  searchInput?.addEventListener('input', (e) => {
    // show quick suggestions (not implemented) - placeholder for future
    debouncedSearch();
  });

  // Search on button click
  searchBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    currentPage = 1;
    runSearch();
  });

  // Clear button
  clearBtn?.addEventListener('click', (e) => {
    searchInput.value = '';
    selectedTypes.clear();
    // remove active on chips
    typeChipsEl.querySelectorAll('.chip').forEach(ch => ch.classList.remove('active'));
    currentPage = 1;
    runSearch();
  });

  // Sort change
  sortSelect?.addEventListener('change', () => {
    currentPage = 1;
    runSearch();
  });

  // Pagination prev/next
  prevPageBtn?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage -= 1;
      runSearch();
    }
  });
  nextPageBtn?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage += 1;
      runSearch();
    }
  });

  // View toggles
  toggleTable?.addEventListener('click', () => {
    currentView = 'table';
    toggleTable.classList.add('active');
    toggleCards.classList.remove('active');
    tableView.classList.remove('hidden');
    cardsContainer.classList.add('hidden');
  });
  toggleCards?.addEventListener('click', () => {
    currentView = 'cards';
    toggleCards.classList.add('active');
    toggleTable.classList.remove('active');
    cardsContainer.classList.remove('hidden');
    tableView.classList.add('hidden');
  });

  /* ================================
     INITIALIZE FILTER CHIPS (tipe keanggotaan)
     - We create default chips; if backend has dynamic types, replace with API call
     ================================ */

  const defaultTypes = ['anggota', 'admin', 'pengurus', 'alumni', 'calon'];
  defaultTypes.forEach(t => {
    const chip = buildChip(t, false);
    typeChipsEl.appendChild(chip);
  });

  /* ================================
     LOAD DEFAULT (initial) - show popular members / recent ones
     ================================ */
  (function init() {
    // initial skeletons
    showSkeletons(4);

    // Optionally, call endpoint for recent members if backend supports it
    // For now we run an empty search to fetch first page
    currentPage = 1;
    runSearch();
    console.log('✅ pencarian.js initialized');
  })();

  /* ================================
     CLEANUP / UTIL: cache maintenance
     ================================ */
  // expire cache older than 5 minutes periodically
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now - v.ts > 5 * 60 * 1000) cache.delete(k);
    }
  }, 60 * 1000);

});
