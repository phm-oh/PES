<script setup>
const props = defineProps({
  type: { type: String, default: 'info' },
  message: String,
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-alert
    v-if="modelValue && message"
    :type="type"
    closable
    @click:close="close"
    class="mb-4"
  >
    {{ message }}
  </v-alert>
</template>
