-- สคริปต์ debug และแก้ไข evaluation_periods
-- ปัญหา: Evaluator ไม่เห็นงาน เพราะ period ไม่ active

-- 1. เช็คว่า period_id=1 มี is_active=1 หรือไม่
SELECT id, name_th, is_active, start_date, end_date
FROM evaluation_periods
WHERE id = 1;

-- 2. ถ้า is_active=0 ให้ update เป็น 1
UPDATE evaluation_periods SET is_active = 1 WHERE id = 1;

-- 3. เช็คทุก periods ที่ active
SELECT id, name_th, is_active FROM evaluation_periods ORDER BY id;

-- 4. ถ้าอยากทำให้ periods อื่นๆ (4,5) เป็น active ด้วย
-- UPDATE evaluation_periods SET is_active = 1 WHERE id IN (4, 5);
