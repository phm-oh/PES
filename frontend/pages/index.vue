<script setup>
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const router = useRouter()

if (!auth.isLogged) {
  router.push('/login')
}

const role = computed(() => {
  const r = auth.user?.role?.toLowerCase()
  return r === 'evaluatee' ? 'user' : r
})

const dashboardTitle = computed(() => {
  const titles = {
    admin: 'Admin Dashboard',
    evaluator: 'Evaluator Dashboard',
    user: 'My Dashboard'
  }
  return titles[role.value] || 'Dashboard'
})
</script>

<template>
  <div class="pa-4">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold">{{ dashboardTitle }}</h1>
      <p class="text-subtitle-1 text-medium-emphasis mt-2">
        ยินดีต้อนรับ {{ auth.user?.name_th || auth.user?.email }}
      </p>
    </div>

    <AdminDashboard v-if="role === 'admin'" />
    <EvaluatorDashboard v-else-if="role === 'evaluator'" />
    <EvaluateeDashboard v-else />
  </div>
</template>
