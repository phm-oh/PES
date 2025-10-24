-- ============================================================================
-- SCHEMA.SQL - ระบบประเมินบุคลากร (สมบูรณ์)
-- สำหรับการแข่งขันทักษะ ปวช. - ระบบประเมินบุคลากร
-- ============================================================================
-- 
-- 📋 โครงสร้าง:
-- ✅ = มีใน Template อยู่แล้ว
-- 🆕 = เพิ่มใหม่เพื่อให้ครบตามเกณฑ์การแข่งขัน
-- 
-- Updated: 2025-10-22
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

-- สร้าง Database
CREATE DATABASE IF NOT EXISTS skills_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE skills_db;

-- ============================================================================
-- DROP TABLES (ลำดับสำคัญ - ต้อง drop ตาราง child ก่อน parent)
-- ============================================================================

-- 🆕 DROP ตารางเพิ่มเติม
DROP TABLE IF EXISTS evaluator_comments;
DROP TABLE IF EXISTS signatures;

-- ✅ DROP ตารางเดิม
DROP TABLE IF EXISTS v_evidence_progress;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS evaluation_results;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS indicator_evidence;
DROP TABLE IF EXISTS evidence_types;
DROP TABLE IF EXISTS indicators;
DROP TABLE IF EXISTS evaluation_topics;
DROP TABLE IF EXISTS evaluation_periods;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS dept_fields;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS org_groups;
DROP TABLE IF EXISTS vocational_fields;
DROP TABLE IF EXISTS vocational_categories;

SET FOREIGN_KEY_CHECKS=1;

-- ============================================================================
-- ✅ ตารางพื้นฐาน (มีใน Template แล้ว)
-- ============================================================================

