<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { usePeriods } from '~/composables/usePeriods'
import { useMessages } from '~/composables/useMessages'
import { useApi } from '~/composables/useApi'

definePageMeta({ layout: 'dashboard' })

const router = useRouter()
const { periods, selectedPeriod, fetchPeriods } = usePeriods()
const { errorMsg, setError } = useMessages()
const { fetchData } = useApi()

const allTasks = ref([]) // เก็บ tasks ทั้งหมด
const tasks = ref([]) // tasks ที่ filter แล้วตาม period
const loading = ref(false)

// Filter periods ที่มีงานจริงๆ
const availablePeriods = computed(() => {
  if (allTasks.value.length === 0) return periods.value

  const periodIds = new Set(allTasks.value.map(t => t.period_id))
  return periods.value.filter(p => periodIds.has(p.id))
})

const summary = computed(() => {
  const total = tasks.value.length
  const completed = tasks.value.filter(t => t.status === 'completed').length
  return { total, completed, pending: total - completed }
})

// โหลด tasks ทั้งหมด (ไม่ระบุ period_id)
async function fetchAllTasks() {
  loading.value = true
  setError('')
  try {
    const res = await fetchData('/api/assignments/mine')
    allTasks.value = res.items || []

    // หา periods ที่มีงาน
    const taskPeriodIds = [...new Set(allTasks.value.map(t => t.period_id))]

    // ถ้ายังไม่ได้เลือก period หรือ period ที่เลือกไม่มีงาน
    if (!selectedPeriod.value || !taskPeriodIds.includes(selectedPeriod.value)) {
      // เลือก period แรกที่มีงาน
      const firstPeriodWithTask = periods.value.find(p => taskPeriodIds.includes(p.id))
      if (firstPeriodWithTask) {
        selectedPeriod.value = firstPeriodWithTask.id
      }
    }

    // Filter tasks ตาม period ที่เลือก
    updateTasksForPeriod()
  } catch (e) {
    setError(e.data?.message || e.message || 'Load failed')
  } finally {
    loading.value = false
  }
}

// Filter tasks ตาม period ที่เลือก
function updateTasksForPeriod() {
  if (!selectedPeriod.value) {
    tasks.value = []
    return
  }

  tasks.value = allTasks.value.filter(t => t.period_id === selectedPeriod.value)
}

function goToEvaluate(task) {
  router.push(`/evaluator/evaluate/${task.evaluatee_id}?period=${selectedPeriod.value}`)
}

function getStatusColor(status) {
  return { completed: 'success', in_progress: 'warning', pending: 'grey' }[status] || 'grey'
}

function getStatusText(status) {
  return { completed: 'เสร็จสิ้น', in_progress: 'กำลังดำเนินการ', pending: 'รอดำเนินการ' }[status] || 'รอดำเนินการ'
}

onMounted(async () => {
  await fetchPeriods(true) // โหลด periods ที่ active

  // โหลด tasks ทั้งหมดและเลือก period ที่มีงาน
  await fetchAllTasks()
})

// เมื่อเปลี่ยน period ให้ filter tasks ใหม่
watch(selectedPeriod, () => {
  updateTasksForPeriod()
})
</script>

<template>
  <div class="pa-4">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon left color="primary">mdi-briefcase</v-icon>
        <span class="text-h5 ml-2">งานที่ได้รับมอบหมาย</span>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <PeriodSelector v-model="selectedPeriod" :periods="availablePeriods" />
          </v-col>
        </v-row>

        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <StatCard title="งานทั้งหมด" :value="summary.total" color="primary" />
          </v-col>
          <v-col cols="12" md="4">
            <StatCard title="เสร็จสิ้น" :value="summary.completed" color="success" />
          </v-col>
          <v-col cols="12" md="4">
            <StatCard title="รอดำเนินการ" :value="summary.pending" color="warning" />
          </v-col>
        </v-row>

        <AlertMessage type="error" :message="errorMsg" @clear="errorMsg = ''" />

        <div v-if="loading" class="text-center pa-8">
          <v-progress-circular indeterminate color="primary" />
        </div>
        <v-list v-else-if="tasks.length > 0">
          <v-list-item
            v-for="task in tasks"
            :key="task.id"
            class="mb-2"
            border
            rounded
          >
            <template #prepend>
              <v-avatar color="primary" size="56">
                <span class="text-h6 text-white">
                  {{ task.evaluatee_name?.charAt(0) || 'E' }}
                </span>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-bold">
              {{ task.evaluatee_name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              รอบการประเมิน: {{ task.period_name || 'N/A' }}
              <span v-if="task.created_at" class="ml-2">
                • มอบหมายเมื่อ: {{ new Date(task.created_at).toLocaleDateString('th-TH') }}
              </span>
            </v-list-item-subtitle>

            <template #append>
              <div class="d-flex flex-column align-end gap-2">
                <v-chip
                  :color="getStatusColor(task.status)"
                  size="small"
                >
                  {{ getStatusText(task.status) }}
                </v-chip>
                <v-btn
                  color="primary"
                  size="small"
                  @click="goToEvaluate(task)"
                >
                  <v-icon left>mdi-clipboard-edit</v-icon>
                  {{ task.status === 'completed' ? 'ดูรายละเอียด' : 'ให้คะแนน' }}
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>

        <div v-else class="text-center pa-8">
          <v-icon size="64" color="grey">mdi-briefcase-outline</v-icon>
          <div class="text-subtitle-1 mt-2">ไม่มีงานที่ได้รับมอบหมาย</div>
          <div class="text-caption text-grey mt-2">
            Period ที่เลือก: {{ selectedPeriod }}
            <br>
            เปิด Console (F12) เพื่อดู debug logs
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>