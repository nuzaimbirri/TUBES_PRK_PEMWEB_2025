document.addEventListener("DOMContentLoaded", async () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isDotTest = hostname.endsWith('.test');
    let basePath = '';
    if (isLocalhost) {
        basePath = '/TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17/src';
    } else if (isDotTest) {
        basePath = '/kelompok/kelompok_17/src';
    }
    const BASE_API_URL = `${basePath}/backend/api/auth.php`;
    const ADMIN_DASHBOARD = `${basePath}/frontend/admin/admin.html`;
    const ANGGOTA_DASHBOARD = `${basePath}/frontend/anggota/dashboard.html`;
    const LOGIN_API_URL = `${BASE_API_URL}?action=login`;
    const REGISTER_API_URL = `${BASE_API_URL}?action=register`;
    const SESSION_API_URL = `${BASE_API_URL}?action=check`;
    const safeJson = async (res) => {
        try { return await res.json(); } catch { return null; }
    };
    const waitForSession = async (maxAttempts = 6, delayMs = 300) => {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const r = await fetch(SESSION_API_URL, {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store"
                });
                const j = await safeJson(r);
                if (r.ok && j && j.status === "success" && j.data) {
                    const logged = j.data.logged_in === true || !!j.data.user;
                    if (logged) return j.data; // return session data
                }
            } catch (err) {
            }
            await new Promise(res => setTimeout(res, delayMs));
        }
        return null; // not confirmed
    };
    const displayMessage = (id, message, type) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove("d-none", "alert-danger", "alert-success", "alert-warning");
        el.classList.add(`alert-${type}`);
        el.textContent = message;
    };
    const resetErrors = (form) => {
        if (!form) return;
        form.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
        form.querySelectorAll(".invalid-feedback").forEach(el => el.textContent = "");
        const id = form.id.replace("Form", "Message");
        const msg = document.getElementById(id);
        if (msg) msg.classList.add("d-none");
    };
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const handleValidationErrors = (form, errors, prefix) => {
        if (!errors || !form) return;
        for (const field in errors) {
            const input = form.querySelector(`[name="${field}"]`);
            const errorLabel = document.getElementById(`${prefix}${capitalize(field)}Error`);
            if (input) input.classList.add("is-invalid");
            if (errorLabel) errorLabel.textContent = errors[field];
        }
    };
    const toggleButton = (btn, state, normalText, loadingText) => {
        if (!btn) return;
        btn.disabled = state;
        btn.textContent = state ? loadingText : normalText;
    };
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            resetErrors(loginForm);
            const btn = loginForm.querySelector("button");
            toggleButton(btn, true, "Masuk", "Memproses...");
            try {
                const formData = new FormData(loginForm);
                const response = await fetch(LOGIN_API_URL, {
                    method: "POST",
                    body: formData,
                    credentials: "include"
                });
                const result = await safeJson(response);
                if (result && result.status === "success") {
                    const isApproved = result.data?.user?.is_approved == 1;
                    const role = result.data?.user?.role;
                    if (role && role.toLowerCase() === "anggota" && !isApproved) {
                         displayMessage("loginMessage", "**Akun belum disetujui Admin.** Silakan tunggu notifikasi email.", "warning");
                         toggleButton(btn, false, "Masuk", "Memproses...");
                         return;
                    }
                    displayMessage("loginMessage", "Login berhasil! Menunggu konfirmasi sesi...", "success");
                    const session = await waitForSession(6, 300);
                    if (session && (session.logged_in === true || session.user)) {
                        const finalRole = (session.user && session.user.role) || session.role || (result.data?.user?.role);
                        if (finalRole && finalRole.toLowerCase() === "admin") {
                            location.replace(ADMIN_DASHBOARD);
                        } else {
                            location.replace(ANGGOTA_DASHBOARD);
                        }
                        return;
                    } else {
                        displayMessage("loginMessage", "Login sukses tapi sesi belum terkonfirmasi. Coba refresh halaman.", "warning");
                    }
                } else {
                    const msg = (result && result.message) || "Gagal login. Cek kredensial Anda.";
                    const msgType = msg.includes("belum disetujui") ? "warning" : "danger";
                    displayMessage("loginMessage", msg, msgType);
                    if (result && result.errors) {
                        handleValidationErrors(loginForm, result.errors, "login");
                    }
                }
            } catch (err) {
                console.error("Login error:", err);
                displayMessage("loginMessage", "Kesalahan server / jaringan.", "danger");
            } finally {
                toggleButton(btn, false, "Masuk", "Memproses...");
            }
        });
    }
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            resetErrors(registerForm);
            const btn = registerForm.querySelector("button");
            toggleButton(btn, true, "Daftar", "Memproses...");
            try {
                const formData = new FormData(registerForm);
                const response = await fetch(REGISTER_API_URL, {
                    method: "POST",
                    body: formData,
                    credentials: "include"
                });
                const result = await safeJson(response);
                if (result && result.status === "success") {
                    displayMessage("registerMessage", "**Registrasi berhasil!** Akun Anda akan aktif setelah disetujui oleh Admin. Silakan tunggu notifikasi email.", "success");
                } else {
                    displayMessage("registerMessage", (result && result.message) || "Registrasi gagal", "danger");
                    if (result && result.errors) handleValidationErrors(registerForm, result.errors, "reg");
                }
            } catch (err) {
                console.error("Register error:", err);
                displayMessage("registerMessage", "Kesalahan server / jaringan.", "danger");
            } finally {
                toggleButton(btn, false, "Daftar", "Memproses...");
            }
        });
    }
});