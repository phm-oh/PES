<!-- frontend/pages/admin/indicators.vue -->
<!--  แก้ไขครั้งที่ 3: เพิ่ม debug log + handle refresh ดีขึ้น -->
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
  active: 1
})
const defaultItem = {
  id: null,
  topic_id: null,
  code: '',
  name_th: '',
  type: 'score_1_4',
  weight: 1,
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
//  แก้ไข: เพิ่ม debug log
async function fetchItems() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch(`${config.public.apiBase}/api/indicators`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    items.value = res.items || []
    console.log('📋 Frontend received indicators:', items.value.length, 'items')
    console.log('🔍 First item:', items.value[0]) // ✨ Debug: ดู structure
  } catch (e) {
    console.error('❌ Fetch indicators error:', e)
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
    const timestamp = Date.now().toString().slice(-6)
    editedItem.value.code = `IND-${timestamp}`
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

// ✨ แก้ไข: เพิ่ม debug log และ error handling ดีขึ้น
async function save() {
  errorMsg.value = ''
  successMsg.value = ''
  
  if (!editedItem.value.name_th) {
    errorMsg.value = 'กรุณากรอกชื่อตัวชี้วัด'
    return
  }
  if (!editedItem.value.topic_id) {
    errorMsg.value = 'กรุณาเลือกหัวข้อ'
    return
  }
  if (!editedItem.value.code) {
    const timestamp = Date.now().toString().slice(-6)
    editedItem.value.code = `IND-${timestamp}`
  }
  
  const payload = {
    topic_id: editedItem.value.topic_id,
    code: editedItem.value.code,
    name_th: editedItem.value.name_th,
    type: editedItem.value.type || 'score_1_4',
    weight: editedItem.value.weight || 1,
    active: editedItem.value.active ? 1 : 0
  }
  
  console.log('💾 Saving indicator:', payload) // ✨ Debug log
  
  try {
    if (editedIndex.value > -1) {
      await $fetch(`${config.public.apiBase}/api/indicators/${editedItem.value.id}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: payload
      })
      successMsg.value = 'แก้ไขสำเร็จ'
    } else {
      const result = await $fetch(`${config.public.apiBase}/api/indicators`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: payload
      })
      console.log('✅ Created indicator:', result) // ✨ Debug log
      successMsg.value = 'เพิ่มสำเร็จ'
    }
    closeDialog()
    
    // ✨ เพิ่ม delay เล็กน้อยเพื่อให้ DB commit เสร็จ
    setTimeout(async () => {
      await fetchItems()
    }, 200)
    
  } catch (e) {
    console.error('❌ Save error:', e) // ✨ Debug log
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
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Indicators</h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-2">จัดการตัวชี้วัดการประเมิน</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
        เพิ่มตัวชี้วัด
      </v-btn>
    </div>

    <v-alert v-if="errorMsg" type="error" class="mb-4" closable @click:close="errorMsg = ''">
      {{ errorMsg }}
    </v-alert>
    <v-alert v-if="successMsg" type="success" class="mb-4" closable @click:close="successMsg = ''">
      {{ successMsg }}
    </v-alert>

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
            {{ item.active ? 'ใช้งาน' : 'ปิดใช้งาน' }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" @click="openDialog(item)" />
          <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="openDeleteDialog(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog สำหรับเพิ่ม/แก้ไข -->
    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="text-h5 pa-4">{{ formTitle }}</v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.code"
                  label="รหัส *"
                  variant="outlined"
                  density="compact"
                  hint="จะถูกสร้างอัตโนมัติถ้าไม่ระบุ"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editedItem.topic_id"
                  :items="topics"
                  item-title="title_th"
                  item-value="id"
                  label="หัวข้อ *"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.name_th"
                  label="ชื่อตัวชี้วัด *"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="editedItem.type"
                  :items="typeOptions"
                  label="ประเภท"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="editedItem.weight"
                  label="น้ำหนัก"
                  type="number"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12">
                <v-checkbox
                  v-model="editedItem.active"
                  label="ใช้งาน"
                  :true-value="1"
                  :false-value="0"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">ยกเลิก</v-btn>
          <v-btn color="primary" variant="flat" @click="save">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog สำหรับยืนยันการลบ -->
    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 pa-4">ยืนยันการลบ?</v-card-title>
        <v-card-text>
          คุณแน่ใจหรือไม่ว่าต้องการลบตัวชี้วัด "{{ editedItem.name_th }}"?
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