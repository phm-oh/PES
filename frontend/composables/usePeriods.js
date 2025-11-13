import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

export function usePeriods() {
  const auth = useAuthStore()
  const config = useRuntimeConfig()

  const periods = ref([])
  const selectedPeriod = ref(null)
  const loading = ref(false)

  async function fetchPeriods(activeOnly = false) {
    loading.value = true
    try {
      const endpoint = activeOnly ? '/api/periods/active' : '/api/periods'
      const res = await $fetch(`${config.public.apiBase}${endpoint}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      periods.value = res.items || res || []
      if (periods.value.length > 0 && !selectedPeriod.value) {
        selectedPeriod.value = periods.value[0].id
      }
    } catch (e) {
      console.error('Load periods failed:', e)
    } finally {
      loading.value = false
    }
  }

  return {
    periods,
    selectedPeriod,
    loading,
    fetchPeriods
  }
}
