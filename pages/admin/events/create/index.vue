<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">ایجاد رویداد جدید</h1>
            <p class="mt-2 text-gray-600">نوع ایجاد رویداد مورد نظر خود را انتخاب کنید</p>
          </div>
          <NuxtLink 
            to="/admin/events" 
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UIcon name="i-heroicons-arrow-right" class="ml-2 h-4 w-4" />
            بازگشت به لیست رویدادها
          </NuxtLink>
        </div>
      </div>

      <!-- Creation Options -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <!-- Option 1: Free Form -->
        <UCard class="hover:shadow-lg transition-shadow duration-200">
          <template #header>
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <UIcon name="i-heroicons-pencil-square" class="h-6 w-6 text-blue-600" />
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-semibold text-gray-900">فرم آزاد</h3>
                <p class="text-sm text-gray-500">ایجاد رویداد بدون محدودیت</p>
              </div>
            </div>
          </template>
          
          <div class="space-y-4">
            <p class="text-gray-600">ایجاد رویداد کاملاً سفارشی با عنوان، توضیحات و نتایج دلخواه شما.</p>
            
            <div class="space-y-2">
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>عنوان و توضیحات آزاد</span>
              </div>
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>نتایج نامحدود</span>
              </div>
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>انعطاف‌پذیری کامل</span>
              </div>
            </div>
            
            <UButton 
              to="/admin/events/create/free-form" 
              color="primary" 
              variant="solid" 
              class="w-full"
            >
              شروع فرم آزاد
            </UButton>
          </div>
        </UCard>

        <!-- Option 2: Template Based -->
        <UCard class="hover:shadow-lg transition-shadow duration-200">
          <template #header>
            <div class="flex items-center">
              <div class="p-2 bg-purple-100 rounded-lg">
                <UIcon name="i-heroicons-squares-2x2" class="h-6 w-6 text-purple-600" />
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-semibold text-gray-900">بر اساس قالب</h3>
                <p class="text-sm text-gray-500">استفاده از قالب‌های آماده</p>
              </div>
            </div>
          </template>
          
          <div class="space-y-4">
            <p class="text-gray-600">استفاده از قالب‌های آماده و بهینه‌سازی شده برای انواع مختلف رویدادها.</p>
            
            <div class="space-y-2">
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>قالب‌های بهینه‌سازی شده</span>
              </div>
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>فرم‌های پویا و هوشمند</span>
              </div>
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>سرعت و دقت بالا</span>
              </div>
            </div>
            
            <UButton 
              to="/admin/events/create/template-based" 
              color="secondary" 
              variant="solid" 
              class="w-full"
            >
              انتخاب قالب
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Quick Stats -->
      <div class="mt-12">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">آمار سریع</h3>
          </template>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">∞</div>
              <div class="text-sm text-gray-500">فرم آزاد</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">14+</div>
              <div class="text-sm text-gray-500">قالب آماده</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">100%</div>
              <div class="text-sm text-gray-500">انعطاف‌پذیری</div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page metadata
useHead({
  title: 'ایجاد رویداد جدید - پنل مدیریت',
  meta: [
    { name: 'description', content: 'انتخاب نوع ایجاد رویداد: فرم آزاد یا بر اساس قالب' }
  ]
})

// Page breadcrumb
definePageMeta({
  layout: 'admin'
})
</script>

<style scoped>
/* Custom styles for better Persian text rendering */
.text-right {
  text-align: right;
}

/* Hover effects for cards */
.hover\:shadow-lg:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Smooth transitions */
.transition-shadow {
  transition-property: box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
</style>
