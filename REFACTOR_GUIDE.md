# 📘 คู่มือ Refactor สำหรับนักเรียน

## ✅ สิ่งที่ทำเสร็จแล้ว (Completed)

### 1. Cleanup Backend (Priority 1)
- ✅ ลบ console.log ทั้งหมด 6 ไฟล์
- ✅ แก้ column mismatch: `is_active` → `status`
- **Commits:**
  - `aefa9f6` - cleanup: ลบ console.log ทั้งหมดจาก backend
  - `6262209` - fix: แก้ไข column name mismatch

### 2. Reusable Components (Priority 2)
- ✅ สร้าง `CrudDialog.vue` (32 lines)
- ✅ สร้าง `DeleteDialog.vue` (24 lines)
- **Commit:**
  - `a966b73` - feat: สร้าง reusable dialog components

### 3. Refactor Admin Pages (Priority 2)
- ✅ `admin/periods.vue`: 351 → 275 บรรทัด (-76 lines, -21%)
- **Commit:**
  - `a9b3df5` - refactor: ใช้ CrudDialog และ DeleteDialog

---

## 📋 สิ่งที่เหลือต้อทำ (TODO)

### Priority 2 (ควรทำต่อ)

#### 1. Refactor admin/topics.vue (362 lines)
**Pattern เดียวกับ periods.vue:**

```vue
<template>
  <!-- ... existing table ... -->

  <!-- แทนที่ inline dialog ด้วย -->
  <CrudDialog
    v-model="dialog"
    :title="formTitle"
    :error="errorMsg"
    :saving="saving"
    @save="save"
  >
    <template #form>
      <!-- ย้าย form fields มาใส่ตรงนี้ -->
      <v-container>
        <v-row dense>
          <v-col cols="12">
            <v-text-field v-model="editedItem.code" label="รหัส *" />
          </v-col>
          <v-col cols="12">
            <v-text-field v-model="editedItem.title_th" label="ชื่อหัวข้อ *" />
          </v-col>
          <!-- ... form fields อื่นๆ ... -->
        </v-row>
      </v-container>
    </template>
  </CrudDialog>

  <DeleteDialog v-model="dialogDelete" :loading="loading" @confirm="deleteItem" />
</template>

<script setup>
// เพิ่ม saving state
const saving = ref(false)

// ใน save() function
async function save() {
  saving.value = true  // เปลี่ยนจาก loading.value
  try {
    // ... existing save logic ...
  } finally {
    saving.value = false
  }
}
</script>
```

**คาดการณ์:** ลดจาก 362 → ~280 บรรทัด (-80 lines, -22%)

---

#### 2. Refactor admin/indicators.vue (359 lines)
**Pattern เดียวกัน:**
- ใช้ CrudDialog แทน inline form
- ใช้ DeleteDialog แทน confirm dialog
- แยก `saving` กับ `loading` states

**คาดการณ์:** ลดจาก 359 → ~280 บรรทัด (-79 lines, -22%)

---

#### 3. แก้ Admin Users Management

**ปัญหา:** Admin ยังแก้ไข users ไม่ได้ (ไม่มี UI)

**วิธีแก้:**
1. สร้าง `frontend/pages/admin/users.vue` (ถ้ายังไม่มี)
2. ใช้ pattern เดียวกับ periods.vue
3. Form fields:
   ```vue
   <v-text-field v-model="editedItem.email" label="Email *" />
   <v-text-field v-model="editedItem.name_th" label="ชื่อ-นามสกุล *" />
   <v-select
     v-model="editedItem.role"
     :items="['admin', 'evaluator', 'evaluatee']"
     label="บทบาท *"
   />
   <v-select
     v-model="editedItem.status"
     :items="['active', 'disabled']"
     label="สถานะ *"
   />
   <v-text-field
     v-model="editedItem.password"
     type="password"
     label="รหัสผ่าน (เว้นว่างถ้าไม่เปลี่ยน)"
   />
   ```

**API Endpoints:**
- GET `/api/users` - list all users
- PUT `/api/users/:id` - update user (admin only)
- POST `/api/users` - create user (admin only)
- DELETE `/api/users/:id` - delete user (admin only)

---

#### 4. แก้ Digital Signature (Simplified)

**ปัญหาปัจจุบัน:**
- `frontend/pages/evaluator/signature.vue` มี UI แต่ไม่ทำงาน
- Frontend เรียก `POST /api/assignments/:id/sign` ซึ่งไม่มี
- Signature pad เป็น placeholder

**วิธีแก้แบบง่าย (Simplified):**

**Option 1: Text-based Signature**
```vue
<template>
  <div>
    <v-text-field
      v-model="signatureName"
      label="ลงนามโดย"
      readonly
      :value="auth.user.name_th"
    />
    <v-text-field
      label="วันที่ลงนาม"
      readonly
      :value="new Date().toLocaleString('th-TH')"
    />
    <v-btn color="primary" @click="confirmSignature">
      ยืนยันการลงนาม
    </v-btn>
  </div>
</template>

<script setup>
const auth = useAuthStore()
const config = useRuntimeConfig()

async function confirmSignature() {
  await $fetch(`${config.public.apiBase}/api/signatures`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json'
    },
    body: {
      evaluatee_id: evaluateeId.value,
      period_id: periodId.value,
      signature: auth.user.name_th,
      signed_at: new Date().toISOString()
    }
  })
  alert('ลงนามสำเร็จ')
}
</script>
```

