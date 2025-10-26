<!-- frontend/pages/me/progress.vue -->
<!-- 📋 หน้าติดตามความคืบหน้า (Evaluatee) -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()

// ============= STATE =============
const periods = ref([])
const selectedPeriod = ref(null)
const results = ref([])
const assignments = ref([])
const loading = ref(false)
const errorMsg = ref('')

// ============= COMPUTED =============
const progress = computed(() => {
  if (results.value.length === 0) return { completed: 0, total: 0, percent: 0 }
  
  const total = results.value.length
  const completed = results.value.filter(r => r.self_score > 0).length
  const percent = Math.round((completed / total) * 100)
  
  return { completed, total, percent }
})

const totalScore = computed(() => {
  return results.value.reduce((sum, r) => sum + (r.self_score || 0), 0)
})

const evaluatorProgress = computed(() => {
  if (results.value.length === 0) return { completed: 0, total: 0, percent: 0 }
  
  const total = results.value.length
  const completed = results.value.filter(r => r.evaluator_score > 0).length
  const percent = Math.round((completed / total) * 100)
  
  return { completed, total, percent }
})

// ============= METHODS =============
async function fetchPeriods() {
  try {
    const res = await $fetch(`${config.public.apiBase}/api/attachments/periods/active`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    periods.value = res || []
    if (periods.value.length > 0) {
      selectedPeriod.value = periods.value[0].id
      fetchProgress()
    }
  } catch (e) {
    console.error('Load periods failed:', e)
  }
}

async function fetchProgress() {
  if (!selectedPeriod.value) return
  
  loading.value = true
  errorMsg.value = ''
  try {
    // ดึงผลประเมิน
    const resultsRes = await $fetch(`${config.public.apiBase}/api/results/me/${selectedPeriod.value}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    results.value = resultsRes.items || []

    // ดึงข้อมูลกรรมการ
    const assignRes = await $fetch(`${config.public.apiBase}/api/assignments`, {
      params: { 
        period_id: selectedPeriod.value,
        evaluatee_id: auth.user.id
      },
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    assignments.value = assignRes.items || []
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

function getProgressColor(percent) {
  if (percent >= 100) return 'success'
  if (percent >= 50) return 'warning'
  return 'error'
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
        <v-icon left color="primary">mdi-chart-line</v-icon>
        <span class="text-h5 ml-2">ติดตามความคืบหน้า</span>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <!-- Filter Period -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedPeriod"
              :items="periods"
              item-title="name_th"
              item-value="id"
              label="เลือกรอบการประเมิน"
              @update:model-value="fetchProgress"
            />
          </v-col>
        </v-row>

        <v-alert v-if="errorMsg" type="error" dismissible @click:close="errorMsg = ''">
          {{ errorMsg }}
        </v-alert>

        <!-- Loading -->
        <div v-if="loading" class="text-center pa-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <div v-else>
          <!-- Progress Cards -->
          <v-row class="mb-4">
            <!-- ประเมินตนเอง -->
            <v-col cols="12" md="6">
              <v-card color="primary" variant="tonal">
                <v-card-title>
                  <v-icon left>mdi-account-check</v-icon>
                  การประเมินตนเอง
                </v-card-title>
                <v-card-text>
                  <div class="text-h4 mb-2">{{ progress.completed }} / {{ progress.total }}</div>
                  <v-progress-linear
                    :model-value="progress.percent"
                    :color="getProgressColor(progress.percent)"
                    height="20"
                    rounded
                  >
                    <strong>{{ progress.percent }}%</strong>
                  </v-progress-linear>
                  <div class="text-subtitle-1 mt-2">
                    คะแนนรวม: <strong>{{ totalScore }}</strong>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- การประเมินโดยกรรมการ -->
            <v-col cols="12" md="6">
              <v-card color="success" variant="tonal">
                <v-card-title>
                  <v-icon left>mdi-account-star</v-icon>
                  การประเมินโดยกรรมการ
                </v-card-title>
                <v-card-text>
                  <div class="text-h4 mb-2">{{ evaluatorProgress.completed }} / {{ evaluatorProgress.total }}</div>
                  <v-progress-linear
                    :model-value="evaluatorProgress.percent"
                    :color="getProgressColor(evaluatorProgress.percent)"
                    height="20"
                    rounded
                  >
                    <strong>{{ evaluatorProgress.percent }}%</strong>
                  </v-progress-linear>
                  <div class="text-subtitle-1 mt-2">
                    กรรมการ: <strong>{{ assignments.length }}</strong> คน
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- กรรมการที่ได้รับมอบหมาย -->
          <v-card class="mb-4" v-if="assignments.length > 0">
            <v-card-title>
              <v-icon left>mdi-account-group</v-icon>
              กรรมการผู้ประเมิน
            </v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item v-for="assign in assignments" :key="assign.id">
                  <template #prepend>
                    <v-avatar color="primary">
                      <span class="text-white">{{ assign.evaluator_name?.charAt(0) || 'E' }}</span>
                    </v-avatar>
                  </template>
                  <v-list-item-title>{{ assign.evaluator_name }}</v-list-item-title>
                  <v-list-item-subtitle>มอบหมายเมื่อ: {{ new Date(assign.assigned_at).toLocaleDateString('th-TH') }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- รายละเอียดตัวชี้วัด -->
          <v-card>
            <v-card-title>
              <v-icon left>mdi-clipboard-list</v-icon>
              รายละเอียดการประเมิน
            </v-card-title>
            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th>ตัวชี้วัด</th>
                    <th class="text-center">คะแนนตนเอง</th>
                    <th class="text-center">คะแนนกรรมการ</th>
                    <th class="text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="result in results" :key="result.id">
                    <td>{{ result.indicator_name || '-' }}</td>
                    <td class="text-center">
                      <v-chip size="small" :color="result.self_score > 0 ? 'primary' : 'grey'">
                        {{ result.self_score || 0 }}
                      </v-chip>
                    </td>
                    <td class="text-center">
                      <v-chip size="small" :color="result.evaluator_score > 0 ? 'success' : 'grey'">
                        {{ result.evaluator_score || 0 }}
                      </v-chip>
                    </td>
                    <td class="text-center">
                      <v-chip
                        size="small"
                        :color="result.evaluator_score > 0 ? 'success' : result.self_score > 0 ? 'warning' : 'grey'"
                      >
                        {{ result.evaluator_score > 0 ? 'เสร็จสิ้น' : result.self_score > 0 ? 'รอประเมิน' : 'ยังไม่เริ่ม' }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <!-- No Data -->
              <div v-if="results.length === 0" class="text-center pa-8">
                <v-icon size="64" color="grey">mdi-file-document-outline</v-icon>
                <div class="text-subtitle-1 mt-2">ยังไม่มีข้อมูล</div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>
