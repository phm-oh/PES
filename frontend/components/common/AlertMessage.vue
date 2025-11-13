<script setup>
const props = defineProps({
  type: { type: String, default: 'error' },
  message: String
})

const emit = defineEmits(['clear'])
</script>

<template>
  <v-alert
    v-if="message"
    :type="type"
    closable
    @click:close="emit('clear')"
    class="mb-4"
  >
    {{ message }}
  </v-alert>
</template>
