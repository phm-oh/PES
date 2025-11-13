-- เพิ่ม fields phone และ position สำหรับ users table
-- รันคำสั่งนี้เพื่อแก้ไข profile editing issue

USE pes;

ALTER TABLE users
ADD COLUMN phone VARCHAR(20) NULL AFTER email,
ADD COLUMN position VARCHAR(255) NULL AFTER phone;

-- ตรวจสอบว่าเพิ่มสำเร็จ
DESCRIBE users;
