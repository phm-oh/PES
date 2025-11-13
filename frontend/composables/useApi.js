import { useAuthStore } from '~/stores/auth'

export function useApi() {
  const auth = useAuthStore()
  const config = useRuntimeConfig()

  function getHeaders() {
    return { Authorization: `Bearer ${auth.token}` }
  }

  async function fetchData(endpoint, options = {}) {
    return await $fetch(`${config.public.apiBase}${endpoint}`, {
      ...options,
      headers: { ...getHeaders(), ...options.headers }
    })
  }

  return {
    fetchData,
    getHeaders,
    baseUrl: config.public.apiBase
  }
}
