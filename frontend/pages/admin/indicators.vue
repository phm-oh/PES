<!-- frontend/pages/admin/indicators.vue -->
<!-- 📋 หน้าจัดการตัวชี้วัด (Admin Only) -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()

// ============= STATE =============
const items = ref([])
const topics = ref([])
const loading = ref(false)
const dialog = ref(false)
const dialogDelete = ref(false)
const editedIndex = ref(-1)
const editedItem = ref({
  id: null,
  topic_id: null,
  code: '',
  name_th: '',
  type: 'score_1_4',
  weight: 1,
  order: 1,
  active: 1
})
const defaultItem = {
  id: null,
  topic_id: null,
  code: '',
  name_th: '',
  type: 'score_1_4',
  weight: 1,
  order: 1,
  active: 1
}
const errorMsg = ref('')
const successMsg = ref('')

// ============= TABLE CONFIG =============
const headers = [
  { title: 'รหัส', key: 'code', sortable: true },
  { title: 'ชื่อตัวชี้วัด', key: 'name_th', sortable: true },
  { title: 'หัวข้อ', key: 'topic_name', sortable: true },
  { title: 'ประเภท', key: 'type', sortable: true },
  { title: 'น้ำหนัก', key: 'weight', sortable: true, align: 'center' },
  { title: 'ลำดับ', key: 'order', sortable: true, align: 'center' },
  { title: 'สถานะ', key: 'active', sortable: false },
  { title: 'จัดการ', key: 'actions', sortable: false, align: 'center' }
]

const typeOptions = [
  { title: 'คะแนน 1-4', value: 'score_1_4' },
  { title: 'ใช่/ไม่ใช่', value: 'yes_no' }
]

// ============= COMPUTED =============
const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'เพิ่มตัวชี้วัด' : 'แก้ไขตัวชี้วัด'
})

// ============= METHODS =============
async function fetchItems() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch(`${config.public.apiBase}/api/indicators`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    items.value = res.items || []
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

async function fetchTopics() {
  try {
    const res = await $fetch(`${config.public.apiBase}/api/topics`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    topics.value = res.items || []
  } catch (e) {
    console.error('Load topics failed:', e)
  }
}

function openDialog(item = null) {
  if (item) {
    editedIndex.value = items.value.indexOf(item)
    editedItem.value = { ...item }
  } else {
    editedIndex.value = -1
    editedItem.value = { ...defaultItem }
  }
  dialog.value = true
}

function closeDialog() {
  dialog.value = false
  setTimeout(() => {
    editedItem.value = { ...defaultItem }
    editedIndex.value = -1
  }, 300)
}

async function save() {
  errorMsg.value = ''
  successMsg.value = ''
  
  try {
    if (editedIndex.value > -1) {
      // Update
      await $fetch(`${config.public.apiBase}/api/indicators/${editedItem.value.id}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: editedItem.value
      })
      successMsg.value = 'แก้ไขสำเร็จ'
    } else {
      // Create
      await $fetch(`${config.public.apiBase}/api/indicators`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: editedItem.value
      })
      successMsg.value = 'เพิ่มสำเร็จ'
    }
    
    closeDialog()
    await fetchItems()
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Save failed'
  }
}

function openDeleteDialog(item) {
  editedItem.value = { ...item }
  dialogDelete.value = true
}

function closeDeleteDialog() {
  dialogDelete.value = false
  setTimeout(() => {
    editedItem.value = { ...defaultItem }
  }, 300)
}

async function confirmDelete() {
  try {
    await $fetch(`${config.public.apiBase}/api/indicators/${editedItem.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    
    successMsg.value = 'ลบสำเร็จ'
    closeDeleteDialog()
    await fetchItems()
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Delete failed'
  }
}

onMounted(() => {
  fetchItems()
  fetchTopics()
})
</script>

<template>
  <div class="pa-4">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Indicators</h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-2">จัดการตัวชี้วัดการประเมิน</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
        เพิ่มตัวชี้วัด
      </v-btn>
    </div>

    <!-- Messages -->
    <v-alert v-if="errorMsg" type="error" class="mb-4" closable @click:close="errorMsg = ''">
      {{ errorMsg }}
    </v-alert>
    <v-alert v-if="successMsg" type="success" class="mb-4" closable @click:close="successMsg = ''">
      {{ successMsg }}
    </v-alert>

    <!-- Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
        loading-text="กำลังโหลด..."
        no-data-text="ไม่มีข้อมูล"
        items-per-page-text="แสดงต่อหน้า:"
        density="comfortable"
      >
        <template #item.type="{ item }">
          <v-chip size="small" :color="item.type === 'score_1_4' ? 'primary' : 'success'">
            {{ item.type === 'score_1_4' ? 'คะแนน 1-4' : 'ใช่/ไม่ใช่' }}
          </v-chip>
        </template>

        <template #item.active="{ item }">
          <v-chip size="small" :color="item.active ? 'success' : 'error'">
            {{ item.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openDialog(item)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="openDeleteDialog(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <v-form>
            <v-select
              v-model="editedItem.topic_id"
              :items="topics"
              item-title="title_th"
              item-value="id"
              label="หัวข้อ *"
              density="comfortable"
              variant="outlined"
              class="mb-2"
            />
            <v-text-field
              v-model="editedItem.code"
              label="รหัส *"
              density="comfortable"
              variant="outlined"
              class="mb-2"
            />
            <v-text-field
              v-model="editedItem.name_th"
              label="ชื่อตัวชี้วัด *"
              density="comfortable"
              variant="outlined"
              class="mb-2"
            />
            <v-select
              v-model="editedItem.type"
              :items="typeOptions"
              label="ประเภท *"
              density="comfortable"
              variant="outlined"
              class="mb-2"
            />
            <v-text-field
              v-model.number="editedItem.weight"
              label="น้ำหนัก"
              type="number"
              density="comfortable"
              variant="outlined"
              class="mb-2"
            />
            <v-text-field
              v-model.number="editedItem.order"
              label="ลำดับ"
              type="number"
              density="comfortable"
              variant="outlined"
              class="mb-2"
            />
            <v-switch
              v-model="editedItem.active"
              :label="editedItem.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'"
              color="primary"
              :true-value="1"
              :false-value="0"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">ยกเลิก</v-btn>
          <v-btn color="primary" variant="flat" @click="save">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="dialogDelete" max-width="400px">
      <v-card>
        <v-card-title>ยืนยันการลบ</v-card-title>
        <v-card-text>
          คุณแน่ใจหรือไม่ที่จะลบ "{{ editedItem.name_th }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">ยกเลิก</v-btn>
          <v-btn color="error" variant="flat" @click="confirmDelete">ลบ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>