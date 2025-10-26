<!-- frontend/pages/me/self-assess.vue -->
<!-- 📋 หน้าประเมินตนเอง + อัปโหลดหลักฐาน (Evaluatee) -->
<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()

// ============= STATE =============
const periods = ref([])
const selectedPeriod = ref(null)
const topics = ref([])
const results = ref({}) // { indicator_id: { score, files: [] } }
const loading = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// ============= METHODS =============
async function fetchPeriods() {
  try {
    const res = await $fetch(`${config.public.apiBase}/api/attachments/periods/active`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    periods.value = res || []
    if (periods.value.length > 0) {
      selectedPeriod.value = periods.value[0].id
      fetchIndicators()
    }
  } catch (e) {
    console.error('Load periods failed:', e)
  }
}

async function fetchIndicators() {
  if (!selectedPeriod.value) return
  
  loading.value = true
  errorMsg.value = ''
  try {
    // ดึง topics + indicators
    const topicsRes = await $fetch(`${config.public.apiBase}/api/topics/active`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    
    const indicatorsRes = await $fetch(`${config.public.apiBase}/api/attachments/indicators`, {
      params: { period_id: selectedPeriod.value },
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    
    // จัดกลุ่ม indicators ตาม topic
    const topicsData = topicsRes.items || []
    const indicatorsData = indicatorsRes || []
    
    topics.value = topicsData.map(topic => ({
      ...topic,
      indicators: indicatorsData.filter(ind => ind.topic_id === topic.id)
    })).filter(topic => topic.indicators.length > 0)

    // โหลดผลประเมินเดิม (ถ้ามี)
    await fetchMyResults()
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

async function fetchMyResults() {
  try {
    const res = await $fetch(`${config.public.apiBase}/api/results/me/${selectedPeriod.value}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    
    // แปลงเป็น object { indicator_id: { score, ... } }
    const items = res.items || []
    results.value = items.reduce((acc, item) => {
      acc[item.indicator_id] = {
        score: item.self_score || 0,
        files: []
      }
      return acc
    }, {})
  } catch (e) {
    console.error('Load results failed:', e)
  }
}

async function handleFileUpload(indicatorId, event) {
  const files = event.target.files
  if (!files || files.length === 0) return

  const formData = new FormData()
  formData.append('file', files[0])

  try {
    const res = await $fetch(`${config.public.apiBase}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}` },
      body: formData
    })
    
    // เก็บ URL ไฟล์
    if (!results.value[indicatorId]) {
      results.value[indicatorId] = { score: 0, files: [] }
    }
    results.value[indicatorId].files.push(res.url)
    successMsg.value = 'อัปโหลดสำเร็จ'
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Upload failed'
  }
}

function removeFile(indicatorId, fileIndex) {
  if (results.value[indicatorId]) {
    results.value[indicatorId].files.splice(fileIndex, 1)
  }
}

async function saveDraft() {
  await saveResults('draft')
}

async function submitResults() {
  // ตรวจสอบว่ากรอกครบทุก indicator หรือไม่
  const allIndicators = topics.value.flatMap(t => t.indicators)
  const missing = allIndicators.filter(ind => {
    const result = results.value[ind.id]
    return !result || result.score === 0
  })

  if (missing.length > 0) {
    errorMsg.value = `กรุณากรอกคะแนนให้ครบ (ขาด ${missing.length} รายการ)`
    return
  }

  await saveResults('submitted')
}

async function saveResults(status = 'draft') {
  errorMsg.value = ''
  successMsg.value = ''
  saving.value = true

  try {
    // แปลง results เป็น array
    const items = Object.entries(results.value).map(([indicator_id, data]) => ({
      indicator_id: Number(indicator_id),
      period_id: selectedPeriod.value,
      score: data.score || 0
    }))

    await $fetch(`${config.public.apiBase}/api/results/self/bulk`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json'
      },
      body: { items }
    })

    successMsg.value = status === 'draft' ? 'บันทึกแบบร่างสำเร็จ' : 'ส่งการประเมินสำเร็จ'
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Save failed'
  } finally {
    saving.value = false
  }
}

function getScore(indicatorId) {
  return results.value[indicatorId]?.score || 0
}

function setScore(indicatorId, score) {
  if (!results.value[indicatorId]) {
    results.value[indicatorId] = { score: 0, files: [] }
  }
  results.value[indicatorId].score = score
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
        <v-icon left color="primary">mdi-clipboard-edit</v-icon>
        <span class="text-h5 ml-2">ประเมินตนเอง</span>
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
              @update:model-value="fetchIndicators"
            />
          </v-col>
        </v-row>

        <v-alert v-if="errorMsg" type="error" dismissible @click:close="errorMsg = ''">
          {{ errorMsg }}
        </v-alert>
        <v-alert v-if="successMsg" type="success" dismissible @click:close="successMsg = ''">
          {{ successMsg }}
        </v-alert>

        <!-- Loading -->
        <div v-if="loading" class="text-center pa-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <!-- Indicators by Topic -->
        <v-expansion-panels v-else>
          <v-expansion-panel v-for="topic in topics" :key="topic.id">
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-icon left>mdi-folder-outline</v-icon>
                <strong>{{ topic.title_th }}</strong>
                <v-spacer />
                <v-chip size="small" class="mr-2">
                  {{ topic.indicators.length }} รายการ
                </v-chip>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list>
                <v-list-item v-for="indicator in topic.indicators" :key="indicator.id" class="mb-4">
                  <v-list-item-title class="font-weight-bold mb-2">
                    {{ indicator.name_th }}
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="indicator.description" class="mb-3">
                    {{ indicator.description }}
                  </v-list-item-subtitle>

                  <!-- คะแนน -->
                  <div class="d-flex align-center mb-3">
                    <span class="mr-4">คะแนน:</span>
                    <v-slider
                      :model-value="getScore(indicator.id)"
                      @update:model-value="setScore(indicator.id, $event)"
                      :min="0"
                      :max="indicator.type === 'yes_no' ? 1 : 10"
                      :step="1"
                      thumb-label
                      :color="getScore(indicator.id) > 0 ? 'primary' : 'grey'"
                      class="flex-grow-1"
                    />
                    <v-chip class="ml-4" color="primary">
                      {{ getScore(indicator.id) }}
                    </v-chip>
                  </div>

                  <!-- อัปโหลดหลักฐาน -->
                  <div class="mb-2">
                    <v-btn
                      size="small"
                      color="info"
                      variant="outlined"
                      @click="$refs[`file_${indicator.id}`][0].click()"
                    >
                      <v-icon left>mdi-upload</v-icon>
                      อัปโหลดหลักฐาน
                    </v-btn>
                    <input
                      :ref="`file_${indicator.id}`"
                      type="file"
                      hidden
                      @change="handleFileUpload(indicator.id, $event)"
                    />
                  </div>

                  <!-- แสดงไฟล์ที่อัปโหลด -->
                  <v-chip
                    v-for="(file, idx) in results[indicator.id]?.files || []"
                    :key="idx"
                    size="small"
                    closable
                    @click:close="removeFile(indicator.id, idx)"
                    class="mr-2 mb-2"
                  >
                    {{ file.split('/').pop() }}
                  </v-chip>

                  <v-divider class="mt-4" />
                </v-list-item>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- No Data -->
        <div v-if="!loading && topics.length === 0" class="text-center pa-8">
          <v-icon size="64" color="grey">mdi-file-document-outline</v-icon>
          <div class="text-subtitle-1 mt-2">ไม่มีตัวชี้วัด</div>
        </div>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          color="grey"
          variant="outlined"
          @click="saveDraft"
          :loading="saving"
          :disabled="topics.length === 0"
        >
          <v-icon left>mdi-content-save</v-icon>
          บันทึกแบบร่าง
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          @click="submitResults"
          :loading="saving"
          :disabled="topics.length === 0"
        >
          <v-icon left>mdi-send</v-icon>
          ส่งการประเมิน
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>