<template>
  <div class="h-full flex flex-col justify-between">
    <div>
      <div class="p-4">
        <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200">MemeBet</h2>
      </div>
      
      <nav class="px-2 space-y-1">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="group flex items-center px-2 py-2 text-sm font-medium rounded-md"
          active-class="bg-gray-100 dark:bg-gray-800 text-primary-600 dark:text-primary-400"
          inactive-class="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
        >
          <UIcon 
            :name="link.icon" 
            class="mr-3 h-6 w-6 flex-shrink-0"
            :class="{ 
              'text-primary-500 dark:text-primary-400': $route.path === link.to, 
              'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400': $route.path !== link.to 
            }"
          />
          {{ link.label }}
        </NuxtLink>
      </nav>
    </div>

    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3">
        <UAvatar
          src="https://avatars.githubusercontent.com/u/739984?v=4"
          alt="Avatar"
        />
        <div class="text-sm">
          <p class="font-medium text-gray-900 dark:text-white">
            Super Admin
          </p>
          <p class="text-gray-500 dark:text-gray-400">
            ادمین کل
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const links = [
  {
    label: 'داشبورد',
    icon: 'i-heroicons-home',
    to: '/admin'
  },
  {
    label: 'مدیریت رویدادها',
    icon: 'i-heroicons-calendar-days',
    to: '/admin/events'
  },
  {
    label: 'مدیریت کاربران',
    icon: 'i-heroicons-users',
    to: '/admin/users'
  },
  {
    label: 'تراکنش‌های مالی',
    icon: 'i-heroicons-receipt-percent',
    to: '/admin/financials'
  },
  {
    label: 'گزارش‌های تخلف',
    icon: 'i-heroicons-flag',
    to: '/admin/reports'
  }
];
</script>