**Option 2: Signature Pad (Advanced)**
ถ้าต้องการ signature pad จริงๆ:
1. ติดตั้ง: `npm install signature_pad`
2. ใช้ canvas + base64 encoding
3. บันทึก base64 string ลง database

**คำแนะนำ:** ใช้ Option 1 เพราะง่ายและเพียงพอสำหรับการแข่งขัน

---

### Priority 3 (Nice to Have)

#### 5. ลบ Frontend Debug Logs

**ไฟล์ที่ต้องลบ console.log:**
- `frontend/pages/evaluator/tasks.vue` (lines 32-35, 60-61, 75, 101-102)
- `frontend/pages/me/self-assess.vue` (ถ้ามี)

**คำสั่ง grep:**
```bash
grep -rn "console\.\(log\|error\|warn\)" frontend/pages --include="*.vue"
```

---

## 🎯 Pattern สำหรับ Refactor CRUD Pages

### Before (Old Pattern)
```vue
<template>
  <!-- 80+ lines ของ dialog template -->
  <v-dialog v-model="dialog" max-width="600px">
    <v-card>
      <v-card-title>{{ formTitle }}</v-card-title>
      <v-card-text>
        <v-alert v-if="errorMsg" type="error">{{ errorMsg }}</v-alert>
        <!-- form fields -->
      </v-card-text>
      <v-card-actions>
        <v-btn @click="closeDialog">ยกเลิก</v-btn>
        <v-btn @click="save" :loading="loading">บันทึก</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="dialogDelete" max-width="500px">
    <!-- 20+ lines ของ delete dialog -->
  </v-dialog>
</template>
```

### After (New Pattern)
```vue
<template>
  <!-- เพียง 5 บรรทัด! -->
  <CrudDialog
    v-model="dialog"
    :title="formTitle"
    :error="errorMsg"
    :saving="saving"
    @save="save"
  >
    <template #form>
      <!-- เฉพาะ form fields -->
    </template>
  </CrudDialog>

  <DeleteDialog v-model="dialogDelete" :loading="loading" @confirm="deleteItem" />
</template>

<script setup>
// แยก loading states
const loading = ref(false)  // for table & delete
const saving = ref(false)   // for save button
</script>
```

---

## 📊 สรุปผลลัพธ์

### Code Reduction
| ไฟล์ | Before | After | ลดลง |
|------|--------|-------|------|
| periods.vue | 351 | 275 | -76 (-21%) |
| topics.vue | 362 | ~280 | ~-82 (-23%) |
| indicators.vue | 359 | ~280 | ~-79 (-22%) |
| **รวม** | **1,072** | **~835** | **~-237 (-22%)** |

### ประโยชน์
1. ✅ ลด code duplication 200+ บรรทัด
2. ✅ Pattern เหมือนกันทุกหน้า → จำง่าย
3. ✅ Components reusable → ใช้ได้ทุก CRUD page
4. ✅ เหมาะสำหรับการแข่งขัน (6 ชม.)

---

## 🚀 ขั้นตอนต่อไป

1. **Refactor topics และ indicators** (30 นาที)
   ```bash
   # Copy pattern จาก periods.vue
   # แทนที่ dialog template
   # Test ว่าทำงานได้
   ```

2. **แก้ Admin Users** (20 นาที)
   ```bash
   # สร้าง admin/users.vue (ถ้ายังไม่มี)
   # ใช้ pattern เดียวกับ periods.vue
   # เพิ่ม role และ status select
   ```

3. **แก้ Digital Signature** (15 นาที)
   ```bash
   # ใช้ Option 1: Text-based (ง่ายที่สุด)
   # หรือ Option 2: Signature Pad (ถ้ามีเวลา)
   ```

4. **ลบ Debug Logs** (5 นาที)
   ```bash
   grep -rn "console\." frontend/pages --include="*.vue" | grep -v "console.error"
   # ลบ console.log ที่เหลือทั้งหมด
   ```

5. **ทดสอบ End-to-End** (30 นาที)
   ```bash
   # Login ทุก role (admin, evaluator, evaluatee)
   # ทดสอบทุก features
   # แก้ bugs ที่เจอ
   ```

---

## 📝 Git Workflow

```bash
# หลัง refactor แต่ละไฟล์
git add <file>
git commit -m "refactor: ใช้ CrudDialog ใน <page>"
git push

# หลังแก้ทุกอย่างเสร็จ
git add .
git commit -m "chore: final polish and cleanup"
git push
```

---

## 🎓 สำหรับนักเรียน

### ความรู้ที่ได้เรียนรู้
1. **Component Reusability** - สร้าง component ที่ใช้ซ้ำได้
2. **Slots** - ใช้ `<slot>` เพื่อ customize content
3. **Props & Emits** - ส่งข้อมูลระหว่าง components
4. **Code Organization** - แยก concerns ให้ชัดเจน
5. **DRY Principle** - Don't Repeat Yourself

### Pattern ที่ควรจำ
```vue
<!-- Parent Component -->
<CrudDialog v-model="dialog" @save="save">
  <template #form>
    <!-- Your form here -->
  </template>
</CrudDialog>

<!-- Child Component (CrudDialog.vue) -->
<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-text>
        <slot name="form" />
      </v-card-text>
      <v-card-actions>
        <v-btn @click="$emit('save')">บันทึก</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
```

---

**Last Updated:** Nov 13, 2025
**Branch:** claude/work-session-011CV59wdAW9g3BmetFruCqY
**Commits:** aefa9f6, 6262209, a966b73, a9b3df5
