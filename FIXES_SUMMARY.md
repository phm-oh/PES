# 🔧 สรุปการแก้ไข Bugs และคำแนะนำการใช้งาน

## ✅ Bugs ที่แก้ไขเสร็จแล้ว

### 1. Profile Editing ไม่ทำงาน (Evaluatee/Evaluator) ✅
**ปัญหา**: ผู้ใช้ไม่สามารถแก้ไข profile ได้ เพราะ frontend ส่ง `phone` และ `position` แต่ backend ไม่รองรับ

**การแก้ไข**:
- เพิ่ม `phone` และ `position` fields ใน `users.controller.js`:
  - `GET /api/users/:id` - ตอนนี้ส่ง phone และ position กลับมาด้วย
  - `PUT /api/users/:id` - รองรับการ update phone และ position
- สร้าง SQL migration script: `add-user-fields.sql`
- สร้าง bash script: `run-migration.sh` เพื่อรัน migration ง่ายๆ

**วิธีใช้**:
```bash
# รัน migration เพื่อเพิ่ม phone และ position columns
./run-migration.sh

# หรือรันด้วยตัวเอง:
docker exec -i pes-db-1 mysql -uroot -proot_password pes < add-user-fields.sql
```

---

### 2. Evaluator กด Profile แล้วเด้งไปหน้า Progress ✅
**ปัญหา**: ใน dashboard layout, ปุ่ม "Profile" ลิงก์ไปที่ `/me` ซึ่ง redirect อัตโนมัติไป `/me/progress`

**การแก้ไข**:
- แก้ไข `frontend/layouts/dashboard.vue` line 90
- เปลี่ยนจาก `to="/me"` เป็น `to="/me/profile"`

---

### 3. API Endpoint Bugs (Indicators) ✅
**ปัญหา**: Frontend เรียก `/api/attachments/indicators` ซึ่ง endpoint นี้ถูกลบออกแล้ว

**การแก้ไข**:
- แก้ไข `frontend/pages/me/self-assess.vue`
- แก้ไข `frontend/pages/evaluator/evaluate/[id].vue`
- เปลี่ยน endpoint จาก `/api/attachments/indicators` เป็น `/api/indicators`
- เปลี่ยนการรับ response จาก `indicatorsRes` เป็น `indicatorsRes.items`

---

## ⚠️ ปัญหาที่ต้องตรวจสอบเพิ่มเติม

### 4. Evaluator ไม่เห็น Tasks ที่รับมอบหมาย
**สาเหตุที่เป็นไปได้**:
1. ❌ **ไม่มีข้อมูล Assignments ใน database** (สาเหตุหลัก)
2. ❌ **Period ไม่ได้ถูกทำให้ active** (`is_active = 0`)
3. ✅ Backend API `/api/assignments/mine` ทำงานถูกต้อง
4. ✅ Frontend `evaluator/tasks.vue` เรียก API ถูกต้อง

**วิธีแก้**:
```bash
# 1. ตรวจสอบว่ามี period ที่ active หรือไม่
SELECT * FROM evaluation_periods WHERE is_active = 1;

# 2. ตรวจสอบว่ามี assignments สำหรับ evaluator หรือไม่
SELECT * FROM assignments WHERE evaluator_id = <evaluator_user_id>;

# 3. ถ้าไม่มี ให้สร้างผ่าน Admin interface:
# - ไปที่ /admin/assignments
# - สร้าง assignment ใหม่ โดยเลือก evaluator และ evaluatee
```

---

### 5. Self-Assess: ไม่สามารถ Scroll/ปรับคะแนนได้
**สาเหตุที่เป็นไปได้**:
1. ❌ **ไม่มี Topics และ Indicators ใน database** → จะแสดง "ไม่พบรายการประเมิน"
2. ⚠️ **Browser/Vuetify CSS conflict** → ลอง refresh หรือเปลี่ยน browser
3. ✅ v-slider component code ถูกต้อง

**วิธีแก้**:
```bash
# ตรวจสอบว่ามี topics และ indicators หรือไม่
SELECT COUNT(*) FROM evaluation_topics WHERE active = 1;
SELECT COUNT(*) FROM indicators WHERE active = 1;

# ถ้าไม่มี ให้สร้างผ่าน Admin interface:
# - ไปที่ /admin/topics → สร้าง topic
# - ไปที่ /admin/indicators → สร้าง indicator และเชื่อมกับ topic
```

---

### 6. Self-Assess: มี Upload Error แจ้งเตือนบ่อย
**สาเหตุ**: Frontend เรียก `/api/upload` เมื่อมี error ใน file upload
**แนะนำ**: ตรวจสอบ `backend/routes/upload.routes.js` ว่ามี endpoint นี้หรือไม่

---

