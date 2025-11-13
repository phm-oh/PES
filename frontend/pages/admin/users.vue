<!-- frontend/pages/admin/users.vue -->
<!-- 👥 หน้าจัดการผู้ใช้งาน (Admin Only) -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()

// ============= STATE =============
const items = ref([])
const loading = ref(false)
const saving = ref(false)
const dialog = ref(false)
const dialogDelete = ref(false)
const editedIndex = ref(-1)
const editedItem = ref({
  id: null,
  email: '',
  name_th: '',
  role: 'evaluatee',
  status: 'active',
  password: ''
})
const defaultItem = {
  id: null,
  email: '',
  name_th: '',
  role: 'evaluatee',
  status: 'active',
  password: ''
}
const errorMsg = ref('')
const successMsg = ref('')
const showPassword = ref(false)

// ============= TABLE CONFIG =============
const headers = [
  { title: 'ID', key: 'id', sortable: true, align: 'center' },
  { title: 'ชื่อ-นามสกุล', key: 'name_th', sortable: true },
  { title: 'อีเมล', key: 'email', sortable: true },
  { title: 'บทบาท', key: 'role', sortable: true },
  { title: 'สถานะ', key: 'status', sortable: false },
  { title: 'จัดการ', key: 'actions', sortable: false, align: 'center' }
]

const roleOptions = [
  { title: 'Evaluatee (ผู้รับการประเมิน)', value: 'evaluatee' },
  { title: 'Evaluator (ผู้ประเมิน)', value: 'evaluator' },
  { title: 'Admin (ผู้ดูแลระบบ)', value: 'admin' }
]

const statusOptions = [
  { title: 'ใช้งานได้', value: 'active' },
  { title: 'ปิดการใช้งาน', value: 'disabled' }
]

// ============= COMPUTED =============
const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'เพิ่มผู้ใช้งาน' : 'แก้ไขผู้ใช้งาน'
})

// ============= METHODS =============
async function loadData() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch(`${config.public.apiBase}/api/users`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    items.value = res.items || res || []
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'โหลดข้อมูลไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

function openDialog(item = null) {
  if (item) {
    editedIndex.value = items.value.indexOf(item)
    editedItem.value = Object.assign({}, item, { password: '' })
  } else {
    editedIndex.value = -1
    editedItem.value = Object.assign({}, defaultItem)
  }
  dialog.value = true
  errorMsg.value = ''
  successMsg.value = ''
  showPassword.value = false
}

function openDeleteDialog(item) {
  editedIndex.value = items.value.indexOf(item)
  editedItem.value = Object.assign({}, item)
  dialogDelete.value = true
}

async function save() {
  errorMsg.value = ''
  successMsg.value = ''

  // Validation
  if (!editedItem.value.email || !editedItem.value.name_th) {
    errorMsg.value = 'กรุณากรอกอีเมลและชื่อ-นามสกุล'
    return
  }

  // Password validation for new user
  if (editedIndex.value === -1 && !editedItem.value.password) {
    errorMsg.value = 'กรุณากรอกรหัสผ่านสำหรับผู้ใช้ใหม่'
    return
  }

  saving.value = true
  try {
    const url = editedIndex.value > -1
      ? `${config.public.apiBase}/api/users/${editedItem.value.id}`
      : `${config.public.apiBase}/api/users`
    const method = editedIndex.value > -1 ? 'PUT' : 'POST'

    const body = {
      email: editedItem.value.email,
      name_th: editedItem.value.name_th,
      role: editedItem.value.role || 'evaluatee',
      status: editedItem.value.status || 'active'
    }

    // Only send password if it's set (for create or update)
    if (editedItem.value.password) {
      body.password = editedItem.value.password
    }

    await $fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json'
      },
      body
    })

    successMsg.value = editedIndex.value > -1 ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มข้อมูลสำเร็จ'
    dialog.value = false
    await loadData()
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'บันทึกไม่สำเร็จ'
  } finally {
    saving.value = false
  }
}

