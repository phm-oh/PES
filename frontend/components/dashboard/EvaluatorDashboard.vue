<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { usePeriods } from '~/composables/usePeriods'

const { fetchData } = useApi()
const { periods, selectedPeriod, fetchPeriods } = usePeriods()
const loading = ref(false)
const tasks = ref([])
const stats = ref({ total: 0, completed: 0, pending: 0 })

async function loadTasks() {
  if (!selectedPeriod.value) return

  loading.value = true
  try {
    const res = await fetchData(`/api/assignments/mine?period_id=${selectedPeriod.value}`)
    tasks.value = (res.items || []).slice(0, 5)

    stats.value = {
      total: res.items?.length || 0,
      completed: res.items?.filter(t => t.status === 'completed').length || 0,
      pending: res.items?.filter(t => t.status === 'pending').length || 0
    }
  } catch (e) {
    console.error('Load tasks failed:', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchPeriods(true)
  if (selectedPeriod.value) loadTasks()
})
</script>

<template>
  <div>
    <v-card class="mb-6">
      <v-card-text>
        <h2 class="text-h5 mb-4">งานของฉัน</h2>
        <v-row>
          <v-col cols="12" sm="4">
            <StatCard title="งานทั้งหมด" :value="stats.total" color="primary" icon="mdi-clipboard-list" />
          </v-col>
          <v-col cols="12" sm="4">
            <StatCard title="เสร็จแล้ว" :value="stats.completed" color="success" icon="mdi-check-circle" />
          </v-col>
          <v-col cols="12" sm="4">
            <StatCard title="รอดำเนินการ" :value="stats.pending" color="warning" icon="mdi-clock-alert" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title>งานล่าสุด</v-card-title>
      <v-card-text>
        <v-list v-if="tasks.length">
          <v-list-item v-for="task in tasks" :key="task.id" :to="`/evaluator/evaluate/${task.evaluatee_id}?period=${selectedPeriod}`">
            <v-list-item-title>{{ task.evaluatee_name }}</v-list-item-title>
            <template #append>
              <v-chip :color="task.status === 'completed' ? 'success' : 'warning'" size="small">
                {{ task.status === 'completed' ? 'เสร็จแล้ว' : 'รอดำเนินการ' }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
        <div v-else class="text-center py-8 text-medium-emphasis">
          ไม่มีงานในขณะนี้
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" to="/evaluator/tasks">ดูทั้งหมด</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
