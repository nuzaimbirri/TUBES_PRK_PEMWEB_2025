document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    const BASE_API_URL = 'http://localhost/TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17/src/backend/api/auth.php';

    const LOGIN_API_URL = `${BASE_API_URL}?action=login`;
    const REGISTER_API_URL = `${BASE_API_URL}?action=register`;

    const displayMessage = (elementId, message, type) => {
        const alertElement = document.getElementById(elementId);
        alertElement.classList.remove('d-none', 'alert-danger', 'alert-success', 'alert-warning');
        alertElement.classList.add(`alert-${type}`);
        alertElement.textContent = message;
    }

    const getFormData = (form) => {
        const formData = new FormData(form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = typeof value === 'string' ? value.trim() : value;
        }
        return data;
    };

    const resetFormValidation = (form) => {
        form.querySelectorAll('.form-control').forEach(input => input.classList.remove('is-invalid'));
        const messageElement = document.getElementById(form.id.replace('Form', 'Message'));
        if (messageElement) messageElement.classList.add('d-none');
    }

    const handleValidationErrors = (form, errors) => {
        for (const field in errors) {
            const inputElement = form.querySelector(`[name="${field}"]`);
            const errorElement = document.getElementById(`${form.id.startsWith('login') ? 'login' : 'reg'}${field.charAt(0).toUpperCase() + field.slice(1)}Error`);
            if (inputElement) inputElement.classList.add('is-invalid');
            if (errorElement) errorElement.textContent = errors[field];
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        resetFormValidation(loginForm);
        const data = getFormData(loginForm);

        if (!data.email || !data.password) {
            displayMessage('loginMessage', 'Email dan Password wajib diisi.', 'danger');
            return;
        }

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses...';

        try {
            const response = await fetch(LOGIN_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const text = await response.text();
            let result;
            try { result = JSON.parse(text); } 
            catch { throw new Error('Respons bukan JSON'); }

            if (response.ok && result.status === 'success') {
                displayMessage('loginMessage', 'Login Berhasil! Mengarahkan ke Dashboard...', 'success');
                setTimeout(() => {
                    const userRole = result.data.user.role;
                    window.location.href = (userRole === 'admin') ? '../admin/dashboard.html' : '../anggota/dashboard.html';
                }, 1500);
            } else {
                displayMessage('loginMessage', result.message || 'Login gagal.', 'danger');
                if (result.errors) handleValidationErrors(loginForm, result.errors);
            }
        } catch (error) {
            console.error('Network Error:', error);
            displayMessage('loginMessage', 'Terjadi kesalahan jaringan atau backend.', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Masuk';
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        resetFormValidation(registerForm);
        const data = getFormData(registerForm);

        let isValid = true;
        if (!data.password || data.password.length < 6) {
            document.getElementById('regPassword').classList.add('is-invalid');
            document.getElementById('regPasswordError').textContent = 'Password minimal 6 karakter.';
            isValid = false;
        }
        if (data.password !== data.password_confirm) {
            document.getElementById('regPasswordConfirm').classList.add('is-invalid');
            document.getElementById('regPasswordConfirmError').textContent = 'Konfirmasi password tidak cocok.';
            isValid = false;
        }
        if (!isValid) {
            displayMessage('registerMessage', 'Mohon periksa data formulir Anda.', 'danger');
            return;
        }

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses...';

        try {
            const response = await fetch(REGISTER_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const text = await response.text();
            let result;
            try { result = JSON.parse(text); } 
            catch { throw new Error('Respons bukan JSON'); }

            if (response.ok && result.status === 'success') {
                displayMessage('registerMessage', 'Registrasi Berhasil! Anda dapat login sekarang.', 'success');
                setTimeout(() => {
                    const loginTab = document.getElementById('login-tab');
                    const tab = new bootstrap.Tab(loginTab);
                    tab.show();
                    registerForm.reset();
                    resetFormValidation(registerForm);
                }, 2000);
            } else {
                displayMessage('registerMessage', result.message || 'Registrasi gagal.', 'danger');
                if (result.errors) handleValidationErrors(registerForm, result.errors);
            }
        } catch (error) {
            console.error('Network Error:', error);
            displayMessage('registerMessage', 'Terjadi kesalahan jaringan atau backend.', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Daftar';
        }
    });
});
