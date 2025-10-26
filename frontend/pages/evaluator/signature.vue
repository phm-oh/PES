<!-- frontend/pages/evaluator/signature.vue -->
<!-- 📋 หน้าลงนามดิจิทัล (Evaluator) -->
<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()

// ============= STATE =============
const canvas = ref(null)
const ctx = ref(null)
const isDrawing = ref(false)
const signatures = ref([])
const selectedResult = ref(null)
const results = ref([])
const loading = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// ============= METHODS =============
onMounted(() => {
  initCanvas()
  fetchResults()
  fetchSignatures()
})

function initCanvas() {
  if (!canvas.value) return
  
  ctx.value = canvas.value.getContext('2d')
  ctx.value.strokeStyle = '#000000'
  ctx.value.lineWidth = 2
  ctx.value.lineCap = 'round'
}

function startDrawing(e) {
  isDrawing.value = true
  const rect = canvas.value.getBoundingClientRect()
  ctx.value.beginPath()
  ctx.value.moveTo(e.clientX - rect.left, e.clientY - rect.top)
}

function draw(e) {
  if (!isDrawing.value) return
  
  const rect = canvas.value.getBoundingClientRect()
  ctx.value.lineTo(e.clientX - rect.left, e.clientY - rect.top)
  ctx.value.stroke()
}

function stopDrawing() {
  isDrawing.value = false
}

function clearCanvas() {
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
}

async function fetchResults() {
  try {
    // ดึงรายการผลประเมินที่ยังไม่มีลายเซ็น
    const res = await $fetch(`${config.public.apiBase}/api/results`, {
      params: { 
        evaluator_id: auth.user.id,
        status: 'completed'
      },
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    results.value = res.items || []
  } catch (e) {
    console.error('Load results failed:', e)
  }
}

async function fetchSignatures() {
  loading.value = true
  try {
    const res = await $fetch(`${config.public.apiBase}/api/signatures/evaluator/${auth.user.id}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    signatures.value = res.items || []
  } catch (e) {
    console.error('Load signatures failed:', e)
  } finally {
    loading.value = false
  }
}

async function saveSignature() {
  if (!selectedResult.value) {
    errorMsg.value = 'กรุณาเลือกผลการประเมิน'
    return
  }

  errorMsg.value = ''
  successMsg.value = ''
  saving.value = true

  try {
    // แปลง canvas เป็น base64
    const signatureData = canvas.value.toDataURL('image/png')
    
    await $fetch(`${config.public.apiBase}/api/signatures`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json'
      },
      body: {
        result_id: selectedResult.value,
        evaluator_id: auth.user.id,
        signature_data: signatureData
      }
    })

    successMsg.value = 'บันทึกลายเซ็นสำเร็จ'
    clearCanvas()
    selectedResult.value = null
    await fetchSignatures()
    await fetchResults()
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Save failed'
  } finally {
    saving.value = false
  }
}

async function deleteSignature(id) {
  if (!confirm('ต้องการลบลายเซ็นนี้ใช่หรือไม่?')) return

  try {
    await $fetch(`${config.public.apiBase}/api/signatures/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    successMsg.value = 'ลบลายเซ็นสำเร็จ'
    await fetchSignatures()
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Delete failed'
  }
}
</script>

<template>
  <div class="pa-4">
    <v-row>
      <!-- Canvas ลงนาม -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon left color="primary">mdi-draw</v-icon>
            <span class="text-h6 ml-2">ลงนามดิจิทัล</span>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <v-alert v-if="errorMsg" type="error" dismissible @click:close="errorMsg = ''">
              {{ errorMsg }}
            </v-alert>
            <v-alert v-if="successMsg" type="success" dismissible @click:close="successMsg = ''">
              {{ successMsg }}
            </v-alert>

            <!-- เลือกผลการประเมิน -->
            <v-select
              v-model="selectedResult"
              :items="results"
              item-title="evaluatee_name"
              item-value="id"
              label="เลือกผลการประเมิน"
              class="mb-4"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <v-list-item-title>{{ item.raw.evaluatee_name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ item.raw.period_name }}</v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-select>

            <!-- Canvas -->
            <div class="text-center mb-4">
              <canvas
                ref="canvas"
                width="500"
                height="200"
                style="border: 2px solid #ccc; border-radius: 8px; cursor: crosshair; touch-action: none;"
                @mousedown="startDrawing"
                @mousemove="draw"
                @mouseup="stopDrawing"
                @mouseleave="stopDrawing"
              />
            </div>

            <!-- Actions -->
            <div class="d-flex gap-2">
              <v-btn color="grey" variant="outlined" @click="clearCanvas" block>
                <v-icon left>mdi-eraser</v-icon>
                ล้าง
              </v-btn>
              <v-btn
                color="primary"
                variant="elevated"
                @click="saveSignature"
                :loading="saving"
                :disabled="!selectedResult"
                block
              >
                <v-icon left>mdi-content-save</v-icon>
                บันทึก
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- รายการลายเซ็น -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon left color="success">mdi-check-decagram</v-icon>
            <span class="text-h6 ml-2">ลายเซ็นที่บันทึกแล้ว</span>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <!-- Loading -->
            <div v-if="loading" class="text-center pa-8">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <!-- Signature List -->
            <v-list v-else-if="signatures.length > 0">
              <v-list-item
                v-for="sig in signatures"
                :key="sig.id"
                class="mb-2"
                border
                rounded
              >
                <template #prepend>
                  <img
                    :src="sig.signature_data"
                    alt="Signature"
                    style="width: 100px; height: 50px; object-fit: contain; border: 1px solid #ccc; border-radius: 4px;"
                  />
                </template>

                <v-list-item-title>{{ sig.evaluatee_name || 'ผู้ถูกประเมิน' }}</v-list-item-title>
                <v-list-item-subtitle>
                  ลงนามเมื่อ: {{ new Date(sig.signed_at).toLocaleDateString('th-TH') }}
                </v-list-item-subtitle>

                <template #append>
                  <v-btn
                    icon
                    size="small"
                    color="error"
                    variant="text"
                    @click="deleteSignature(sig.id)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>

            <!-- No Data -->
            <div v-else class="text-center pa-8">
              <v-icon size="64" color="grey">mdi-draw-pen</v-icon>
              <div class="text-subtitle-1 mt-2">ยังไม่มีลายเซ็น</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
canvas {
  background-color: #ffffff;
}
</style>