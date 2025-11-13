<script setup>
import { ref, onMounted, watch } from 'vue'
import { usePeriods } from '~/composables/usePeriods'
import { useMessages } from '~/composables/useMessages'
import { useApi } from '~/composables/useApi'

definePageMeta({ layout: 'dashboard' })

const { periods, selectedPeriod, fetchPeriods } = usePeriods()
const { errorMsg, setError } = useMessages()
const { fetchData } = useApi()

const loading = ref(false)
const reportData = ref(null)

async function fetchReport() {
  if (!selectedPeriod.value) return

  loading.value = true
  setError('')
  try {
    const res = await fetchData(`/api/reports/overall/${selectedPeriod.value}`)
    reportData.value = calculateStats(res.items || [])
  } catch (e) {
    setError(e.data?.message || e.message || 'Load failed')
  } finally {
    loading.value = false
  }
}

function calculateStats(items) {
  if (!items.length) return null

  const total = items.length
  const completed = items.filter(i => i.status === 'completed').length
  const inProgress = items.filter(i => i.status === 'in_progress').length
  const avgScore = items.reduce((sum, i) => sum + (i.score || 0), 0) / total

  return {
    total_evaluatees: total,
    completed,
    in_progress: inProgress,
    average_score: avgScore.toFixed(2)
  }
}

async function exportCSV() {
  alert('CSV Export - สามารถเพิ่มฟังก์ชันนี้ได้ในภายหลัง')
}

onMounted(async () => {
  await fetchPeriods()
  if (selectedPeriod.value) fetchReport()
})

watch(selectedPeriod, () => {
  if (selectedPeriod.value) fetchReport()
})
</script>

<template>
  <div class="pa-4">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Reports</h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-2">รายงานสรุปผลการประเมิน</p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-download"
        @click="exportCSV"
        :disabled="!reportData"
      >
        Export CSV
      </v-btn>
    </div>

    <v-card class="mb-6">
      <v-card-text>
        <PeriodSelector v-model="selectedPeriod" :periods="periods" />
      </v-card-text>
    </v-card>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <AlertMessage type="error" :message="errorMsg" @clear="errorMsg = ''" />

    <v-card v-if="reportData && !loading">
      <v-card-title>สรุปภาพรวม</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <StatCard
              title="ผู้ถูกประเมินทั้งหมด"
              :value="reportData.total_evaluatees"
              color="primary"
              icon="mdi-account-group"
            />
          </v-col>
          <v-col cols="12" md="3">
            <StatCard
              title="ประเมินเสร็จแล้ว"
              :value="reportData.completed"
              color="success"
              icon="mdi-check-circle"
            />
          </v-col>
          <v-col cols="12" md="3">
            <StatCard
              title="กำลังดำเนินการ"
              :value="reportData.in_progress"
              color="warning"
              icon="mdi-clock-outline"
            />
          </v-col>
          <v-col cols="12" md="3">
            <StatCard
              title="คะแนนเฉลี่ย"
              :value="reportData.average_score"
              color="info"
              icon="mdi-chart-line"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card v-else-if="!loading">
      <v-card-text class="text-center py-12">
        <v-icon size="64" color="grey-lighten-1">mdi-chart-box-outline</v-icon>
        <div class="text-h6 mt-4 text-medium-emphasis">ไม่มีข้อมูลรายงาน</div>
        <div class="text-body-2 mt-2 text-medium-emphasis">เลือกรอบการประเมินเพื่อดูรายงาน</div>
      </v-card-text>
    </v-card>
  </div>
</template>
