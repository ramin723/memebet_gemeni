<template>
  <div>
    <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
      داشبورد اصلی
    </h1>
    <p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
      نمای کلی و آمار لحظه‌ای پلتفرم MemeBet
    </p>

    <div v-if="pending" class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UCard v-for="i in 4" :key="i" class="animate-pulse">
        <div class="h-8 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-md" />
        <div class="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded-md mt-4" />
        <div class="h-8 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-md mt-1" />
      </UCard>
    </div>

    <div v-else-if="error" class="mt-8">
      <UAlert
        icon="i-heroicons-exclamation-triangle"
        color="red"
        variant="soft"
        title="خطا در دریافت اطلاعات"
        :description="error.message"
      >
        <template #actions>
          <UButton color="red" variant="ghost" @click="refresh">تلاش مجدد</UButton>
        </template>
      </UAlert>
    </div>

    <div v-else-if="stats" class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-users" class="text-xl" />
            <h3 class="font-semibold">کاربران</h3>
          </div>
        </template>
        <p class="text-3xl font-bold">{{ stats.overview.users.total }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">کاربر کل</p>
      </UCard>

      <UCard>
        <template #header>
           <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-calendar-days" class="text-xl" />
            <h3 class="font-semibold">رویدادها</h3>
          </div>
        </template>
        <p class="text-3xl font-bold">{{ stats.overview.events.active }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">رویداد فعال</p>
      </UCard>

      <UCard>
        <template #header>
           <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-receipt-percent" class="text-xl" />
            <h3 class="font-semibold">شرط‌ها</h3>
          </div>
        </template>
        <p class="text-3xl font-bold">{{ stats.overview.bets.total }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">شرط ثبت شده</p>
      </UCard>

      <UCard>
        <template #header>
           <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-flag" class="text-xl text-orange-500" />
            <h3 class="font-semibold">گزارش‌های در انتظار</h3>
          </div>
        </template>
        <p class="text-3xl font-bold text-orange-500">{{ stats.overview.reports.pending }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">نیاز به بررسی</p>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
});

const { data: statsResponse, pending, error, refresh } = await useFetch('/api/admin/analytics/overview');

const stats = computed(() => statsResponse.value?.data);
</script>