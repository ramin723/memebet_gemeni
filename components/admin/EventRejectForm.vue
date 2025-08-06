<template>
  <UCard>
    <template #header>
      <h3 class="text-base font-semibold">رد کردن رویداد</h3>
    </template>

    <UFormGroup label="دلیل رد کردن (اجباری)" name="adminNote">
      <UTextarea v-model="adminNote" placeholder="لطفاً دلیل رد کردن رویداد را بنویسید..." />
    </UFormGroup>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="$emit('close')">انصراف</UButton>
        <UButton color="error" :disabled="!adminNote.trim()" @click="onSubmit">رد کن</UButton>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
const adminNote = ref('')

const emit = defineEmits<{
  close: []
  submit: [adminNote: string]
}>()

function onSubmit() {
  emit('submit', adminNote.value)
}
</script> 