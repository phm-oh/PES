<!-- frontend/pages/me/profile.vue -->
<!-- 📋 หน้าโปรไฟล์ + แก้ไขข้อมูล (Evaluatee) -->
<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()

// ============= STATE =============
const user = ref({
  id: null,
  name_th: '',
  email: '',
  role: ''
})
const editMode = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// ============= METHODS =============
async function fetchProfile() {
  loading.value = true
  try {
    const res = await $fetch(`${config.public.apiBase}/api/users/${auth.user.id}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    user.value = res.data
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  errorMsg.value = ''
  successMsg.value = ''
  
  if (!user.value.name_th || !user.value.email) {
    errorMsg.value = 'กรุณากรอกข้อมูลให้ครบ'
    return
  }

  loading.value = true
  try {
    await $fetch(`${config.public.apiBase}/api/users/${user.value.id}`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json'
      },
      body: {
        name_th: user.value.name_th,
        email: user.value.email
      }
    })
    successMsg.value = 'บันทึกสำเร็จ'
    editMode.value = false
    
    // อัปเดต store
    auth.user.name = user.value.name_th
    auth.user.email = user.value.email
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Save failed'
  } finally {
    loading.value = false
  }
}

function cancelEdit() {
  editMode.value = false
  fetchProfile()
}

// ============= LIFECYCLE =============
onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div class="pa-4">
    <v-card max-width="800" class="mx-auto">
      <v-card-title class="d-flex align-center">
        <v-icon left color="primary">mdi-account-circle</v-icon>
        <span class="text-h5 ml-2">โปรไฟล์</span>
        <v-spacer />
        <v-btn
          v-if="!editMode"
          color="primary"
          variant="text"
          @click="editMode = true"
        >
          <v-icon left>mdi-pencil</v-icon>
          แก้ไข
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-alert v-if="errorMsg" type="error" dismissible @click:close="errorMsg = ''">
          {{ errorMsg }}
        </v-alert>
        <v-alert v-if="successMsg" type="success" dismissible @click:close="successMsg = ''">
          {{ successMsg }}
        </v-alert>

        <v-container v-if="!loading">
          <v-row>
            <!-- Avatar -->
            <v-col cols="12" class="d-flex justify-center mb-4">
              <v-avatar size="120" color="primary">
                <span class="text-h3 text-white">
                  {{ user.name_th?.charAt(0) || 'U' }}
                </span>
              </v-avatar>
            </v-col>

            <!-- ชื่อ-สกุล -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="user.name_th"
                label="ชื่อ-สกุล"
                prepend-icon="mdi-account"
                :readonly="!editMode"
                :variant="editMode ? 'outlined' : 'plain'"
              />
            </v-col>

            <!-- อีเมล -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="user.email"
                label="อีเมล"
                type="email"
                prepend-icon="mdi-email"
                :readonly="!editMode"
                :variant="editMode ? 'outlined' : 'plain'"
              />
            </v-col>

            <!-- บทบาท -->
            <v-col cols="12" md="6">
              <v-text-field
                :model-value="user.role === 'evaluatee' ? 'ผู้ถูกประเมิน' : user.role"
                label="บทบาท"
                prepend-icon="mdi-shield-account"
                readonly
                variant="plain"
              />
            </v-col>

            <!-- วันที่สร้าง -->
            <v-col cols="12" md="6">
              <v-text-field
                :model-value="user.created_at ? new Date(user.created_at).toLocaleDateString('th-TH') : '-'"
                label="วันที่สร้าง"
                prepend-icon="mdi-calendar"
                readonly
                variant="plain"
              />
            </v-col>
          </v-row>
        </v-container>

        <!-- Loading -->
        <div v-else class="text-center pa-8">
          <v-progress-circular indeterminate color="primary" />
        </div>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions v-if="editMode">
        <v-spacer />
        <v-btn color="grey" variant="text" @click="cancelEdit">
          ยกเลิก
        </v-btn>
        <v-btn color="primary" variant="elevated" @click="saveProfile" :loading="loading">
          บันทึก
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>