### 7. Self-Assess: บันทึกไม่ได้
**สาเหตุที่เป็นไปได้**:
1. ✅ Frontend เรียก `/api/results/self/bulk` ถูกต้อง
2. ✅ Backend `saveSelfBulk` function มีและทำงานถูกต้อง
3. ❌ **ไม่มี evaluation_results records** → ต้องสร้างก่อนด้วย init API
4. ❌ **Database schema ไม่ตรงกับ code**

**วิธีแก้**:
```javascript
// ใช้ init API เพื่อสร้าง evaluation_results records
POST /api/results/init-for-me
Body: { "period_id": 1 }
```

---

### 8. Digital Signature ไม่ทำงาน
**สถานะ**: ยังไม่ได้ตรวจสอบ - ต้อง inspect signature page

---

## 📋 Checklist การใช้งานระบบ

### สำหรับ Admin:
- [ ] 1. Login ด้วย role `admin`
- [ ] 2. สร้าง **Period** ที่ `/admin/periods` และทำให้ active (`is_active = 1`)
- [ ] 3. สร้าง **Topics** ที่ `/admin/topics` (ตั้ง `active = 1`)
- [ ] 4. สร้าง **Indicators** ที่ `/admin/indicators` (เชื่อมกับ topic และตั้ง `active = 1`)
- [ ] 5. สร้าง **Assignments** ที่ `/admin/assignments` (เลือก evaluator, evaluatee, period)
- [ ] 6. (Optional) รัน Init API เพื่อสร้าง evaluation_results ให้ทุกคน:
  ```bash
  POST /api/results/init-for-period
  Body: { "period_id": 1 }
  ```

### สำหรับ Evaluatee:
- [ ] 1. Login ด้วย role `evaluatee`
- [ ] 2. ไปที่ `/me/profile` เพื่อแก้ไข profile (ต้องรัน migration ก่อน!)
- [ ] 3. ไปที่ `/me/self-assess` เพื่อประเมินตนเอง
- [ ] 4. ถ้าเห็น "ไม่พบรายการประเมิน" → ให้ admin สร้าง topics/indicators

### สำหรับ Evaluator:
- [ ] 1. Login ด้วย role `evaluator`
- [ ] 2. ไปที่ `/me/profile` เพื่อแก้ไข profile (ต้องรัน migration ก่อน!)
- [ ] 3. ไปที่ `/evaluator/tasks` เพื่อดูงานที่ได้รับมอบหมาย
- [ ] 4. ถ้าไม่เห็นงาน → ให้ admin สร้าง assignment
- [ ] 5. กดปุ่ม "ให้คะแนน" เพื่อเข้าไปประเมิน

---

## 🚀 ขั้นตอนการ Deploy

```bash
# 1. Pull latest code
git pull origin claude/work-session-011CV59wdAW9g3BmetFruCqY

# 2. รัน database migration
./run-migration.sh

# 3. Restart backend (ถ้าจำเป็น)
docker-compose restart api

# 4. Restart frontend (ถ้าจำเป็น)
cd frontend && npm run dev
```

---

## 📝 Files ที่แก้ไข

### Backend:
- ✅ `backend/controllers/users.controller.js` - เพิ่ม phone, position fields
- ✅ `add-user-fields.sql` - SQL migration script
- ✅ `run-migration.sh` - Bash script สำหรับรัน migration

### Frontend:
- ✅ `frontend/layouts/dashboard.vue` - แก้ profile link
- ✅ `frontend/pages/me/self-assess.vue` - แก้ API endpoint
- ✅ `frontend/pages/evaluator/evaluate/[id].vue` - แก้ API endpoint
- ✅ `frontend/pages/me/profile.vue` - แก้ field names จาก `name` เป็น `name_th`

---

## 🔍 Database Schema ที่เพิ่ม

```sql
ALTER TABLE users
ADD COLUMN phone VARCHAR(20) NULL AFTER email,
ADD COLUMN position VARCHAR(255) NULL AFTER phone;
```

---

## ⚡ Quick Troubleshooting

| ปัญหา | วิธีแก้ |
|-------|---------|
| Profile แก้ไขไม่ได้ | รัน `./run-migration.sh` |
| กด Profile เด้งไปหน้า Progress | Pull code ใหม่ แล้ว restart frontend |
| Evaluator ไม่เห็น tasks | สร้าง assignments ผ่าน admin |
| Self-assess ไม่มีรายการ | สร้าง topics + indicators ผ่าน admin |
| บันทึก self-assess ไม่ได้ | รัน init API หรือให้ admin สร้าง results |

---

## 📞 ติดต่อ

หากมีปัญหาเพิ่มเติม กรุณาตรวจสอบ:
1. Browser console (`F12`) เพื่อดู error messages
2. Backend logs: `docker logs pes-api-1`
3. Database data: ใช้ phpMyAdmin ที่ `http://localhost:8080`
