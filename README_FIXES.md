# 🔧 สรุปการแก้ไข Bugs - Performance Evaluation System

## ✅ การแก้ไขที่ทำไปแล้ว

### 1. Profile Editing
**ปัญหา**: ไม่สามารถแก้ไข profile ได้เพราะส่ง phone และ position ที่ไม่มีใน database

**วิธีแก้**:
- แก้ไข `frontend/pages/me/profile.vue`
- ลบ phone และ position fields ออก
- ใช้เฉพาะ `name_th` และ `email` (email แสดงอย่างเดียว ไม่ให้แก้ไข)
- **ไม่ต้อง migrate database** ตามที่ผู้ใช้ร้องขอ

**ไฟล์ที่แก้ไข**:
```
frontend/pages/me/profile.vue (lines 16-18, 32-35, 48-56, 69-74, 138-164, 166-181)
```

---

### 2. Indicators Filter
**ปัญหา**: Frontend แสดง indicators ทั้ง active และ inactive (รวม id: 8, 9, 10 ที่ active = 0)

**วิธีแก้**:
- แก้ไข `backend/repositories/indicators.repository.js`
- เพิ่ม `.where('indicators.active', 1)` ใน `findAll()` method
- ตอนนี้ `/api/indicators` คืนเฉพาะ indicators ที่ active = 1 เท่านั้น (id: 1-7)

**ไฟล์ที่แก้ไข**:
```javascript
// backend/repositories/indicators.repository.js (line 15)
.where('indicators.active', 1)
```

---

### 3. Navigation Bug (แก้ไขก่อนหน้านี้แล้ว)
**ปัญหา**: กดปุ่ม "Profile" แล้วเด้งไปหน้า Progress

**วิธีแก้**:
- แก้ไข `frontend/layouts/dashboard.vue` line 89
- เปลี่ยน `to="/me"` เป็น `to="/me/profile"`

---

### 4. API Endpoints (แก้ไขก่อนหน้านี้แล้ว)
**ปัญหา**: Frontend เรียก `/api/attachments/indicators` ที่ถูกลบไปแล้ว

**วิธีแก้**:
- แก้ไข `frontend/pages/me/self-assess.vue`
- แก้ไข `frontend/pages/evaluator/evaluate/[id].vue`
- เปลี่ยนเป็น `/api/indicators` และใช้ `indicatorsRes.items`

---

## ⚠️ ปัญหาที่ต้องตรวจสอบเพิ่มเติม

### 1. Evaluator ไม่เห็น Tasks (ทั้งที่มีข้อมูลใน assignments)

**ข้อมูลใน database**:
```sql
-- assignments table มี 6 records:
id | period_id | evaluator_id | evaluatee_id
1  | 1         | 2            | 4
2  | 1         | 3            | 4
3  | 1         | 2            | 5
4  | 1         | 3            | 6
6  | 4         | 2            | 4
7  | 5         | 2            | 5
```

**สิ่งที่ต้องตรวจสอบ**:

1. **Period Selection**: ตรวจสอบว่า evaluator เลือก period_id ตรงกับข้อมูลหรือไม่
   - ถ้าเลือก period_id = 1 → ควรเห็น tasks 3 รายการ (assignments id: 1,2,3,4)
   - ถ้าเลือก period_id = 4 → ควรเห็น tasks 1 รายการ (assignment id: 6)
   - ถ้าเลือก period_id = 5 → ควรเห็น tasks 1 รายการ (assignment id: 7)

2. **User ID**: ตรวจสอบว่า user ที่ login มี id = 2 หรือ 3 หรือไม่
   ```sql
   -- เช็คว่า login ด้วย user ไหน
   SELECT id, name_th, email, role FROM users WHERE role = 'evaluator';
   ```

3. **Period Active Status**: ตรวจสอบว่า period ถูกตั้งเป็น active
   ```sql
   SELECT id, name_th, is_active FROM evaluation_periods;
   ```

4. **Debug Frontend**: เปิด browser console (F12) แล้วดูว่า:
   - API `/api/assignments/mine?period_id=X` ถูกเรียกหรือไม่
   - Response กลับมาเป็นอะไร (มี items ไหม)

---

### 2. Self-Assess: ไม่สามารถ Scroll/ปรับคะแนนได้

**สถานะ**: ควรแก้ไขแล้วหลังจากที่ filter indicators active = 1

**ข้อมูลใน database** (หลังการ filter):
```sql
-- indicators ที่ active = 1 (จะแสดงใน self-assess)
id | topic_id | name_th                      | type        | active
1  | 1        | จัดทำแผนการสอนครบถ้วน       | score_1_4   | 1
2  | 1        | ใช้สื่อการสอนที่หลากหลาย   | score_1_4   | 1
3  | 1        | ผลการเรียนนักเรียนผ่านเกณฑ์ | yes_no      | 1
4  | 2        | เข้าร่วมประชุมครบถ้วน       | yes_no      | 1
5  | 2        | ปฏิบัติงานตามหน้าที่        | score_1_4   | 1
6  | 3        | อบรมพัฒนาตนเอง              | score_1_4   | 1
7  | 3        | ศึกษาต่อระดับสูงขึ้น         | yes_no      | 1
```

**วิธีทดสอบ**:
1. Login ด้วย role = 'evaluatee'
2. ไปที่ `/me/self-assess`
3. เลือก period ที่ active
4. ควรเห็น 7 indicators จาก 5 topics (T01-T05)

---

### 3. Self-Assess: บันทึกไม่ได้

**API ที่ใช้**: `POST /api/results/self/bulk`

