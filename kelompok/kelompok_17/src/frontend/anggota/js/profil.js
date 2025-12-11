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
    let currentUser = null;
    let currentProfile = null;
    const modalManager = {
        editProfile: {
            overlay: document.getElementById('modalOverlay'),
            modal: document.getElementById('editProfileModal'),
            form: document.getElementById('editProfileForm'),
            close: document.getElementById('modalClose'),
            cancel: document.getElementById('modalCancel'),
            submit: document.querySelector('#editProfileModal button[type="submit"]')
        },
        changePassword: {
            modal: document.getElementById('changePasswordModal'),
            form: document.getElementById('changePasswordForm'),
            close: document.getElementById('passwordModalClose'),
            cancel: document.getElementById('passwordCancel'),
            submit: document.querySelector('#changePasswordModal button[type="submit"]')
        }
    };
    const openModal = (key) => {
        const modal = modalManager[key];
        if (modal.overlay) modal.overlay.classList.add('active');
        modal.modal.classList.add('active');
    };
    const closeModal = (key) => {
        const modal = modalManager[key];
        if (modal.overlay) modal.overlay.classList.remove('active');
        modal.modal.classList.remove('active');
    };
    const checkAuth = async () => {
        try {
            console.log(' Checking authentication...');
            const response = await fetch(`${API_BASE}/auth.php?action=me`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();
            if (!response.ok || result.status !== 'success') {
                console.error(' Auth failed');
                window.location.href = LOGIN_PAGE;
                return null;
            }
            console.log(' Auth successful');
            currentUser = result.data;
            return currentUser;
        } catch (error) {
            console.error(' Auth Error:', error);
            window.location.href = LOGIN_PAGE;
            return null;
        }
    };
    const loadProfile = async () => {
        try {
            console.log('� Loading profile data...');
            const response = await fetch(`${API_BASE}/profile.php?action=me`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();
            if (!response.ok || result.status !== 'success') {
                console.error(' Failed to load profile:', result.message);
                return null;
            }
            currentProfile = result.data;
            console.log(' Profile loaded:', currentProfile);
            return currentProfile;
        } catch (error) {
            console.error(' Load Profile Error:', error);
            return null;
        }
    };
    const displayProfile = (user, profile) => {
        document.getElementById('navUsername').textContent = profile?.full_name || user.username;
        const initials = (profile?.full_name || user.username)
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
        document.getElementById('userInitials').textContent = initials;
        document.getElementById('profileInitials').textContent = initials;
        document.getElementById('profileFullName').textContent = profile?.full_name || user.username;
        document.getElementById('profileNPM').textContent = profile?.npm || '-';
        const statusMap = {
            'aktif': 'status-aktif',
            'sp1': 'status-sp1',
            'sp2': 'status-sp2',
            'non-aktif': 'status-inactive'
        };
        const statusElement = document.getElementById('profileStatus');
        if (profile?.activity_status) {
            const statusKey = profile.activity_status.toLowerCase();
            statusElement.innerHTML = `<span class="status-badge ${statusMap[statusKey] || 'status-inactive'}">${profile.activity_status}</span>`;
        }
        document.getElementById('infoFullName').textContent = profile?.full_name || '-';
        document.getElementById('infoEmail').textContent = user.email || '-';
        document.getElementById('infoPhone').textContent = profile?.phone_number || '-';
        document.getElementById('infoAddress').textContent = profile?.address || '-';
        document.getElementById('infoNPM').textContent = profile?.npm || '-';
        document.getElementById('infoDepartment').textContent = profile?.department || '-';
        const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-';
        document.getElementById('infoJoinDate').textContent = joinDate;
        const activityStatusMap = {
            'aktif': 'Aktif',
            'sp1': 'SP 1',
            'sp2': 'SP 2',
            'non-aktif': 'Non-Aktif'
        };
        const activityStatus = activityStatusMap[profile?.activity_status?.toLowerCase()] || profile?.activity_status || '-';
        document.getElementById('infoActivityStatus').textContent = activityStatus;
        document.getElementById('formFullName').value = profile?.full_name || '';
        document.getElementById('formPhone').value = profile?.phone_number || '';
        document.getElementById('formAddress').value = profile?.address || '';
        document.getElementById('formDepartment').value = profile?.department || '';
        if (profile?.profile_photo) {
            const photoUrl = `${UPLOAD_BASE}/profile/${profile.profile_photo}`;
            const photoImage = document.getElementById('photoImage');
            const photoPlaceholder = document.getElementById('photoPlaceholder');
            if (photoImage) {
                photoImage.src = photoUrl;
                photoImage.style.display = 'block';
                if (photoPlaceholder) photoPlaceholder.style.display = 'none';
            }
            updateAvatarWithPhoto(photoUrl);
        }
    };
    const updateAvatarWithPhoto = (photoUrl) => {
        const userAvatar = document.getElementById('userAvatar');
        const profileAvatarLarge = document.getElementById('profileAvatarLarge');
        if (userAvatar) {
            userAvatar.innerHTML = `<img src="${photoUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        }
        if (profileAvatarLarge) {
            profileAvatarLarge.innerHTML = `<img src="${photoUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        }
    };
    const loadAttendanceStats = async () => {
        try {
            console.log('� Loading attendance statistics...');
            const response = await fetch(`${API_BASE}/attendance.php?action=statistics`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();
            if (response.ok && result.status === 'success') {
                const stats = result.data;
                const total = stats.total || 0;
                animateValue('statHadir', 0, stats.hadir || 0, 800);
                animateValue('statIzin', 0, stats.izin || 0, 800);
                animateValue('statSakit', 0, stats.sakit || 0, 800);
                animateValue('statAlpa', 0, stats.alpha || 0, 800);
                if (total > 0) {
                    const haidirPercent = (stats.hadir / total) * 100;
                    const izinPercent = (stats.izin / total) * 100;
                    const sakitPercent = (stats.sakit / total) * 100;
                    const alpaPercent = (stats.alpha / total) * 100;
                    document.getElementById('progressHadir').style.width = haidirPercent + '%';
                    document.getElementById('progressIzin').style.width = izinPercent + '%';
                    document.getElementById('progressSakit').style.width = sakitPercent + '%';
                    document.getElementById('progressAlpa').style.width = alpaPercent + '%';
                }
                console.log(' Attendance stats loaded');
            }
        } catch (error) {
            console.error(' Error loading attendance stats:', error);
        }
    };
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
            element.textContent = current.toString();
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        };
        requestAnimationFrame(updateValue);
    };
    const initEditProfileHandler = () => {
        const btnEdit = document.getElementById('btnEditProfile');
        btnEdit?.addEventListener('click', () => {
            openModal('editProfile');
        });
        modalManager.editProfile.close?.addEventListener('click', () => closeModal('editProfile'));
        modalManager.editProfile.cancel?.addEventListener('click', () => closeModal('editProfile'));
        modalManager.editProfile.overlay?.addEventListener('click', (e) => {
            if (e.target === modalManager.editProfile.overlay) closeModal('editProfile');
        });
        modalManager.editProfile.form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('formFullName').value.trim();
            const phone = document.getElementById('formPhone').value.trim();
            const address = document.getElementById('formAddress').value.trim();
            const department = document.getElementById('formDepartment').value.trim();
            if (!fullName) {
                showMessage('formMessage', 'Nama lengkap tidak boleh kosong', 'error');
                return;
            }
            try {
                const submitBtn = modalManager.editProfile.submit;
                const originalText = submitBtn?.textContent;
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Menyimpan...';
                }
                const response = await fetch(`${API_BASE}/profile.php?action=update`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        full_name: fullName,
                        phone_number: phone || null,
                        address: address || null,
                        department: department || null
                    })
                });
                const result = await response.json();
                if (response.ok && result.status === 'success') {
                    showMessage('formMessage', 'Profil berhasil diperbarui', 'success');
                    setTimeout(async () => {
                        await loadProfile();
                        displayProfile(currentUser, currentProfile);
                        closeModal('editProfile');
                    }, 1500);
                } else {
                    showMessage('formMessage', result.message || 'Gagal memperbarui profil', 'error');
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            } catch (error) {
                console.error(' Edit Profile Error:', error);
                showMessage('formMessage', 'Terjadi kesalahan: ' + error.message, 'error');
                const submitBtn = modalManager.editProfile.submit;
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Simpan Perubahan';
                }
            }
        });
    };
    const initChangePasswordHandler = () => {
        const btnChange = document.getElementById('btnChangePassword');
        btnChange?.addEventListener('click', () => {
            openModal('changePassword');
        });
        modalManager.changePassword.close?.addEventListener('click', () => closeModal('changePassword'));
        modalManager.changePassword.cancel?.addEventListener('click', () => closeModal('changePassword'));
        modalManager.changePassword.form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPassword = document.getElementById('formOldPassword').value;
            const newPassword = document.getElementById('formNewPassword').value;
            const confirmPassword = document.getElementById('formConfirmPassword').value;
            if (!oldPassword || !newPassword || !confirmPassword) {
                showMessage('passwordMessage', 'Semua field harus diisi', 'error');
                return;
            }
            if (newPassword.length < 6) {
                showMessage('passwordMessage', 'Password baru minimal 6 karakter', 'error');
                return;
            }
            if (newPassword !== confirmPassword) {
                showMessage('passwordMessage', 'Konfirmasi password tidak cocok', 'error');
                return;
            }
            try {
                const submitBtn = modalManager.changePassword.submit;
                const originalText = submitBtn?.textContent;
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Mengubah...';
                }
                const response = await fetch(`${API_BASE}/auth.php?action=change-password`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        current_password: oldPassword,
                        new_password: newPassword
                    })
                });
                const result = await response.json();
                if (response.ok && result.status === 'success') {
                    showMessage('passwordMessage', 'Password berhasil diubah', 'success');
                    setTimeout(() => {
                        document.getElementById('changePasswordForm').reset();
                        closeModal('changePassword');
                    }, 1500);
                } else {
                    showMessage('passwordMessage', result.message || 'Gagal mengubah password', 'error');
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            } catch (error) {
                console.error(' Change Password Error:', error);
                showMessage('passwordMessage', 'Terjadi kesalahan: ' + error.message, 'error');
                const submitBtn = modalManager.changePassword.submit;
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Ubah Password';
                }
            }
        });
    };
    const showMessage = (elementId, message, type) => {
        const element = document.getElementById(elementId);
        if (!element) return;
        element.className = `alert alert-${type}`;
        element.textContent = message;
        element.style.display = 'block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    };
    const initPhotoUploadHandler = () => {
        const photoInput = document.getElementById('photoInput');
        const photoPreview = document.getElementById('photoPreview');
        const photoImage = document.getElementById('photoImage');
        const photoPlaceholder = document.getElementById('photoPlaceholder');
        let selectedFile = null;
        let previewDataUrl = null;
        photoInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                alert('Format file tidak valid. Gunakan JPG, PNG, GIF, atau WebP');
                photoInput.value = '';
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                alert('Ukuran file terlalu besar. Maksimal 2MB');
                photoInput.value = '';
                return;
            }
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = (ev) => {
                previewDataUrl = ev.target.result;
                showPhotoConfirmModal(previewDataUrl);
            };
            reader.readAsDataURL(file);
        });
        const showPhotoConfirmModal = (previewUrl) => {
            let modal = document.getElementById('photoConfirmModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'photoConfirmModal';
                modal.className = 'photo-confirm-overlay';
                document.body.appendChild(modal);
            }
            modal.innerHTML = `
                <div class="photo-confirm-modal">
                    <div class="photo-confirm-header">
                        <h3>Konfirmasi Foto Profil</h3>
                        <button class="photo-confirm-close" id="photoModalClose">&times;</button>
                    </div>
                    <div class="photo-confirm-body">
                        <p>Apakah Anda yakin ingin mengubah foto profil?</p>
                        <div class="photo-confirm-preview">
                            <img src="${previewUrl}" alt="Preview">
                        </div>
                    </div>
                    <div class="photo-confirm-footer">
                        <button class="btn-cancel" id="photoModalCancel">Batal</button>
                        <button class="btn-confirm" id="photoModalConfirm">Ya, Ubah Foto</button>
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            const closePhotoModal = () => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
                photoInput.value = '';
                selectedFile = null;
                previewDataUrl = null;
            };
            document.getElementById('photoModalClose').addEventListener('click', closePhotoModal);
            document.getElementById('photoModalCancel').addEventListener('click', closePhotoModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closePhotoModal();
            });
            document.getElementById('photoModalConfirm').addEventListener('click', async () => {
                if (!selectedFile) return;
                const confirmBtn = document.getElementById('photoModalConfirm');
                confirmBtn.disabled = true;
                confirmBtn.textContent = 'Mengupload...';
                try {
                    const formData = new FormData();
                    formData.append('photo', selectedFile);
                    const uploadResponse = await fetch(`${API_BASE}/profile.php?action=upload-photo`, {
                        method: 'POST',
                        credentials: 'include',
                        body: formData
                    });
                    const result = await uploadResponse.json();
                    if (uploadResponse.ok && result.status === 'success') {
                        if (photoImage) {
                            photoImage.src = previewDataUrl;
                            photoImage.style.display = 'block';
                        }
                        if (photoPlaceholder) {
                            photoPlaceholder.style.display = 'none';
                        }
                        if (result.data?.photo || result.data?.filename) {
                            const photoFilename = result.data.photo || result.data.filename;
                            const photoUrl = `${UPLOAD_BASE}/profile/${photoFilename}`;
                            updateAvatarWithPhoto(photoUrl);
                            currentProfile = currentProfile || {};
                            currentProfile.profile_photo = photoFilename;
                        }
                        modal.style.display = 'none';
                        document.body.style.overflow = '';
                        alert('Foto profil berhasil diubah!');
                    } else {
                        alert(result.message || 'Gagal mengupload foto');
                    }
                } catch (error) {
                    console.error('Photo Upload Error:', error);
                    alert('Terjadi kesalahan saat mengupload foto');
                }
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Ya, Ubah Foto';
                photoInput.value = '';
                selectedFile = null;
                previewDataUrl = null;
            });
        };
        if (currentProfile?.profile_photo) {
            const photoUrl = `${UPLOAD_BASE}/profile/${currentProfile.profile_photo}`;
            photoImage.src = photoUrl;
            photoImage.style.display = 'block';
            photoPlaceholder.style.display = 'none';
            updateAvatarWithPhoto(photoUrl);
        }
    };
    const initLogout = () => {
        console.log(' Logout will be handled by logout-helper.js');
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
    try {
        const user = await checkAuth();
        if (!user) return;
        const profile = await loadProfile();
        if (profile) {
            displayProfile(user, profile);
            await loadAttendanceStats();
        }
        initEditProfileHandler();
        initChangePasswordHandler();
        initPhotoUploadHandler();
        initLogout();
        initMobileNav();
        console.log(' Profile page initialized successfully');
    } catch (error) {
        console.error(' Initialization Error:', error);
    }
});
