# SIMORA - Sistem Manajemen Organisasi

##  Deskripsi Proyek
SIMORA (Sistem Manajemen Organisasi) adalah aplikasi web berbasis PHP yang dirancang untuk memudahkan pengelolaan organisasi kemahasiswaan. Sistem ini menyediakan fitur lengkap untuk manajemen anggota, event, kehadiran, dan pelaporan kegiatan organisasi.

##  Anggota Kelompok
**Kelompok 17**
1. Muhammad Anazky Putra Irwansya (2315061020)
2. Nuzaim Birri (2315061079) 
3. Dhini Vadila Sari (2315061048)
4. Al-Fachrezi Three Aditya (2315061123)

##  Fitur Utama

### Fitur Admin
- **Dashboard Admin**: Statistik organisasi, event mendatang, dan notifikasi
- **Manajemen Anggota**: 
  - Lihat daftar anggota aktif
  - Detail profil anggota lengkap
  - Ubah status keaktifan (Aktif, SP 1, SP 2, Non-Aktif)
  - Hapus anggota dengan konfirmasi
  - Persetujuan pendaftaran anggota baru
- **Manajemen Event**:
  - Buat, edit, dan hapus event
  - Upload banner event
  - Atur status event (Draft, Published, Cancelled, Completed)
  - Buka/tutup pendaftaran panitia
  - Kelola pendaftaran panitia event
- **Laporan Kegiatan**:
  - Rekapitulasi kehadiran per event
  - Statistik kehadiran (Hadir, Izin, Sakit, Alpa)
  - Lihat bukti foto presensi
  - Export laporan
- **Kalender Kegiatan**: Visualisasi event dalam tampilan kalender

### Fitur Anggota
- **Dashboard Anggota**: Event slider, upcoming events, quick stats
- **Profil**: 
  - Edit profil lengkap
  - Upload foto profil
  - Lihat status keaktifan
- **Event**:
  - Lihat daftar event
  - Detail event
  - Daftar sebagai panitia
  - Lihat status pendaftaran
- **Presensi**: 
  - Scan QR Code untuk absensi
  - Upload bukti jika izin/sakit
  - Riwayat kehadiran
- **Kalender**: Lihat jadwal event organisasi
- **Pencarian**: Cari event berdasarkan keyword

### Fitur Autentikasi
- Login dengan validasi
- Register dengan persetujuan admin
- Logout
- Session management

##  Teknologi yang Digunakan

### Backend
- **PHP 8.0+** (Native/Vanilla PHP)
- **MySQL 8.0** (Database)

### Frontend
- **HTML5**
- **CSS3** (Custom CSS + Tailwind CSS)
- **JavaScript** (JS)
- **Bootstrap 5.3.3** (UI Framework)

### Library Tambahan
- **PHPMailer** (Email Service)

##  Cara Instalasi

### Prasyarat
- **XAMPP/Laragon** (PHP 8.0+, MySQL 8.0+, Apache)
- **Web Browser** (Chrome, Firefox, Edge)
- **Git** (untuk clone repository)

### Langkah Instalasi

1. **Clone Repository**
   ```bash
   git clone https://github.com/nuzaimbirri/TUBES_PRK_PEMWEB_2025.git
   cd TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17
   ```

2. **Setup Database**
   - Buka **phpMyAdmin** atau MySQL client
   - Import file database:
     ```bash
     mysql -u root -p < ERD&SQL/db_simora.sql
     ```
   - Atau jalankan manual melalui phpMyAdmin

3. **Konfigurasi Database** (Opsional)
   - Edit file `src/backend/config/database.php`
   - Sesuaikan username dan password MySQL jika berbeda dari default

4. **Setup Email Service** (Opsional)
   - Edit file `src/backend/config/app.php`
   - Isi kredensial SMTP untuk fitur email notifikasi

5. **Konfigurasi Virtual Host** (Laragon)
   - Tambahkan di `C:\Windows\System32\drivers\etc\hosts`:
     ```
     127.0.0.1 tubes_prk_pemweb_2025.test
     ```
   - Atau akses via `localhost`:
     ```
     http://localhost/TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17/src/frontend/auth/login.html
     ```

##  Cara Menjalankan

1. **Start Server**
   - Jalankan Apache dan MySQL di XAMPP/Laragon

2. **Akses Aplikasi**
   - Login: `http://tubes_prk_pemweb_2025.test/kelompok/kelompok_17/src/frontend/auth/login.html`
   - Atau: `http://localhost/TUBES_PRK_PEMWEB_2025/kelompok/kelompok_17/src/frontend/auth/login.html`

3. **Login dengan Akun Default**
   - **Admin**:
     - Email: `admin@simora.com`
     - Password: `admin123`
   - **Anggota**: Register terlebih dahulu, tunggu persetujuan admin

##  Struktur Database

### Tabel Utama
1. **users** - Data pengguna (admin & anggota)
2. **profiles** - Profil lengkap pengguna
3. **events** - Data event/kegiatan
4. **attendance** - Data kehadiran
5. **event_registrations** - Pendaftaran panitia event

### Relasi
- `users` ← one to one → `profiles`
- `events` ← one to many → `attendance`
- `events` ← one to many → `event_registrations`
- `users` ← one to many → `attendance`
- `users` ← one to many → `event_registrations`

## 📁 Struktur Folder

```
kelompok_17/
├── ERD&SQL/
│   └── db_simora.sql          # Database schema dan seeder
├── Sreenshot/                 # Screenshot aplikasi
├── src/
│   ├── backend/
│   │   ├── api/              # API endpoints
│   │   ├── config/           # Konfigurasi aplikasi
│   │   ├── controllers/      # Controllers (MVC)
│   │   ├── core/             # Core classes (Database, Request, Response)
│   │   ├── helpers/          # Helper functions
│   │   ├── middleware/       # Middleware (Auth, Role)
│   │   ├── models/           # Models (MVC)
│   │   └── PhpMailer/        # PHPMailer library
│   ├── frontend/
│   │   ├── admin/            # Halaman admin
│   │   ├── anggota/          # Halaman anggota
│   │   └── auth/             # Halaman autentikasi
│   └── upload/               # Folder upload (profile, event, attendance)
└── README.md
```

##  Kredensial Login

### Admin
- **Email**: admin@simora.com
- **Password**: admin123

### Anggota
- Silakan register melalui halaman register
- Tunggu persetujuan dari admin
- Setelah disetujui, akan menerima email notifikasi

## 📸 Screenshot

Lihat folder `Sreenshot/` untuk tangkapan layar aplikasi:
- Dashboard Admin
- Manajemen Anggota
- Manajemen Event
- Laporan Kegiatan
- Dashboard Anggota
- Profil Anggota
- dll.


### Upload File
- **Profile Photo**: Max 2MB, format: JPG, PNG, GIF, WEBP
- **Event Banner**: Max 2MB, format: JPG, PNG, GIF, WEBP
- **Attendance Photo**: Max 2MB, format: JPG, PNG, GIF, WEBP
