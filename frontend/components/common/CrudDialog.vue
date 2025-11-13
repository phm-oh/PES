<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="600px">
    <v-card>
      <v-card-title>
        <span class="text-h5">{{ title }}</span>
      </v-card-title>

      <v-card-text>
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="$emit('update:error', '')">
          {{ error }}
        </v-alert>

        <slot name="form" />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="grey" variant="text" @click="$emit('update:modelValue', false)">
          ยกเลิก
        </v-btn>
        <v-btn color="primary" variant="elevated" @click="$emit('save')" :loading="saving">
          บันทึก
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  title: String,
  error: String,
  saving: Boolean
})

defineEmits(['update:modelValue', 'update:error', 'save'])
</script>
