<script setup>
const props = defineProps({
  modelValue: [String, Number],
  periods: { type: Array, default: () => [] },
  label: { type: String, default: 'เลือกรอบการประเมิน' }
})

const emit = defineEmits(['update:modelValue'])

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <v-select
    v-model="value"
    :items="periods"
    item-title="name_th"
    item-value="id"
    :label="label"
    density="comfortable"
    variant="outlined"
  />
</template>
