<!-- frontend/pages/admin/periods.vue -->
<!-- 📋 หน้าจัดการรอบการประเมิน (Admin Only) -->
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
  code: '',
  name_th: '',
  buddhist_year: new Date().getFullYear() + 543,
  start_date: '',
  end_date: '',
  is_active: 1
})
const defaultItem = {
  id: null,
  code: '',
  name_th: '',
  buddhist_year: new Date().getFullYear() + 543,
  start_date: '',
  end_date: '',
  is_active: 1
}
const errorMsg = ref('')
const successMsg = ref('')

// ============= TABLE CONFIG =============
const headers = [
  { title: 'รหัส', key: 'code', sortable: true },
  { title: 'ชื่อรอบ', key: 'name_th', sortable: true },
  { title: 'ปีการศึกษา', key: 'buddhist_year', sortable: true },
  { title: 'เริ่มต้น', key: 'start_date', sortable: true },
  { title: 'สิ้นสุด', key: 'end_date', sortable: true },
  { title: 'สถานะ', key: 'is_active', sortable: false },
  { title: 'จัดการ', key: 'actions', sortable: false, align: 'center' }
]

// ============= COMPUTED =============
const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'เพิ่มรอบการประเมิน' : 'แก้ไขรอบการประเมิน'
})

// ============= METHODS =============
async function loadData() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch(`${config.public.apiBase}/api/periods`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    items.value = res.items || []
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'โหลดข้อมูลไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

function openDialog(item = null) {
  if (item) {
    editedIndex.value = items.value.indexOf(item)
    editedItem.value = Object.assign({}, item)
  } else {
    editedIndex.value = -1
    editedItem.value = Object.assign({}, defaultItem)
  }
  dialog.value = true
  errorMsg.value = ''
  successMsg.value = ''
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
  if (!editedItem.value.code || !editedItem.value.name_th || !editedItem.value.start_date || !editedItem.value.end_date) {
    errorMsg.value = 'กรุณากรอกข้อมูลให้ครบถ้วน'
    return
  }

  saving.value = true
  try {
    const url = editedIndex.value > -1
      ? `${config.public.apiBase}/api/periods/${editedItem.value.id}`
      : `${config.public.apiBase}/api/periods`
    const method = editedIndex.value > -1 ? 'PUT' : 'POST'

    await $fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json'
      },
      body: {
        code: editedItem.value.code,
        name_th: editedItem.value.name_th,
        buddhist_year: editedItem.value.buddhist_year,
        start_date: editedItem.value.start_date,
        end_date: editedItem.value.end_date,
        is_active: editedItem.value.is_active ? 1 : 0
      }
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
    await $fetch(`${config.public.apiBase}/api/periods/${editedItem.value.id}`, {
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
      <h1 class="text-h5">จัดการรอบการประเมิน</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
        เพิ่มรอบการประเมิน
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
        <!-- Status Column -->
        <template #item.is_active="{ item }">
          <v-chip :color="item.is_active ? 'success' : 'grey'" size="small" variant="flat">
            {{ item.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
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
            <v-col cols="12" md="6">
              <v-text-field
                v-model="editedItem.code"
                label="รหัสรอบ *"
                hint="เช่น Y2568-1"
                persistent-hint
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="editedItem.buddhist_year"
                label="ปีการศึกษา (พ.ศ.) *"
                type="number"
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="editedItem.name_th"
                label="ชื่อรอบการประเมิน *"
                hint="เช่น รอบที่ 1 ปีการศึกษา 2568"
                persistent-hint
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="editedItem.start_date"
                label="วันที่เริ่มต้น *"
                type="date"
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="editedItem.end_date"
                label="วันที่สิ้นสุด *"
                type="date"
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-switch
                v-model="editedItem.is_active"
                label="เปิดใช้งาน"
                color="success"
                :true-value="1"
                :false-value="0"
                hide-details
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
