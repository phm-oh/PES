<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'

const { fetchData } = useApi()
const loading = ref(false)
const stats = ref({
  users: 0,
  periods: 0,
  assignments: 0,
  completionRate: 0
})

async function loadStats() {
  loading.value = true
  try {
    const [usersRes, periodsRes, assignmentsRes] = await Promise.all([
      fetchData('/api/users').catch(() => ({ total: 0 })),
      fetchData('/api/periods').catch(() => ({ total: 0 })),
      fetchData('/api/assignments').catch(() => ({ total: 0 }))
    ])

    stats.value = {
      users: usersRes.total || 0,
      periods: periodsRes.total || 0,
      assignments: assignmentsRes.total || 0,
      completionRate: 0
    }
  } catch (e) {
    console.error('Load stats failed:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>

<template>
  <div>
    <v-card class="mb-6">
      <v-card-text>
        <h2 class="text-h5 mb-4">ภาพรวมระบบ</h2>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <StatCard title="ผู้ใช้ทั้งหมด" :value="stats.users" color="primary" icon="mdi-account-group" />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <StatCard title="รอบการประเมิน" :value="stats.periods" color="info" icon="mdi-calendar-range" />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <StatCard title="งานมอบหมาย" :value="stats.assignments" color="warning" icon="mdi-clipboard-text" />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <StatCard title="อัตราความสำเร็จ" :value="`${stats.completionRate}%`" color="success" icon="mdi-chart-line" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-text>
        <h3 class="text-h6 mb-4">Quick Actions</h3>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-btn block color="primary" to="/admin/periods" prepend-icon="mdi-calendar">
              จัดการรอบประเมิน
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-btn block color="primary" to="/admin/assignments" prepend-icon="mdi-account-multiple-check">
              มอบหมายกรรมการ
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-btn block color="primary" to="/admin/reports" prepend-icon="mdi-chart-box">
              ดูรายงาน
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>
