-- Quick Fix: เปิด active สำหรับ periods ที่มี assignments
-- รันคำสั่งนี้เพื่อแก้ปัญหา evaluator ไม่เห็นงาน

UPDATE evaluation_periods
SET is_active = 1
WHERE id IN (SELECT DISTINCT period_id FROM assignments);

-- เช็คผลลัพธ์
SELECT
  id,
  name_th,
  is_active,
  (SELECT COUNT(*) FROM assignments WHERE period_id = evaluation_periods.id) as assignments_count
FROM evaluation_periods
ORDER BY id;
