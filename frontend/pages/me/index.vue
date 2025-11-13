<script setup>
definePageMeta({ layout: 'dashboard' })

const router = useRouter()

onMounted(() => {
  router.push('/me/progress')
})
</script>

<template>
  <div class="pa-4 text-center">
    <v-progress-circular indeterminate color="primary" />
    <p class="mt-4">Loading...</p>
  </div>
</template>
