<template>
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">مدیریت رویدادها</h1>
      <p class="mt-1 text-sm text-gray-500">
        ایجاد، ویرایش و مدیریت رویدادهای پیش‌بینی
      </p>
    </div>
    <div>
      <UButton
        to="/admin/events/create/"
        icon="i-heroicons-plus-circle"
        size="lg"
      >
        ایجاد رویداد جدید
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
// No emits needed anymore - using UButton's built-in navigation
</script>
