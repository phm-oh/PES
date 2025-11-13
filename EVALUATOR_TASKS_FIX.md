# แก้ไขปัญหา: Evaluator ไม่เห็นงานที่ได้รับมอบหมาย

## 🔍 สาเหตุของปัญหา

**ปัญหา:** Evaluator (กรรมการ id=2, evaluator1@ccollege.ac.th) login เข้าไปแล้วไม่เห็นงานที่ต้องประเมิน แม้ว่าในฐานข้อมูลมี assignments อยู่จริง

**สาเหตุหลัก:** ตาราง `evaluation_periods` มี `is_active=0` สำหรับ period_id=1 (และอาจเป็น periods อื่นๆ ที่มี assignments ด้วย)

### การทำงานของระบบ (Data Flow)

```
1. Evaluator login → หน้า My Tasks
2. Frontend เรียก GET /api/periods/active
3. Backend query: SELECT * FROM evaluation_periods WHERE is_active = 1
4. ถ้า period_id=1 มี is_active=0 → ไม่ถูก return
5. Frontend ไม่เห็น period_id=1 ใน dropdown
6. Evaluator เลือก period ไม่ได้
7. ไม่มีการเรียก GET /api/assignments/mine?period_id=1
8. ไม่เห็นงาน → แสดง "ไม่มีงานที่ได้รับมอบหมาย"
```

## ✅ วิธีแก้ไข

### วิธีที่ 1: รันสคริปต์อัตโนมัติ (แนะนำ)

```bash
./fix-evaluator-tasks.sh
```

สคริปต์นี้จะ:
- เช็คสถานะปัจจุบันของทุก periods
- นับจำนวน assignments ในแต่ละ period
- เปิด `is_active = 1` สำหรับทุก periods ที่มี assignments
- แสดงผลลัพธ์การแก้ไข

### วิธีที่ 2: รัน SQL โดยตรง

```bash
docker exec -i pes-db-1 mysql -uroot -proot_password pes < fix-periods-active.sql
```

### วิธีที่ 3: รัน SQL คำสั่งเดียว (Quick Fix)

```bash
docker exec -i pes-db-1 mysql -uroot -proot_password pes -e "UPDATE evaluation_periods SET is_active = 1 WHERE id IN (SELECT DISTINCT period_id FROM assignments);"
```

## 🧪 วิธีทดสอบหลังแก้ไข

1. **เปิดเบราว์เซอร์** และ login ด้วย `evaluator1@ccollege.ac.th`

2. **ไปที่หน้า My Tasks** (เมนู My Tasks)

3. **เปิด Browser Console** กด F12 → เลือกแท็บ Console

4. **ตรวจสอบ Console Logs:**
   ```
   🚀 Evaluator tasks page mounted
   📅 Periods loaded: [Array of periods]
   🎯 Selected period: 1 (หรือ period_id อื่น)
   🔍 Fetching tasks for period: 1
   📋 Tasks response: {success: true, items: Array(3), total: 3}
   📊 Tasks count: 3
   ```

5. **ตรวจสอบ UI:**
   - ✅ เห็น dropdown แสดง periods (ทดสอบประเมิน 2568/1, 2568/4, 2568/5)
   - ✅ เห็นรายการงาน (ผู้รับการประเมิน1, ผู้รับการประเมิน2, etc.)
   - ✅ กดปุ่ม "ให้คะแนน" ได้

## 📊 ข้อมูล Assignments ที่ควรเห็น

ตามฐานข้อมูล, **Evaluator id=2** ควรเห็นงานเหล่านี้:

### Period 1 (ทดสอบประเมิน 2568/1)
- ผู้รับการประเมิน id=4 (evaluatee1@ccollege.ac.th)
- ผู้รับการประเมิน id=5 (evaluatee2@ccollege.ac.th)

### Period 4 (ทดสอบประเมิน 2568/4)
- ผู้รับการประเมิน id=4 (evaluatee1@ccollege.ac.th)

