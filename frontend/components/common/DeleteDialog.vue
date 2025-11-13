<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="500px">
    <v-card>
      <v-card-title class="text-h5">ยืนยันการลบ</v-card-title>
      <v-card-text>
        คุณแน่ใจหรือว่าต้องการลบรายการนี้? การลบจะไม่สามารถยกเลิกได้
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="grey" variant="text" @click="$emit('update:modelValue', false)">
          ยกเลิก
        </v-btn>
        <v-btn color="error" variant="elevated" @click="$emit('confirm')" :loading="loading">
          ลบ
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  loading: Boolean
})

defineEmits(['update:modelValue', 'confirm'])
</script>
