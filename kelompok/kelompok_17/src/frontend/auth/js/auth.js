document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // KONFIGURASI PATH API
    // Path ini relatif terhadap file HTML (login_register.html)
    // Naik 2 level (ke folder src) -> masuk backend -> masuk api
    const BASE_API_URL = '../../backend/api/auth.php';  
    const LOGIN_API_URL = `${BASE_API_URL}?action=login`;
    const REGISTER_API_URL = `${BASE_API_URL}?action=register`;

    const displayMessage = (elementId, message, type) => {
        const alertElement = document.getElementById(elementId);
        if (alertElement) {
            alertElement.classList.remove('d-none', 'alert-danger', 'alert-success', 'alert-warning');
            alertElement.classList.add(`alert-${type}`);
            alertElement.textContent = message;
        }
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
        
        // Bersihkan text error
        form.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
    }

    // Helper untuk mengubah snake_case ke CamelCase (contoh: password_confirm -> PasswordConfirm)
    // Ini diperlukan karena ID di HTML pakai CamelCase (regPasswordConfirm), tapi API kirim snake_case
    const toCamelCase = (str) => {
        return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    };

    const handleValidationErrors = (form, errors) => {
        const prefix = form.id.startsWith('login') ? 'login' : 'reg';
        
        for (const field in errors) {
            // Cari inputnya
            const inputElement = form.querySelector(`[name="${field}"]`);
            
            // Generate ID error element (contoh: regPasswordConfirmError)
            const fieldCamel = toCamelCase(field); 
            const capitalizedField = fieldCamel.charAt(0).toUpperCase() + fieldCamel.slice(1);
            const errorElementId = `${prefix}${capitalizedField}Error`;
            const errorElement = document.getElementById(errorElementId);

            if (inputElement) inputElement.classList.add('is-invalid');
            if (errorElement) errorElement.textContent = errors[field];
        }
    }

    // -------------------------------------------------------------------------
    // LOGIN HANDLER
    // -------------------------------------------------------------------------
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
                credentials: 'include', // PENTING: Agar cookie sesi disimpan
                body: JSON.stringify(data)
            });

            const text = await response.text();
            let result;
            try { 
                result = JSON.parse(text); 
            } catch (err) { 
                console.error('Response Text:', text);
                throw new Error('Respons server bukan JSON valid'); 
            }

            if (response.ok && result.status === 'success') {
                displayMessage('loginMessage', 'Login Berhasil! Mengarahkan ke Dashboard...', 'success');
                
                // Redirect berdasarkan role
                setTimeout(() => {
                    const userRole = result.data.user.role;
                    // Path redirect relatif terhadap file login_register.html
                    if (userRole === 'admin') {
                        window.location.href = '../admin/dashboard.html';
                    } else {
                        window.location.href = '../anggota/dashboard.html';
                    }
                }, 1500);
            } else {
                displayMessage('loginMessage', result.message || 'Login gagal.', 'danger');
                if (result.errors) handleValidationErrors(loginForm, result.errors);
            }
        } catch (error) {
            console.error('Login Error:', error);
            displayMessage('loginMessage', 'Terjadi kesalahan jaringan atau backend. Cek Console.', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Masuk';
        }
    });

    // -------------------------------------------------------------------------
    // REGISTER HANDLER
    // -------------------------------------------------------------------------
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        resetFormValidation(registerForm);
        const data = getFormData(registerForm);

        // Validasi Frontend Sederhana
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
                credentials: 'include', // PENTING: Agar cookie sesi disimpan (jika auto-login)
                body: JSON.stringify(data)
            });

            const text = await response.text();
            let result;
            try { 
                result = JSON.parse(text); 
            } catch (err) { 
                console.error('Response Text:', text);
                throw new Error('Respons server bukan JSON valid'); 
            }

            if (response.ok && result.status === 'success') { // Biasanya 201 Created
                displayMessage('registerMessage', 'Registrasi Berhasil! Silakan login.', 'success');
                setTimeout(() => {
                    // Pindah tab ke Login secara otomatis
                    const loginTabBtn = document.querySelector('#login-tab');
                    const loginTab = new bootstrap.Tab(loginTabBtn);
                    loginTab.show();
                    
                    registerForm.reset();
                    resetFormValidation(registerForm);
                }, 2000);
            } else {
                displayMessage('registerMessage', result.message || 'Registrasi gagal.', 'danger');
                if (result.errors) handleValidationErrors(registerForm, result.errors);
            }
        } catch (error) {
            console.error('Register Error:', error);
            displayMessage('registerMessage', 'Terjadi kesalahan jaringan atau backend. Cek Console.', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Daftar';
        }
    });
});