### Period 5 (ทดสอบประเมิน 2568/5)
- ผู้รับการประเมิน id=5 (evaluatee2@ccollege.ac.th)

## 🐛 ถ้ายังมีปัญหา (Troubleshooting)

### ปัญหา 1: ยังไม่เห็นงาน แม้แก้ไข periods แล้ว

**เช็คใน Console:**
```javascript
// ถ้าเห็นแบบนี้ แสดงว่า periods โหลดสำเร็จ
📅 Periods loaded: [...]
🎯 Selected period: 1

// แต่ tasks ว่างเปล่า
📊 Tasks count: 0
```

**สาเหตุที่เป็นไปได้:**
1. Backend API `/api/assignments/mine` ทำงานไม่ถูกต้อง
2. JWT Token หมดอายุ หรือ user.id / user.role ไม่ถูกต้อง

**วิธีแก้:**
```bash
# เช็ค assignments ในฐานข้อมูล
docker exec -i pes-db-1 mysql -uroot -proot_password pes -e "
SELECT a.*, evaluator.name_th as evaluator, evaluatee.name_th as evaluatee
FROM assignments a
LEFT JOIN users evaluator ON a.evaluator_id = evaluator.id
LEFT JOIN users evaluatee ON a.evaluatee_id = evaluatee.id
WHERE a.evaluator_id = 2;"
```

### ปัญหา 2: Dropdown ว่างเปล่า

**เช็คใน Console:**
```javascript
📅 Periods loaded: []
⚠️ No periods available or no period selected
```

**สาเหตุ:**
- ทุก periods มี `is_active = 0`
- หรือ API `/api/periods/active` error

**วิธีแก้:**
```bash
# เช็ค periods ในฐานข้อมูล
docker exec -i pes-db-1 mysql -uroot -proot_password pes -e "
SELECT id, name_th, is_active FROM evaluation_periods ORDER BY id;"

# ถ้าทุก periods เป็น 0 ให้เปิดหมด
docker exec -i pes-db-1 mysql -uroot -proot_password pes -e "
UPDATE evaluation_periods SET is_active = 1 WHERE id IN (1, 4, 5);"
```

### ปัญหา 3: Console แสดง API Error

**ตัวอย่าง Error:**
```
❌ Fetch tasks error: {status: 401, message: "Unauthorized"}
```

**สาเหตุ:**
- JWT Token หมดอายุ
- Session หมดอายุ

**วิธีแก้:**
1. Logout และ Login ใหม่
2. Clear browser cache และ cookies
3. เช็ค localStorage ว่ามี auth token หรือไม่

## 📝 Files ที่เกี่ยวข้อง

### Frontend
- `frontend/pages/evaluator/tasks.vue` - หน้าแสดงรายการงาน (มี debug logs)
- `frontend/composables/usePeriods.js` - จัดการ periods และ selectedPeriod

### Backend
- `backend/controllers/assignments.controller.js` - API `/api/assignments/mine`
- `backend/repositories/assignments.repository.js` - Query assignments
- `backend/controllers/periods.controller.js` - API `/api/periods/active`
- `backend/repositories/periods.repository.js` - Query periods

### Database
- ตาราง `evaluation_periods` - เก็บข้อมูล periods (มี column `is_active`)
- ตาราง `assignments` - เก็บการมอบหมายงาน (evaluator → evaluatee)
- ตาราง `users` - เก็บข้อมูล evaluator และ evaluatee

## 🎯 Summary

**Root Cause:** `evaluation_periods.is_active = 0` ทำให้ periods ไม่แสดงใน dropdown

**Solution:** เปิด `is_active = 1` สำหรับ periods ที่มี assignments

**Fix Command:**
```bash
./fix-evaluator-tasks.sh
```

**Test:** Login → My Tasks → F12 → เช็ค console logs และ UI
