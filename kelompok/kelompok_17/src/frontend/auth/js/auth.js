document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const BASE_API_URL = 'http://localhost/TUBES PPW/TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17/src/backend/api/auth.php'
    const LOGIN_API_URL = `${BASE_API_URL}?action=login`;
    const REGISTER_API_URL = `${BASE_API_URL}?action=register`;

    const displayMessage = (id, message, type) => {
        const el = document.getElementById(id);
        el.classList.remove('d-none', 'alert-danger', 'alert-success');
        el.classList.add(`alert-${type}`);
        el.textContent = message;
    };

    const resetErrors = (form) => {
        form.querySelectorAll('.is-invalid')
            .forEach(el => el.classList.remove('is-invalid'));

        const msgID = form.id.replace("Form", "Message");
        const msg = document.getElementById(msgID);
        if (msg) msg.classList.add('d-none');
    };

    const capitalize = (str) =>
        str.charAt(0).toUpperCase() + str.slice(1);

    const handleValidationErrors = (form, errors, prefix) => {
        for (const field in errors) {
            const input = form.querySelector(`[name="${field}"]`);
            const errorLabel = document.getElementById(
                `${prefix}${capitalize(field)}Error`
            );

            if (input) input.classList.add('is-invalid');
            if (errorLabel) errorLabel.textContent = errors[field];
        }
    };

    const toggleButton = (btn, state, normalText, loadingText) => {
        btn.disabled = state;
        btn.textContent = state ? loadingText : normalText;
    };


    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            resetErrors(loginForm);

            const formData = new FormData(loginForm);

            const btn = loginForm.querySelector("button");
            toggleButton(btn, true, "Masuk", "Memproses...");

            try {
                const response = await fetch(LOGIN_API_URL, {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();

                if (result.status === "success") {

                    displayMessage(
                        "loginMessage",
                        "Login berhasil! Mengarahkan...",
                        "success"
                    );

                    setTimeout(() => {
                        window.location.href =
                            result.data.user.role === "admin"
                                ? "admin/dashboard.html"
                                : "anggota/dashboard.html";
                    }, 1200);

                } else {
                    displayMessage("loginMessage", result.message, "danger");

                    if (result.errors) {
                        handleValidationErrors(loginForm, result.errors, "login");
                    }
                }

            } catch (err) {
                displayMessage(
                    "loginMessage",
                    "Kesalahan jaringan / server tidak merespon.",
                    "danger"
                );
            }

            toggleButton(btn, false, "Masuk", "Memproses...");
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            resetErrors(registerForm);

            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            let valid = true;

            if (data.password.length < 6) {
                document.getElementById("regPassword").classList.add("is-invalid");
                document.getElementById("regPasswordError").textContent =
                    "Minimal 6 karakter.";
                valid = false;
            }

            if (data.password !== data.password_confirm) {
                document.getElementById("regPasswordConfirm").classList.add("is-invalid");
                document.getElementById("regPasswordConfirmError").textContent =
                    "Password tidak cocok.";
                valid = false;
            }

            if (!valid) return;

            const btn = registerForm.querySelector("button");
            toggleButton(btn, true, "Daftar", "Memproses...");

            try {
                const response = await fetch(REGISTER_API_URL, {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();

                if (result.status === "success") {

                    displayMessage(
                        "registerMessage",
                        "Registrasi berhasil! Silakan login.",
                        "success"
                    );

                    setTimeout(() => {
                        window.location.href = "login.html";
                    }, 1800);

                } else {

                    displayMessage("registerMessage", result.message, "danger");

                    if (result.errors) {
                        handleValidationErrors(registerForm, result.errors, "reg");
                    }
                }

            } catch (err) {
                displayMessage(
                    "registerMessage",
                    "Kesalahan jaringan / server tidak merespon.",
                    "danger"
                );
            }

            toggleButton(btn, false, "Daftar", "Memproses...");
        });
    }

});
