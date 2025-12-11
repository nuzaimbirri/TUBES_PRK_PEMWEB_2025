/**
 * SIMORA - PRESENSI ANGGOTA
 * Halaman untuk mengatur status aktif / tidak aktif anggota.
 * Lengkap dengan pencarian, render UI, badge status, dan tombol aksi.
 */

document.addEventListener("DOMContentLoaded", () => {

    // ===============================
    // API CONFIG
    // ===============================
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
    const API_MEMBERS = `${API_BASE}/auth.php?action=all_members`;
    const API_UPDATE_STATUS = `${API_BASE}/users.php?action=update-status`;

    // ===============================
    // UI ELEMENTS
    // ===============================
    const container = document.getElementById("presensiContainer");
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("btnSearch");
    const emptyState = document.getElementById("emptyState");

    let memberData = [];

    // ===============================
    // Fetch members from backend
    // ===============================
    async function loadMembers() {
        try {
            const response = await fetch(API_MEMBERS, {
                method: "GET",
                credentials: "include"
            });

            const result = await response.json();
            if (result.status === "success") {
                memberData = result.data;
                renderMembers(memberData);
            } else {
                console.error("Failed to fetch members:", result.message);
            }

        } catch (err) {
            console.error("Network error:", err);
        }
    }

    // ===============================
    // Render Members List
    // ===============================
    function renderMembers(data) {

        container.innerHTML = "";
        emptyState.style.display = data.length === 0 ? "block" : "none";

        if (data.length === 0) return;

        data.forEach((member) => {
            
            const isActive = member.status === "aktif";
            const shortName = getInitials(member.full_name || member.username);

            const card = document.createElement("div");
            card.className = "presensi-card fade-in";

            card.innerHTML = `
                <div class="presensi-meta">
                    <div class="profile-photo" style="width:60px;height:60px;font-size:1rem;">
                        ${shortName}
                    </div>
                    <div>
                        <div class="profile-name">${member.full_name}</div>
                        <div class="text-small">${member.email}</div>
                        <div class="text-small mt-8" style="font-weight:700; color:${isActive ? '#10b981' : '#ef4444'};">
                            ${isActive ? "Aktif" : "Tidak Aktif"}
                        </div>
                    </div>
                </div>

                <div>
                    <button class="btn btn-sm btn-primary mb-8" data-set="aktif" data-id="${member.id}">Set Aktif</button>
                    <button class="btn btn-sm btn-danger" data-set="nonaktif" data-id="${member.id}">Set Tidak Aktif</button>
                </div>
            `;

            container.appendChild(card);
        });

        attachStatusListeners();
    }

    // ===============================
    // Set Status Active / Nonactive
    // ===============================
    function attachStatusListeners() {
        const buttons = document.querySelectorAll("[data-set]");

        buttons.forEach((btn) => {
            btn.addEventListener("click", async () => {
                const userId = btn.dataset.id;
                const statusType = btn.dataset.set;

                await updateStatus(userId, statusType);
            });
        });
    }

    async function updateStatus(id, statusType) {
        try {
            const response = await fetch(`${API_BASE}/users.php?action=update-status&id=${id}`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: statusType })
            });

            const result = await response.json();

            if (result.status === "success") {
                loadMembers();
            } else {
                alert("Gagal mengubah status: " + result.message);
            }

        } catch (err) {
            console.error("Error:", err);
        }
    }

    // ===============================
    // Search
    // ===============================
    function searchMembers() {
        const query = searchInput.value.toLowerCase().trim();

        const filtered = memberData.filter((m) => {
            return (
                m.full_name.toLowerCase().includes(query) ||
                m.email.toLowerCase().includes(query) ||
                (m.npm && m.npm.toLowerCase().includes(query))
            );
        });

        renderMembers(filtered);
    }

    searchBtn.addEventListener("click", searchMembers);
    searchInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") searchMembers();
    });

    // Helper
    function getInitials(name) {
        return name.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();
    }

    // Init
    loadMembers();
});
