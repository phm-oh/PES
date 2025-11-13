<!-- frontend/pages/admin/indicators.vue -->
<!-- ⭐ FINAL VERSION: แสดงน้ำหนัก + สถานะ + พร้อม debug -->
<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()
const router = useRouter()

const items = ref([])
const topics = ref([])
const loading = ref(false)
const saving = ref(false)
const dialog = ref(false)
const dialogDelete = ref(false)
const editedIndex = ref(-1)
const editedItem = ref({
  id: null, topic_id: null, code: '', name_th: '', type: 'score_1_4', weight: 1, active: 1
})
const defaultItem = {
  id: null, topic_id: null, code: '', name_th: '', type: 'score_1_4', weight: 1, active: 1
}
const errorMsg = ref('')
const successMsg = ref('')

const headers = [
  { title: 'รหัส', key: 'code', sortable: true },
  { title: 'ชื่อตัวชี้วัด', key: 'name_th', sortable: true },
  { title: 'หัวข้อ', key: 'topic_name', sortable: true },
  { title: 'ประเภท', key: 'type', sortable: true },
  { title: 'น้ำหนัก', key: 'weight', sortable: true, align: 'center' },
  { title: 'สถานะ', key: 'active', sortable: true, align: 'center' },
  { title: 'จัดการ', key: 'actions', sortable: false, align: 'center' }
]

const typeOptions = [
  { title: 'คะแนน 1-4', value: 'score_1_4' },
  { title: 'ใช่/ไม่ใช่', value: 'yes_no' }
]

const formTitle = computed(() => editedIndex.value === -1 ? 'เพิ่มตัวชี้วัด' : 'แก้ไขตัวชี้วัด')

function isActive(val) {
  return val == 1 || val === true
}

async function fetchItems() {
  if (!auth.token) {
    router.push('/login')
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch(`${config.public.apiBase}/api/indicators`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })

    let dataArray = Array.isArray(res) ? res : (res?.items || [])

    items.value = []
    await nextTick()
    items.value = dataArray
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Load failed'
    if (e.status === 401 || e.statusCode === 401) {
      auth.logout()
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

async function fetchTopics() {
  if (!auth.token) return
  try {
    const res = await $fetch(`${config.public.apiBase}/api/topics`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    topics.value = Array.isArray(res) ? res : (res?.items || [])
  } catch (e) {
    // Topics load failed
  }
}

function editItem(item) {
  editedIndex.value = items.value.indexOf(item)
  editedItem.value = {
    ...item,
    active: isActive(item.active) ? 1 : 0
  }
  dialog.value = true
}

function deleteItem(item) {
  editedIndex.value = items.value.indexOf(item)
  editedItem.value = { ...item }
  dialogDelete.value = true
}


async function save() {
  if (!auth.token) return
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

  const payload = {
    topic_id: editedItem.value.topic_id,
    code: editedItem.value.code || `IND-${Date.now().toString().slice(-6)}`,
    name_th: editedItem.value.name_th,
    type: editedItem.value.type || 'score_1_4',
    weight: editedItem.value.weight || 1,
    active: editedItem.value.active ? 1 : 0
  }

  saving.value = true
  try {
    const url = editedIndex.value > -1
      ? `${config.public.apiBase}/api/indicators/${editedItem.value.id}`
      : `${config.public.apiBase}/api/indicators`
    const method = editedIndex.value > -1 ? 'PUT' : 'POST'

    await $fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json'
      },
      body: payload
    })

    successMsg.value = editedIndex.value > -1 ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ'
    dialog.value = false
    await fetchItems()
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Save failed'
  } finally {
    saving.value = false
  }
}

async function deleteItemConfirm() {
  if (!auth.token) return
  loading.value = true
  errorMsg.value = ''
  try {
    await $fetch(`${config.public.apiBase}/api/indicators/${editedItem.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    successMsg.value = 'ลบสำเร็จ'
    dialogDelete.value = false
    await fetchItems()
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Delete failed'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!auth.isLogged || !auth.token) { 
    router.push('/login')
    return 
  }
  await fetchItems()
  await fetchTopics()
})
</script>

<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">Indicators</h1>
    <p class="text-subtitle-1 mb-6">จัดการตัวชี้วัดการประเมิน</p>

    <v-alert v-if="successMsg" type="success" dismissible class="mb-4" @click:close="successMsg = ''">
      {{ successMsg }}
    </v-alert>
    <v-alert v-if="errorMsg" type="error" dismissible class="mb-4" @click:close="errorMsg = ''">
      {{ errorMsg }}
    </v-alert>

    <v-card>
      <v-card-title>
        <v-row align="center">
          <v-col>รายการตัวชี้วัด</v-col>
          <v-col cols="auto">
            <v-btn color="success" @click="dialog = true">เพิ่มตัวชี้วัด</v-btn>
          </v-col>
        </v-row>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
        items-per-page="10"
        class="elevation-1"
      >
        <template #item.type="{ item }">
          <v-chip size="small" :color="item.type === 'score_1_4' ? 'primary' : 'secondary'">
            {{ item.type === 'score_1_4' ? 'คะแนน 1-4' : 'ใช่/ไม่ใช่' }}
          </v-chip>
        </template>

        <template #item.weight="{ item }">
          <strong>{{ item.weight || 0 }}</strong>
        </template>

        <template #item.active="{ item }">
          <v-chip 
            size="small" 
            :color="isActive(item.active) ? 'green' : 'red'"
          >
            {{ isActive(item.active) ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn icon size="small" @click="editItem(item)" class="mr-2">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon size="small" color="error" @click="deleteItem(item)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>

        <template #no-data>
          <v-btn color="primary" @click="fetchItems">โหลดข้อมูล</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <CrudDialog v-model="dialog" :title="formTitle" :error="errorMsg" :saving="saving" @save="save" @update:error="errorMsg = $event">
      <template #form>
        <v-row>
          <v-col cols="12">
            <v-select
              v-model="editedItem.topic_id"
              :items="topics"
              item-title="title_th"
              item-value="id"
              label="หัวข้อ"
              required
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="editedItem.code"
              label="รหัส"
              required
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.number="editedItem.weight"
              label="น้ำหนัก"
              type="number"
              required
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="editedItem.name_th"
              label="ชื่อตัวชี้วัด"
              required
            />
          </v-col>
          <v-col cols="12">
            <v-select
              v-model="editedItem.type"
              :items="typeOptions"
              label="ประเภท"
              required
            />
          </v-col>
          <v-col cols="12">
            <v-switch
              v-model="editedItem.active"
              :label="editedItem.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'"
              :true-value="1"
              :false-value="0"
              color="success"
            />
          </v-col>
        </v-row>
      </template>
    </CrudDialog>

    <DeleteDialog v-model="dialogDelete" :loading="loading" @confirm="deleteItemConfirm" />
  </v-container>
</template>