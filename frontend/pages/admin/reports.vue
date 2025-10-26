<!-- frontend/pages/admin/reports.vue -->
<!--  หน้ารายงานสรุป (Admin Only) -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'default' })

const auth = useAuthStore()
const config = useRuntimeConfig()

// ============= STATE =============
const items = ref([])
const periods = ref([])
const selectedPeriod = ref(null)
const loading = ref(false)
const errorMsg = ref('')

// ============= TABLE CONFIG =============
const headers = [
  { title: 'รหัสพนักงาน', key: 'evaluatee_code', sortable: true },
  { title: 'ชื่อ-สกุล', key: 'evaluatee_name', sortable: true },
  { title: 'คะแนนประเมินตนเอง', key: 'self_score', sortable: true, align: 'center' },
  { title: 'คะแนนกรรมการ', key: 'evaluator_score', sortable: true, align: 'center' },
  { title: 'คะแนนรวม', key: 'total_score', sortable: true, align: 'center' },
  { title: 'ระดับ', key: 'grade', sortable: true, align: 'center' },
  { title: 'สถานะ', key: 'status', sortable: false }
]

// ============= COMPUTED =============
const summary = computed(() => {
  const total = items.value.length
  const completed = items.value.filter(i => i.status === 'completed').length
  const avgScore = items.value.length > 0 
    ? (items.value.reduce((sum, i) => sum + (i.total_score || 0), 0) / total).toFixed(2)
    : '0.00'
  return { total, completed, avgScore }
})

// ============= METHODS =============
async function fetchPeriods() {
  try {
    const res = await $fetch(`${config.public.apiBase}/api/periods`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    periods.value = res.items || []
    if (periods.value.length > 0) {
      selectedPeriod.value = periods.value[0].id
      fetchReports()
    }
  } catch (e) {
    console.error('Load periods failed:', e)
  }
}

async function fetchReports() {
  if (!selectedPeriod.value) return
  
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch(`${config.public.apiBase}/api/reports/normalized`, {
      params: { period_id: selectedPeriod.value },
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    
    // จัดรูปแบบข้อมูล
    items.value = (res.items || []).map(item => ({
      ...item,
      self_score: item.self_score || 0,
      evaluator_score: item.evaluator_score || 0,
      total_score: (item.self_score || 0) + (item.evaluator_score || 0),
      grade: getGrade((item.self_score || 0) + (item.evaluator_score || 0)),
      status: item.status || 'pending'
    }))
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

function getGrade(score) {
  if (score >= 90) return 'ดีเยี่ยม'
  if (score >= 80) return 'ดีมาก'
  if (score >= 70) return 'ดี'
  if (score >= 60) return 'พอใช้'
  return 'ปรับปรุง'
}

function getGradeColor(grade) {
  const colors = {
    'ดีเยี่ยม': 'success',
    'ดีมาก': 'info',
    'ดี': 'primary',
    'พอใช้': 'warning',
    'ปรับปรุง': 'error'
  }
  return colors[grade] || 'default'
}

function getStatusColor(status) {
  const colors = {
    'completed': 'success',
    'pending': 'warning',
    'draft': 'default'
  }
  return colors[status] || 'default'
}

function getStatusText(status) {
  const texts = {
    'completed': 'สำเร็จ',
    'pending': 'รอดำเนินการ',
    'draft': 'แบบร่าง'
  }
  return texts[status] || status
}

async function exportCSV() {
  if (items.value.length === 0) {
    errorMsg.value = 'ไม่มีข้อมูลให้ export'
    return
  }

  // สร้าง CSV
  const headers = ['รหัสพนักงาน', 'ชื่อ-สกุล', 'คะแนนตนเอง', 'คะแนนกรรมการ', 'คะแนนรวม', 'ระดับ', 'สถานะ']
  const rows = items.value.map(i => [
    i.evaluatee_code || '',
    i.evaluatee_name || '',
    i.self_score,
    i.evaluator_score,
    i.total_score,
    i.grade,
    getStatusText(i.status)
  ])
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `report_period_${selectedPeriod.value}_${Date.now()}.csv`
  link.click()
}

// ============= LIFECYCLE =============
onMounted(() => {
  fetchPeriods()
})
</script>

<template>
  <div class="pa-4">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span class="text-h5">รายงานสรุปผลการประเมิน</span>
      </v-card-title>

      <v-card-text>
        <!-- Filter -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedPeriod"
              :items="periods"
              item-title="name_th"
              item-value="id"
              label="เลือกรอบการประเมิน"
              @update:model-value="fetchReports"
            />
          </v-col>
          <v-col cols="12" md="6" class="d-flex align-center justify-end">
            <v-btn color="success" @click="exportCSV" :disabled="items.length === 0">
              <v-icon left>mdi-download</v-icon>
              Export CSV
            </v-btn>
          </v-col>
        </v-row>

        <!-- Summary Cards -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-card color="primary" variant="tonal">
              <v-card-text class="text-center">
                <div class="text-h4">{{ summary.total }}</div>
                <div class="text-subtitle-1">จำนวนผู้ถูกประเมินทั้งหมด</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card color="success" variant="tonal">
              <v-card-text class="text-center">
                <div class="text-h4">{{ summary.completed }}</div>
                <div class="text-subtitle-1">ประเมินเสร็จสมบูรณ์</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card color="info" variant="tonal">
              <v-card-text class="text-center">
                <div class="text-h4">{{ summary.avgScore }}</div>
                <div class="text-subtitle-1">คะแนนเฉลี่ย</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-alert v-if="errorMsg" type="error" dismissible @click:close="errorMsg = ''">
          {{ errorMsg }}
        </v-alert>

        <!-- Data Table -->
        <v-data-table
          :headers="headers"
          :items="items"
          :loading="loading"
          class="elevation-1"
        >
          <template #item.grade="{ item }">
            <v-chip :color="getGradeColor(item.grade)" size="small">
              {{ item.grade }}
            </v-chip>
          </template>

          <template #item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" size="small">
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>

          <template #no-data>
            <div class="text-center pa-4">
              <v-icon size="64" color="grey">mdi-file-document-outline</v-icon>
              <div class="text-subtitle-1 mt-2">ไม่มีข้อมูล</div>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>