-- ตารางหมวดหมู่สาขาวิชา
CREATE TABLE vocational_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ตารางสาขาวิชา
CREATE TABLE vocational_fields (
  code VARCHAR(10) PRIMARY KEY,
  name_th VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  CONSTRAINT fk_vf_cat
    FOREIGN KEY (category_id) REFERENCES vocational_categories(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ตารางกลุ่มองค์กร
CREATE TABLE org_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- ตารางแผนก
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  org_group_id INT NOT NULL,
  CONSTRAINT fk_dept_cat
    FOREIGN KEY (category_id) REFERENCES vocational_categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_dept_org
    FOREIGN KEY (org_group_id) REFERENCES org_groups(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ตารางเชื่อมโยงแผนก-สาขาวิชา
CREATE TABLE dept_fields (
  dept_id INT NOT NULL,
  field_code VARCHAR(10) NOT NULL,
  PRIMARY KEY (dept_id, field_code),
  CONSTRAINT fk_df_dept
    FOREIGN KEY (dept_id) REFERENCES departments(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_df_field
    FOREIGN KEY (field_code) REFERENCES vocational_fields(code)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- ✅ ตารางผู้ใช้ (มีใน Template แล้ว)
-- ============================================================================

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name_th VARCHAR(255) NOT NULL,
  role ENUM('admin','evaluator','evaluatee') NOT NULL,
  status ENUM('active','disabled') NOT NULL DEFAULT 'active',
  department_id INT NULL,
  org_group_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_dept
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_users_org
    FOREIGN KEY (org_group_id) REFERENCES org_groups(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_dept ON users(department_id);

-- ============================================================================
-- ✅ ตารางรอบการประเมิน (มีใน Template แล้ว)
-- ============================================================================

CREATE TABLE evaluation_periods (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL,
  buddhist_year INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_periods_active ON evaluation_periods(is_active);
CREATE INDEX idx_periods_year ON evaluation_periods(buddhist_year);

-- ============================================================================
-- ✅ ตารางหัวข้อการประเมิน (มีใน Template แล้ว)
-- ============================================================================

CREATE TABLE evaluation_topics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  title_th VARCHAR(255) NOT NULL,
  description TEXT NULL,
  weight DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- ✅ ตารางตัวชี้วัด (มีใน Template แล้ว)
-- ============================================================================

CREATE TABLE indicators (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  topic_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL,
  description TEXT NULL,
  type ENUM('score_1_4','yes_no','file_url') NOT NULL DEFAULT 'score_1_4',
  weight DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  min_score TINYINT NOT NULL DEFAULT 1,
  max_score TINYINT NOT NULL DEFAULT 4,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ind_topic
    FOREIGN KEY (topic_id) REFERENCES evaluation_topics(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  KEY idx_ind_topic (topic_id)
) ENGINE=InnoDB;

-- ============================================================================
-- ✅ ตารางชนิดหลักฐาน (มีใน Template แล้ว)
-- ============================================================================

CREATE TABLE evidence_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- ✅ ตารางเชื่อมโยงตัวชี้วัด-หลักฐาน (มีใน Template แล้ว)
-- ============================================================================

CREATE TABLE indicator_evidence (
  indicator_id BIGINT UNSIGNED NOT NULL,
  evidence_type_id INT NOT NULL,
  PRIMARY KEY (indicator_id, evidence_type_id),
  CONSTRAINT fk_ie_ind
    FOREIGN KEY (indicator_id) REFERENCES indicators(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ie_ev
    FOREIGN KEY (evidence_type_id) REFERENCES evidence_types(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- ✅ ตารางมอบหมายกรรมการ (มีใน Template แล้ว)
-- ============================================================================

CREATE TABLE assignments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_id BIGINT UNSIGNED NOT NULL,
  evaluator_id BIGINT UNSIGNED NOT NULL,
  evaluatee_id BIGINT UNSIGNED NOT NULL,
  role_type ENUM('chairman','member') NOT NULL DEFAULT 'member',  -- เพิ่มบทบาท
  dept_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_assign_period
    FOREIGN KEY (period_id) REFERENCES evaluation_periods(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_assign_evaluator
    FOREIGN KEY (evaluator_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_assign_evaluatee
    FOREIGN KEY (evaluatee_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_assign_dept
    FOREIGN KEY (dept_id) REFERENCES departments(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  KEY idx_assign_evaluator (evaluator_id, period_id),
  KEY idx_assign_evaluatee (evaluatee_id, period_id),
  UNIQUE KEY uk_assign (period_id, evaluator_id, evaluatee_id)
) ENGINE=InnoDB;

-- ============================================================================
-- ✅ ตารางผลการประเมิน (มีใน Template แล้ว)
-- ============================================================================

CREATE TABLE evaluation_results (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_id BIGINT UNSIGNED NOT NULL,
  evaluatee_id BIGINT UNSIGNED NOT NULL,
  indicator_id BIGINT UNSIGNED NOT NULL,
  
  -- คะแนนประเมินตนเอง
  self_score DECIMAL(5,2) NULL,
  self_note TEXT NULL,
  self_submitted_at TIMESTAMP NULL,
  
  -- คะแนนจากกรรมการ
  evaluator_score DECIMAL(5,2) NULL,
  evaluator_id BIGINT UNSIGNED NULL,
  evaluator_note TEXT NULL,
  evaluated_at TIMESTAMP NULL,
  
  -- สถานะ
  status ENUM('draft','submitted','evaluated','approved') NOT NULL DEFAULT 'draft',
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_results_period
    FOREIGN KEY (period_id) REFERENCES evaluation_periods(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_results_evaluatee
    FOREIGN KEY (evaluatee_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_results_evaluator
    FOREIGN KEY (evaluator_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_results_indicator
    FOREIGN KEY (indicator_id) REFERENCES indicators(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  KEY idx_results_evale (evaluatee_id, period_id),
  KEY idx_results_indicator (indicator_id),
  KEY idx_results_status (status),
  UNIQUE KEY uk_results (period_id, evaluatee_id, indicator_id)
) ENGINE=InnoDB;

-- ============================================================================
-- ✅ ตารางไฟล์แนบหลักฐาน (มีใน Template แล้ว)
-- ============================================================================

CREATE TABLE attachments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_id BIGINT UNSIGNED NOT NULL,
  evaluatee_id BIGINT UNSIGNED NOT NULL,
  indicator_id BIGINT UNSIGNED NOT NULL,
  evidence_type_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  storage_path VARCHAR(1024) NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_att_period
    FOREIGN KEY (period_id) REFERENCES evaluation_periods(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_att_evale
    FOREIGN KEY (evaluatee_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_att_ind
    FOREIGN KEY (indicator_id) REFERENCES indicators(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_att_evtype
    FOREIGN KEY (evidence_type_id) REFERENCES evidence_types(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  KEY idx_attach_evale (evaluatee_id, period_id),
  KEY idx_attach_indicator (indicator_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 🆕 ตารางลายเซ็นดิจิทัล (เพิ่มใหม่)
-- สำหรับกรรมการลงนามผลการประเมิน
-- ============================================================================

CREATE TABLE signatures (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  result_id BIGINT UNSIGNED NOT NULL,
  evaluator_id BIGINT UNSIGNED NOT NULL,
  signature_data TEXT NOT NULL,      -- base64 ของรูปลายเซ็น
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sig_result
    FOREIGN KEY (result_id) REFERENCES evaluation_results(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_sig_evaluator
    FOREIGN KEY (evaluator_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  KEY idx_sig_result (result_id),
  UNIQUE KEY uk_sig (result_id, evaluator_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 🆕 ตารางความคิดเห็นของกรรมการ (เพิ่มใหม่)
-- สำหรับกรรมการให้ความคิดเห็นสรุปการประเมิน
-- ============================================================================

CREATE TABLE evaluator_comments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_id BIGINT UNSIGNED NOT NULL,
  evaluatee_id BIGINT UNSIGNED NOT NULL,
  evaluator_id BIGINT UNSIGNED NOT NULL,
  comment_text TEXT NOT NULL,
  comment_type ENUM('general','strength','improvement') NOT NULL DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_comment_period
    FOREIGN KEY (period_id) REFERENCES evaluation_periods(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_comment_evaluatee
    FOREIGN KEY (evaluatee_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_comment_evaluator
    FOREIGN KEY (evaluator_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  KEY idx_comment_evaluatee (evaluatee_id, period_id),
  KEY idx_comment_evaluator (evaluator_id, period_id)
) ENGINE=InnoDB;

-- ============================================================================
-- SEED DATA (ข้อมูลตัวอย่าง)
-- ============================================================================

-- Categories
INSERT INTO vocational_categories (code, name_th) VALUES
('CAT01','อุตสาหกรรม'),
('CAT02','บริหารธุรกิจ'),
('CAT03','ศิลปกรรมและเศรษฐกิจสร้างสรรค์'),
('CAT04','คหกรรม'),
('CAT05','เกษตรกรรมและประมง'),
('CAT06','อุตสาหกรรมท่องเที่ยว'),
('CAT07','อุตสาหกรรมแฟชั่นและสิ่งทอ'),
('CAT08','อุตสาหกรรมดิจิทัลและเทคโนโลยีสารสนเทศ'),
('CAT09','โลจิสติกส์'),
('CAT10','อุตสาหกรรมสุขภาพและความงาม'),
('CAT11','อุตสาหกรรมบันเทิง');

-- Fields (สาขาวิชา - ตัวอย่าง)
INSERT INTO vocational_fields (code, name_th, category_id) VALUES
('IT01','เทคโนโลยีสารสนเทศ',8),
('CP01','คอมพิวเตอร์โปรแกรมเมอร์',8),
('MM01','มัลติมีเดีย',8),
('BA01','การบัญชี',2),
('MK01','การตลาด',2);

-- Org Groups
INSERT INTO org_groups (code, name_th) VALUES
('ORG01','ฝ่ายวิชาการ'),
('ORG02','ฝ่ายบริหาร'),
('ORG03','ฝ่ายปกครอง');

-- Departments
INSERT INTO departments (code, name_th, category_id, org_group_id) VALUES
('DEPT01','แผนกเทคโนโลยีสารสนเทศ',8,1),
('DEPT02','แผนกบริหารธุรกิจ',2,1),
('DEPT03','แผนกบริหารงานทั่วไป',2,2);

-- Users (รหัสผ่านทั้งหมด: password123 - hash bcrypt 10 rounds)
-- $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (email, password_hash, name_th, role, status, department_id) VALUES
-- Admin
('admin@ccollege.ac.th', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ผู้ดูแลระบบ', 'admin', 'active', 1),

-- Evaluators (กรรมการ)
('evaluator1@ccollege.ac.th', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'อ.สมชาย ใจดี', 'evaluator', 'active', 1),
('evaluator2@ccollege.ac.th', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'อ.สมหญิง รักงาน', 'evaluator', 'active', 1),

-- Evaluatees (ผู้รับการประเมิน)
('teacher1@ccollege.ac.th', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ครูไอที 01', 'evaluatee', 'active', 1),
('teacher2@ccollege.ac.th', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ครูไอที 02', 'evaluatee', 'active', 1),
('teacher3@ccollege.ac.th', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ครูไอที 03', 'evaluatee', 'active', 1);

-- Evaluation Periods
INSERT INTO evaluation_periods (code, name_th, buddhist_year, start_date, end_date, is_active) VALUES
('P2568-1','รอบที่ 1 ปีการศึกษา 2568', 2568, '2025-01-01', '2025-06-30', 1),
('P2568-2','รอบที่ 2 ปีการศึกษา 2568', 2568, '2025-07-01', '2025-12-31', 0);

-- Evaluation Topics
INSERT INTO evaluation_topics (code, title_th, description, weight, active) VALUES
('T01','ด้านการจัดการเรียนการสอน','ประเมินการจัดการเรียนการสอนและพัฒนาหลักสูตร',30.00,1),
('T02','ด้านการบริหารจัดการ','ประเมินการบริหารจัดการและภาวะผู้นำ',25.00,1),
('T03','ด้านการพัฒนาตนเอง','ประเมินการพัฒนาตนเองและเพิ่มพูนความรู้',20.00,1),
('T04','ด้านการบริการวิชาการ','ประเมินการให้บริการวิชาการแก่สังคม',15.00,1),
('T05','ด้านการวิจัย','ประเมินการทำวิจัยและพัฒนานวัตกรรม',10.00,1);

-- Indicators (ตัวอย่าง)
INSERT INTO indicators (topic_id, code, name_th, description, type, weight, min_score, max_score, active) VALUES
-- ด้านการสอน
(1,'IND-T01-01','จัดทำแผนการสอนครบถ้วน','มีแผนการสอนที่สมบูรณ์ ครอบคลุมเนื้อหาตามหลักสูตร','score_1_4',5.00,1,4,1),
(1,'IND-T01-02','ใช้สื่อการสอนที่หลากหลาย','มีการใช้สื่อการสอนที่เหมาะสมและทันสมัย','score_1_4',5.00,1,4,1),
(1,'IND-T01-03','ผลการเรียนนักเรียนผ่านเกณฑ์','นักเรียนมีผลการเรียนผ่านเกณฑ์ไม่น้อยกว่า 80%','yes_no',5.00,0,1,1),

-- ด้านการบริหาร
(2,'IND-T02-01','เข้าร่วมประชุมครบถ้วน','เข้าร่วมประชุมครบตามกำหนด','yes_no',5.00,0,1,1),
(2,'IND-T02-02','ปฏิบัติงานตามหน้าที่','ปฏิบัติงานตามที่ได้รับมอบหมายอย่างมีประสิทธิภาพ','score_1_4',5.00,1,4,1),

-- ด้านพัฒนาตนเอง
(3,'IND-T03-01','อบรมพัฒนาตนเอง','เข้าร่วมอบรมพัฒนาตนเองไม่น้อยกว่า 20 ชั่วโมง/ปี','score_1_4',5.00,1,4,1),
(3,'IND-T03-02','ศึกษาต่อระดับสูงขึ้น','มีการศึกษาต่อหรือพัฒนาวุฒิการศึกษา','yes_no',5.00,0,1,1);

-- Evidence Types
INSERT INTO evidence_types (code, name_th, description) VALUES
('EV01','แผนการสอน','ไฟล์เอกสารแผนการสอน (PDF)'),
('EV02','ภาพถ่ายกิจกรรม','ภาพถ่ายการจัดกิจกรรม (JPG/PNG)'),
('EV03','เอกสารรับรอง','เอกสารรับรองจากหน่วยงาน (PDF)'),
('EV04','ใบประกาศนียบัตร','ใบประกาศนียบัตรการอบรม (PDF)'),
('EV05','URL/Link','ลิงก์เว็บไซต์หรือเอกสารออนไลน์');

-- Indicator-Evidence Mapping
INSERT INTO indicator_evidence (indicator_id, evidence_type_id) VALUES
-- แผนการสอน → แผนการสอน
(1,1),
-- สื่อการสอน → ภาพถ่าย, URL
(2,2), (2,5),
-- ผลการเรียน → เอกสารรับรอง
(3,3),
-- เข้าประชุม → เอกสารรับรอง
(4,3),
-- ปฏิบัติงาน → เอกสารรับรอง, ภาพถ่าย
(5,3), (5,2),
-- อบรม → ใบประกาศนียบัตร
(6,4),
-- ศึกษาต่อ → เอกสารรับรอง
(7,3);

-- Assignments (ตัวอย่างการมอบหมาย)
INSERT INTO assignments (period_id, evaluator_id, evaluatee_id, role_type, dept_id) VALUES
-- รอบที่ 1 ปี 2568
(1, 2, 4, 'chairman', 1),  -- อ.สมชาย (ประธาน) ประเมิน ครูไอที 01
(1, 3, 4, 'member', 1),    -- อ.สมหญิง (กรรมการ) ประเมิน ครูไอที 01
(1, 2, 5, 'chairman', 1),  -- อ.สมชาย (ประธาน) ประเมิน ครูไอที 02
(1, 3, 6, 'chairman', 1);  -- อ.สมหญิง (ประธาน) ประเมิน ครูไอที 03

-- ============================================================================
-- VIEWS (สำหรับรายงาน - Optional)
-- ============================================================================

CREATE OR REPLACE VIEW v_evaluation_summary AS
SELECT 
  er.period_id,
  ep.name_th AS period_name,
  u.id AS evaluatee_id,
  u.name_th AS evaluatee_name,
  u.department_id,
  COUNT(DISTINCT er.indicator_id) AS total_indicators,
  SUM(CASE WHEN er.status = 'submitted' THEN 1 ELSE 0 END) AS submitted_count,
  SUM(CASE WHEN er.status = 'evaluated' THEN 1 ELSE 0 END) AS evaluated_count,
  AVG(er.self_score) AS avg_self_score,
  AVG(er.evaluator_score) AS avg_evaluator_score
FROM evaluation_results er
JOIN users u ON er.evaluatee_id = u.id
JOIN evaluation_periods ep ON er.period_id = ep.id
GROUP BY er.period_id, u.id, ep.name_th, u.name_th, u.department_id;

-- ============================================================================
-- สรุป
-- ============================================================================
-- 
-- ✅ ตารางที่มีใน Template (12 ตาราง):
--    - vocational_categories, vocational_fields, org_groups, departments
--    - dept_fields, users, evaluation_periods, evaluation_topics
--    - indicators, evidence_types, indicator_evidence, assignments
--    - evaluation_results, attachments
--
-- 🆕 ตารางที่เพิ่มใหม่ (2 ตาราง):
--    - signatures (ลายเซ็นดิจิทัล)
--    - evaluator_comments (ความคิดเห็นกรรมการ)
--
-- 📊 View (1 view):
--    - v_evaluation_summary (สรุปผลการประเมิน)
--
-- รวมทั้งหมด: 14 ตาราง + 1 view
--
-- ============================================================================