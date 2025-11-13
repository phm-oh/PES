<script setup>
defineProps({
  title: String,
  value: [String, Number],
  color: { type: String, default: 'primary' },
  icon: String
})
</script>

<template>
  <v-card :color="color" variant="tonal">
    <v-card-text class="text-center">
      <v-icon v-if="icon" size="32" class="mb-2">{{ icon }}</v-icon>
      <div class="text-h3 font-weight-bold">{{ value }}</div>
      <div class="text-subtitle-2 mt-2">{{ title }}</div>
    </v-card-text>
  </v-card>
</template>