async function deleteItem() {
  loading.value = true
  errorMsg.value = ''
  try {
    await $fetch(`${config.public.apiBase}/api/users/${editedItem.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    successMsg.value = 'ลบข้อมูลสำเร็จ'
    dialogDelete.value = false
    await loadData()
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'ลบไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

function getRoleColor(role) {
  const colors = {
    admin: 'error',
    evaluator: 'warning',
    evaluatee: 'info'
  }
  return colors[role] || 'grey'
}

function getRoleText(role) {
  const texts = {
    admin: 'Admin',
    evaluator: 'Evaluator',
    evaluatee: 'Evaluatee'
  }
  return texts[role] || role
}

function getStatusColor(status) {
  return status === 'active' ? 'success' : 'grey'
}

function getStatusText(status) {
  return status === 'active' ? 'ใช้งานได้' : 'ปิดใช้งาน'
}

// ============= LIFECYCLE =============
onMounted(() => {
  if (auth.user?.role !== 'admin') {
    navigateTo('/')
  }
  loadData()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h1 class="text-h5">จัดการผู้ใช้งาน</h1>
        <p class="text-caption text-grey mt-1">จัดการบัญชีผู้ใช้งานในระบบ</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-account-plus" @click="openDialog()">
        เพิ่มผู้ใช้งาน
      </v-btn>
    </div>

    <!-- Alert Messages -->
    <v-alert v-if="errorMsg" type="error" variant="tonal" closable class="mb-4" @click:close="errorMsg = ''">
      {{ errorMsg }}
    </v-alert>
    <v-alert v-if="successMsg" type="success" variant="tonal" closable class="mb-4" @click:close="successMsg = ''">
      {{ successMsg }}
    </v-alert>

    <!-- Data Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
        loading-text="กำลังโหลด..."
        no-data-text="ไม่มีข้อมูล"
        items-per-page-text="แสดงต่อหน้า"
        class="elevation-1"
      >
        <!-- Role Column -->
        <template #item.role="{ item }">
          <v-chip :color="getRoleColor(item.role)" size="small" variant="flat">
            {{ getRoleText(item.role) }}
          </v-chip>
        </template>

        <!-- Status Column -->
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" variant="flat">
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openDialog(item)" />
          <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="openDeleteDialog(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <CrudDialog v-model="dialog" :title="formTitle" :error="errorMsg" :saving="saving" @save="save" @update:error="errorMsg = $event">
      <template #form>
        <v-container>
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="editedItem.name_th"
                label="ชื่อ-นามสกุล *"
                hint="เช่น สมชาย ใจดี"
                persistent-hint
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="editedItem.email"
                label="อีเมล *"
                type="email"
                hint="เช่น user@example.com"
                persistent-hint
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="editedItem.role"
                :items="roleOptions"
                label="บทบาท *"
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="editedItem.status"
                :items="statusOptions"
                label="สถานะ *"
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="editedItem.password"
                :type="showPassword ? 'text' : 'password'"
                :label="editedIndex === -1 ? 'รหัสผ่าน *' : 'รหัสผ่าน (เว้นว่างถ้าไม่เปลี่ยน)'"
                :hint="editedIndex === -1 ? 'กรุณากำหนดรหัสผ่านเริ่มต้น' : 'กรอกเฉพาะเมื่อต้องการเปลี่ยนรหัสผ่าน'"
                persistent-hint
                density="compact"
                variant="outlined"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
              />
            </v-col>
          </v-row>
        </v-container>
      </template>
    </CrudDialog>

    <!-- Delete Confirmation Dialog -->
    <DeleteDialog v-model="dialogDelete" :loading="loading" @confirm="deleteItem" />
  </div>
</template>

<style scoped>
.v-card-title {
  padding: 16px 24px !important;
}
</style>
