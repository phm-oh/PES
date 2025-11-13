#!/bin/bash
# สคริปต์ debug evaluator tasks issue

echo "===== Debug Evaluator Tasks Issue ====="
echo ""
echo "กำลังเช็ค evaluation_periods..."
echo ""

# เช็ค periods
docker exec -i pes-db-1 mysql -uroot -proot_password pes -e "
SELECT id, name_th, is_active, start_date, end_date
FROM evaluation_periods
ORDER BY id;
"

echo ""
echo "===== สาเหตุที่เป็นไปได้ ====="
echo "1. ถ้า period_id=1 มี is_active=0"
echo "   → Frontend จะไม่แสดง period นี้ใน dropdown"
echo "   → Evaluator จะเลือก period_id=1 ไม่ได้"
echo "   → จึงไม่เห็นงาน (แม้จะมี assignments)"
echo ""
echo "2. ถ้าทุก periods มี is_active=0"
echo "   → Dropdown จะว่าง"
echo "   → ไม่มี period ให้เลือก"
echo ""
echo "===== วิธีแก้ ====="
echo "รัน: docker exec -i pes-db-1 mysql -uroot -proot_password pes < debug-periods.sql"
echo "หรือ: UPDATE evaluation_periods SET is_active = 1 WHERE id = 1;"
echo ""
