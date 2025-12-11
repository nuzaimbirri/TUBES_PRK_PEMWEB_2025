CREATE DATABASE IF NOT EXISTS db_simora;
USE db_simora;

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'anggota') NOT NULL DEFAULT 'anggota',
    is_approved TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(100),
    npm VARCHAR(20) UNIQUE,
    department VARCHAR(50),
    phone_number VARCHAR(15),
    address TEXT,
    activity_status ENUM('aktif', 'sp1', 'sp2', 'non-aktif') DEFAULT 'aktif',
    profile_photo VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    banner VARCHAR(255) DEFAULT NULL, 
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NULL,
    location VARCHAR(100),
    status ENUM('draft', 'published', 'cancelled', 'completed') DEFAULT 'draft',
    open_registration TINYINT(1) DEFAULT 0,
    registration_deadline DATETIME DEFAULT NULL,
    max_participants INT DEFAULT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('hadir', 'izin', 'sakit', 'alpa') DEFAULT 'hadir',
    notes TEXT,
    photo VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (event_id, user_id) 
);

CREATE TABLE IF NOT EXISTS event_registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    division VARCHAR(50) DEFAULT NULL,
    reason TEXT,
    experience TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_notes TEXT DEFAULT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (event_id, user_id)
);

INSERT INTO users (username, email, password, role, is_approved) 
VALUES ('admin', 'admin@simora.com', '$2y$10$PKOr10iKzojO7XD1j3EU4OsnmU.uGhzzhtmGCgMXXs16sDUJvazEi', 'admin', 1);

INSERT INTO profiles (user_id, full_name, department, activity_status)
VALUES (1, 'Super Admin', 'Inti', 'aktif');

SELECT 'Database SIMORA berhasil dibuat!' AS status;