**ตรวจสอบ**:
1. เปิด browser console (F12) → Network tab
2. กดปุ่ม "บันทึก"
3. ดูว่า request ส่งไปหรือไม่ และ response เป็นอะไร

**ถ้า error 400/500**:
- ดู error message ใน response
- อาจต้องสร้าง evaluation_results records ก่อนด้วย init API

---

## 📋 Workflow การใช้งาน

### สำหรับ Admin (ขั้นตอนเตรียมข้อมูล):

1. **สร้าง Period** ที่ `/admin/periods`
   ```sql
   -- ตรวจสอบ: SELECT * FROM evaluation_periods WHERE is_active = 1;
   -- ต้องมีอย่างน้อย 1 period ที่ is_active = 1
   ```

2. **สร้าง Topics** ที่ `/admin/topics`
   ```sql
   -- ตรวจสอบ: SELECT * FROM evaluation_topics WHERE active = 1;
   -- ตอนนี้มี 7 topics (T01-T07) active = 1 แล้ว ✅
   ```

3. **สร้าง Indicators** ที่ `/admin/indicators`
   ```sql
   -- ตรวจสอบ: SELECT * FROM indicators WHERE active = 1;
   -- ตอนนี้มี 7 indicators (id: 1-7) active = 1 แล้ว ✅
   ```

4. **สร้าง Assignments** ที่ `/admin/assignments`
   ```sql
   -- ตรวจสอบ: SELECT * FROM assignments;
   -- ตอนนี้มี 6 assignments แล้ว ✅
   ```

### สำหรับ Evaluatee:

1. Login ด้วย role = 'evaluatee'
2. ไปที่ `/me/profile` → แก้ไข name_th ได้แล้ว ✅
3. ไปที่ `/me/self-assess`
   - เลือก period
   - ถ้าเห็น "ไม่พบรายการประเมิน" → ตรวจสอบว่ามี topics/indicators ที่ active = 1 หรือไม่

### สำหรับ Evaluator:

1. Login ด้วย role = 'evaluator'
2. ไปที่ `/me/profile` → แก้ไข name_th ได้แล้ว ✅
3. ไปที่ `/evaluator/tasks`
   - เลือก period ที่ตรงกับ assignments (เช่น period_id = 1, 4, หรือ 5)
   - ถ้าไม่เห็น tasks → ตรวจสอบว่า user id ตรงกับ evaluator_id ใน assignments หรือไม่

---

## 🐛 การ Debug

### Debug Evaluator Tasks:

```javascript
// เปิด browser console แล้วรันคำสั่งนี้
console.log('Selected Period:', selectedPeriod.value)
console.log('Tasks:', tasks.value)
console.log('API URL:', `${config.public.apiBase}/api/assignments/mine?period_id=${selectedPeriod.value}`)
```

### Debug Self-Assess:

```javascript
// เปิด browser console แล้วรันคำสั่งนี้
console.log('Selected Period:', selectedPeriod.value)
console.log('Topics:', topics.value)
console.log('Has topics?', topics.value.length > 0)
console.log('First topic indicators:', topics.value[0]?.indicators)
```

---

## 📊 สรุป Database ปัจจุบัน

| Table              | Records | Active Records | Note |
|--------------------|---------|----------------|------|
| evaluation_periods | ?       | ?              | ต้องมีอย่างน้อย 1 ที่ is_active = 1 |
| evaluation_topics  | 7       | 7              | ✅ มีข้อมูลครบ (T01-T07) |
| indicators         | 10      | 7              | ✅ active = 1 มี 7 รายการ (id: 1-7) |
| assignments        | 6       | 6              | ✅ มีข้อมูลครบ (period 1,4,5) |
| users              | ?       | ?              | ต้องมี evaluator (id: 2,3) และ evaluatee (id: 4,5,6) |

---

## 🚀 การ Deploy

```bash
# 1. Pull latest code
git pull origin claude/work-session-011CV59wdAW9g3BmetFruCqY

# 2. Restart backend (ถ้าจำเป็น)
docker-compose restart api

# 3. Restart frontend (ถ้าจำเป็น)
cd frontend && npm run dev
```

**ไม่ต้องรัน database migration!** ทุกอย่างใช้ database schema เดิม

---

## ✅ Files ที่แก้ไข (Commit: 32f0f2d)

1. ✅ `frontend/pages/me/profile.vue` - ลบ phone, position
2. ✅ `backend/repositories/indicators.repository.js` - เพิ่ม filter active = 1
3. ❌ ลบ `add-user-fields.sql` (ไม่ต้องใช้)
4. ❌ ลบ `run-migration.sh` (ไม่ต้องใช้)
5. ❌ ลบ `users.controller.js.backup` (ไม่ต้องใช้)
6. ❌ ลบ `FIXES_SUMMARY.md` (เอกสารเก่า)

---

## 💡 คำแนะนำสำหรับการแข่งขัน

1. **ไม่ต้อง migrate database** - ใช้ template ที่กรรมการให้มาได้เลย
2. **Code เรียบง่าย** - เด็กสามารถเข้าใจและแก้ไขได้ใน 6 ชั่วโมง
3. **ตรวจสอบข้อมูล** - ก่อนทดสอบให้แน่ใจว่ามี periods, topics, indicators, assignments ที่ active
4. **Debug ผ่าน console** - ใช้ F12 เพื่อดู API calls และ response

---

## 📞 หากยังมีปัญหา

ให้ตรวจสอบตามลำดับ:
1. ✅ Browser console (F12) → มี error ไหม
2. ✅ Network tab → API response เป็นอะไร
3. ✅ Database → มีข้อมูลที่ active = 1 ไหม
4. ✅ Backend logs → `docker logs pes-api-1`
