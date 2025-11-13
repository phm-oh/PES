# การแก้ไขปัญหา Evaluator Tasks

## ปัญหาที่พบ

1. **Vue warnings**: Failed to resolve component: StatCard และ AlertMessage
2. **Period selection**: เลือก period_id=6 ซึ่งไม่มี assignments สำหรับ evaluator1

## การแก้ไข

### 1. แก้ไข Vue Component Warnings

**ไฟล์:** `frontend/nuxt.config.ts`

เพิ่ม components config เพื่อ auto-import components จาก subdirectories:

```typescript
components: [
  {
    path: '~/components',
    pathPrefix: false,
  },
],
```

**ผลลัพธ์:** StatCard และ AlertMessage จะถูก auto-import ได้แล้ว ไม่มี warnings

---

### 2. แก้ไข Period Selection Logic

**ไฟล์:** `frontend/pages/evaluator/tasks.vue`

**การเปลี่ยนแปลง:**

#### เดิม (มีปัญหา):
- โหลด periods ทั้งหมดที่ active
- เลือก period แรกใน array โดยไม่สนใจว่ามีงานหรือไม่
- เรียก API `/api/assignments/mine?period_id=X` แล้วได้ผลลัพธ์ว่าง

#### ใหม่ (แก้ไขแล้ว):
- โหลด **tasks ทั้งหมด** ด้วย `/api/assignments/mine` (ไม่ระบุ period_id)
- สร้าง `availablePeriods` computed property เพื่อ filter เฉพาะ periods ที่มีงาน
- Auto-select period **แรกที่มีงาน** เป็น default
- Filter tasks ที่แสดงตาม selectedPeriod
- เมื่อเปลี่ยน period ใน dropdown ให้ filter tasks ใหม่

**ฟังก์ชันใหม่:**
- `fetchAllTasks()` - โหลด tasks ทั้งหมดและเลือก period ที่มีงาน
- `updateTasksForPeriod()` - filter tasks ตาม period ที่เลือก
- `availablePeriods` - computed property แสดงเฉพาะ periods ที่มีงาน

**ผลลัพธ์:**
- Evaluator เห็นเฉพาะ periods ที่มีงานจริงๆ
- ไม่แสดง "ไม่มีงาน" สำหรับ periods ที่ไม่มี assignments
- Auto-select period ที่มีงานเป็น default

---

## ขั้นตอนการทดสอบ

### 1. เปิด active สำหรับ periods ที่มี assignments

รัน SQL (เลือกวิธีใดวิธีหนึ่ง):

**วิธีที่ 1: Docker**
```bash
docker exec -i pes-db-1 mysql -uroot -proot_password pes < quick-fix-periods.sql
```

**วิธีที่ 2: MySQL Client**
```bash
mysql -h localhost -P 3306 -u root -p pes < quick-fix-periods.sql
```

**วิธีที่ 3: Copy SQL**
เปิดไฟล์ `quick-fix-periods.sql` และ copy SQL ไป run ใน MySQL Workbench หรือ phpMyAdmin

---

### 2. Restart Frontend

```bash
cd frontend
npm run dev
```

---

### 3. ทดสอบ

1. เปิดเบราว์เซอร์และ login ด้วย `evaluator1@ccollege.ac.th`
2. ไปที่หน้า **My Tasks**
3. เปิด **Browser Console** (กด F12)

**ผลลัพธ์ที่คาดหวัง:**

#### Console Logs:
```
🚀 Evaluator tasks page mounted
📅 Active periods loaded: [Array of 5 periods]
🔍 Fetching all tasks...
📋 All tasks response: {success: true, items: Array(3), total: 3}
📊 Total tasks count: 3
📅 Periods with tasks: [1, 4, 5]
🎯 Auto-selected period: 1
📊 Tasks for period 1: 2
```

#### UI:
- ✅ Dropdown แสดง periods: ทดสอบประเมิน 2568/1, 2568/4, 2568/5
- ✅ Period 1 ถูกเลือกอัตโนมัติ
- ✅ เห็นรายการงาน 2 งาน:
  - ผู้รับการประเมิน1 (evaluatee1)
  - ผู้รับการประเมิน2 (evaluatee2)
- ✅ ไม่มี Vue warnings
- ✅ StatCard แสดงสถิติ: งานทั้งหมด 2, เสร็จสิ้น 0, รอดำเนินการ 2

---

## ข้อมูล Assignments ที่ควรเห็น

ตามฐานข้อมูล, **Evaluator id=2** (evaluator1@ccollege.ac.th) มี assignments:

| Period ID | Period Name | Evaluatee ID | Evaluatee Name |
|-----------|-------------|--------------|----------------|
| 1 | ทดสอบประเมิน 2568/1 | 4 | ผู้รับการประเมิน1 |
| 1 | ทดสอบประเมิน 2568/1 | 5 | ผู้รับการประเมิน2 |
| 4 | ทดสอบประเมิน 2568/4 | 4 | ผู้รับการประเมิน1 |
| 5 | ทดสอบประเมิน 2568/5 | 5 | ผู้รับการประเมิน2 |

**รวม:** 4 assignments ใน 3 periods

---

## ไฟล์ที่เกี่ยวข้อง

- `frontend/nuxt.config.ts` - components config
- `frontend/pages/evaluator/tasks.vue` - period selection logic
- `quick-fix-periods.sql` - SQL แก้ไข periods active
- `fix-evaluator-tasks.sh` - helper script
- `EVALUATOR_TASKS_FIX.md` - เอกสารอธิบายละเอียด

---

## ปัญหาถัดไป (ยังไม่ได้แก้)

1. ⚠️ การแจ้งเตือน upload error บ่อยเกินไป
2. ⚠️ การบันทึก self-assess ไม่ได้
3. ⚠️ Digital Signature ไม่ได้

---

## Commit History

- `c4cf8b1` - fix: แก้ไข evaluator tasks page ให้แสดงเฉพาะ periods ที่มีงาน
- `6ed2e7c` - fix: เพิ่มสคริปต์แก้ไขปัญหา evaluator ไม่เห็นงาน
- `5e2b654` - debug: เพิ่ม debug tools สำหรับ evaluator tasks issue
