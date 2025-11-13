<script setup>
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { usePeriods } from '~/composables/usePeriods'

const { fetchData } = useApi()
const { periods, selectedPeriod, fetchPeriods } = usePeriods()
const loading = ref(false)
const results = ref([])

const progress = computed(() => {
  const total = results.value.length
  const completed = results.value.filter(r => r.self_score > 0).length
  return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 }
})

const evaluatorProgress = computed(() => {
  const total = results.value.length
  const completed = results.value.filter(r => r.evaluator_score > 0).length
  return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 }
})

async function loadProgress() {
  if (!selectedPeriod.value) return

  loading.value = true
  try {
    const res = await fetchData(`/api/results/me/${selectedPeriod.value}`)
    results.value = res.items || []
  } catch (e) {
    console.error('Load progress failed:', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchPeriods(true)
  if (selectedPeriod.value) loadProgress()
})
</script>

<template>
  <div>
    <v-card class="mb-6">
      <v-card-text>
        <h2 class="text-h5 mb-4">ความคืบหน้าของฉัน</h2>
        <v-row>
          <v-col cols="12" md="6">
            <v-card color="primary" variant="tonal">
              <v-card-text>
                <div class="d-flex align-center justify-space-between mb-2">
                  <span>การประเมินตนเอง</span>
                  <v-chip size="small">{{ progress.completed }}/{{ progress.total }}</v-chip>
                </div>
                <v-progress-linear :model-value="progress.percent" height="20" rounded>
                  <strong>{{ progress.percent }}%</strong>
                </v-progress-linear>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card color="success" variant="tonal">
              <v-card-text>
                <div class="d-flex align-center justify-space-between mb-2">
                  <span>การประเมินโดยกรรมการ</span>
                  <v-chip size="small">{{ evaluatorProgress.completed }}/{{ evaluatorProgress.total }}</v-chip>
                </div>
                <v-progress-linear :model-value="evaluatorProgress.percent" color="success" height="20" rounded>
                  <strong>{{ evaluatorProgress.percent }}%</strong>
                </v-progress-linear>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-text>
        <h3 class="text-h6 mb-4">Quick Actions</h3>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-btn block color="primary" to="/me/self-assess" prepend-icon="mdi-star-check">
              ประเมินตนเอง
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-btn block color="primary" to="/me/progress" prepend-icon="mdi-chart-line">
              ดูความคืบหน้า
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-btn block color="primary" to="/me/profile" prepend-icon="mdi-account">
              โปรไฟล์
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>
