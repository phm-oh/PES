-- ============================================================
-- แก้ไขปัญหา: Evaluator ไม่เห็นงานเพราะ periods ไม่ active
-- ============================================================

-- 1. เช็คสถานะปัจจุบันของทุก periods
SELECT
  id,
  name_th,
  is_active,
  start_date,
  end_date,
  CASE
    WHEN is_active = 1 THEN '✅ Active'
    ELSE '❌ Inactive'
  END as status
FROM evaluation_periods
ORDER BY id;

-- 2. นับจำนวน assignments แต่ละ period
SELECT
  p.id as period_id,
  p.name_th,
  p.is_active,
  COUNT(a.id) as assignments_count
FROM evaluation_periods p
LEFT JOIN assignments a ON p.id = a.period_id
GROUP BY p.id, p.name_th, p.is_active
ORDER BY p.id;

-- 3. เปิด active สำหรับ periods ที่มี assignments
UPDATE evaluation_periods
SET is_active = 1
WHERE id IN (
  SELECT DISTINCT period_id FROM assignments
);

-- 4. เช็คอีกครั้งหลัง update
SELECT
  id,
  name_th,
  is_active,
  CASE
    WHEN is_active = 1 THEN '✅ Active'
    ELSE '❌ Inactive'
  END as status
FROM evaluation_periods
ORDER BY id;

-- 5. เช็คว่า period_id=1 มี assignments สำหรับ evaluator_id=2 หรือไม่
SELECT
  a.id,
  a.period_id,
  a.evaluator_id,
  evaluator.name_th as evaluator_name,
  a.evaluatee_id,
  evaluatee.name_th as evaluatee_name,
  p.name_th as period_name,
  p.is_active as period_active
FROM assignments a
LEFT JOIN users evaluator ON a.evaluator_id = evaluator.id
LEFT JOIN users evaluatee ON a.evaluatee_id = evaluatee.id
LEFT JOIN evaluation_periods p ON a.period_id = p.id
WHERE a.evaluator_id = 2
ORDER BY a.period_id, a.id;

-- ============================================================
-- สรุป: หลังรันสคริปต์นี้แล้ว
-- ============================================================
-- ✅ ทุก periods ที่มี assignments จะถูกเปิด active
-- ✅ Evaluator จะเห็น period เหล่านี้ใน dropdown
-- ✅ Evaluator จะเห็นงานที่ได้รับมอบหมาย
