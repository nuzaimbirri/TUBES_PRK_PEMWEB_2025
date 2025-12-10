CREATE DATABASE db_simora;
USE db_simora;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'anggota') NOT NULL DEFAULT 'anggota',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE users
ADD COLUMN is_approved TINYINT(1) NOT NULL DEFAULT 0 AFTER role;

CREATE TABLE profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    npm VARCHAR(20) UNIQUE,
    department VARCHAR(50),
    phone_number VARCHAR(15),
    address TEXT,
    activity_status ENUM('aktif', 'sp1', 'sp2', 'non-aktif') DEFAULT 'aktif',
    profile_photo VARCHAR(255) DEFAULT 'default.jpg',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    banner VARCHAR(255) DEFAULT 'default.jpg', 
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(100),
    status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);


CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('hadir', 'izin', 'sakit', 'alpa') DEFAULT 'hadir',
    notes TEXT,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (event_id, user_id) 
);



INSERT INTO users (username, email, password, role) 
VALUES ('admin', 'admin@simora.com', '$2y$10$kFXheGvJM5FNOsOGmgrcnuMo9jf5Ee8R21y1ip0yKmB3VWRk8oViS', 'admin');

-- UPDATE STATUS ADMIN MENJADI AKTIF (1)
UPDATE users 
SET is_approved = 1
WHERE email = 'admin@simora.com';

INSERT INTO profiles (user_id, full_name, department, activity_status)
VALUES (1, 'Super Admin', 'Inti', 'aktif');

INSERT INTO users (username, email, password, role) 
VALUES ('admin2', 'admin2@simora.com', '$2y$10$tM2yqK0K0N9FvR0R3O3Iq.mB8fK7B2N2E4X4b4g7I3S4g4x5', 'admin');


INSERT INTO profiles (user_id, full_name, department, activity_status)
VALUES (2, 'Second Administrator', 'Inti', 'aktif');



