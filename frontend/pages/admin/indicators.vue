<!-- frontend/pages/admin/indicators.vue -->
<!--  หน้าจัดการตัวชี้วัด (Admin Only) -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'default' })

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
  code: '',
  name_th: '',
  description: '',
  topic_id: null,
  weight: 0,
  type: 'scale',
  order: 1,
  active: 1
})
const defaultItem = {
  id: null,
  code: '',
  name_th: '',
  description: '',
  topic_id: null,
  weight: 0,
  type: 'scale',
  order: 1,
  active: 1
}
const errorMsg = ref('')
const successMsg = ref('')

// ============= TABLE CONFIG =============
const headers = [
  { title: 'รหัส', key: 'code', sortable: true },
  { title: 'ชื่อตัวชี้วัด', key: 'name_th', sortable: true },
  { title: 'หัวข้อ', key: 'topic_name', sortable: false },
  { title: 'น้ำหนัก', key: 'weight', sortable: true, align: 'center' },
  { title: 'ประเภท', key: 'type', sortable: true, align: 'center' },
  { title: 'ลำดับ', key: 'order', sortable: true, align: 'center' },
  { title: 'สถานะ', key: 'active', sortable: false },
  { title: 'จัดการ', key: 'actions', sortable: false, align: 'center' }
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
    const res = await $fetch(`${config.public.apiBase}/api/topics/active`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    topics.value = res.items || []
  } catch (e) {
    console.error('Load topics failed:', e)
  }
}

function editItem(item) {
  editedIndex.value = items.value.indexOf(item)
  editedItem.value = { ...item }
  dialog.value = true
}

function deleteItem(item) {
  editedIndex.value = items.value.indexOf(item)
  editedItem.value = { ...item }
  dialogDelete.value = true
}

async function deleteItemConfirm() {
  try {
    await $fetch(`${config.public.apiBase}/api/indicators/${editedItem.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    successMsg.value = 'ลบสำเร็จ'
    await fetchItems()
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Delete failed'
  } finally {
    closeDelete()
  }
}

function close() {
  dialog.value = false
  setTimeout(() => {
    editedItem.value = { ...defaultItem }
    editedIndex.value = -1
  }, 300)
}

function closeDelete() {
  dialogDelete.value = false
  setTimeout(() => {
    editedItem.value = { ...defaultItem }
    editedIndex.value = -1
  }, 300)
}

async function save() {
  errorMsg.value = ''
  successMsg.value = ''
  
  if (!editedItem.value.code || !editedItem.value.name_th || !editedItem.value.topic_id) {
    errorMsg.value = 'กรุณากรอกข้อมูลให้ครบ'
    return
  }

  try {
    if (editedIndex.value > -1) {
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
    await fetchItems()
    close()
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Save failed'
  }
}

// ============= LIFECYCLE =============
onMounted(() => {
  fetchTopics()
  fetchItems()
})
</script>

<template>
  <div class="pa-4">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span class="text-h5">จัดการตัวชี้วัด</span>
        <v-spacer />
        <v-btn color="primary" @click="dialog = true">
          <v-icon left>mdi-plus</v-icon>
          เพิ่มตัวชี้วัด
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-alert v-if="errorMsg" type="error" dismissible @click:close="errorMsg = ''">
          {{ errorMsg }}
        </v-alert>
        <v-alert v-if="successMsg" type="success" dismissible @click:close="successMsg = ''">
          {{ successMsg }}
        </v-alert>

        <v-data-table
          :headers="headers"
          :items="items"
          :loading="loading"
          class="elevation-1"
        >
          <template #item.active="{ item }">
            <v-chip :color="item.active ? 'success' : 'default'" size="small">
              {{ item.active ? 'ใช้งาน' : 'ปิด' }}
            </v-chip>
          </template>

          <template #item.type="{ item }">
            <v-chip size="small">
              {{ item.type === 'scale' ? 'คะแนน' : item.type === 'yes_no' ? 'ใช่/ไม่ใช่' : item.type }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <v-icon size="small" class="me-2" @click="editItem(item)">mdi-pencil</v-icon>
            <v-icon size="small" @click="deleteItem(item)">mdi-delete</v-icon>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog สร้าง/แก้ไข -->
    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.code"
                  label="รหัส *"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="editedItem.topic_id"
                  :items="topics"
                  item-title="title_th"
                  item-value="id"
                  label="หัวข้อ *"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.name_th"
                  label="ชื่อตัวชี้วัด *"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.description"
                  label="รายละเอียด"
                  rows="2"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="editedItem.weight"
                  label="น้ำหนัก"
                  type="number"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-select
                  v-model="editedItem.type"
                  :items="[
                    { title: 'คะแนน', value: 'scale' },
                    { title: 'ใช่/ไม่ใช่', value: 'yes_no' }
                  ]"
                  label="ประเภท"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="editedItem.order"
                  label="ลำดับ"
                  type="number"
                />
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="editedItem.active"
                  :true-value="1"
                  :false-value="0"
                  label="ใช้งาน"
                  color="success"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="close">ยกเลิก</v-btn>
          <v-btn color="primary" variant="elevated" @click="save">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog ยืนยันลบ -->
    <v-dialog v-model="dialogDelete" max-width="400px">
      <v-card>
        <v-card-title>ยืนยันการลบ</v-card-title>
        <v-card-text>
          คุณต้องการลบตัวชี้วัด <strong>{{ editedItem.name_th }}</strong> ใช่หรือไม่?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="closeDelete">ยกเลิก</v-btn>
          <v-btn color="error" variant="elevated" @click="deleteItemConfirm">ลบ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>