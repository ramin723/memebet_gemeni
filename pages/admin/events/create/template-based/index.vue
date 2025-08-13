<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">انتخاب دسته قالب</h1>
            <p class="mt-2 text-gray-600">دسته مورد نظر خود را انتخاب کنید تا قالب‌های مربوطه را مشاهده کنید</p>
          </div>
          <div class="flex space-x-3 space-x-reverse">
            <NuxtLink 
              to="/admin/events/create" 
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UIcon name="i-heroicons-arrow-right" class="ml-2 h-4 w-4" />
              بازگشت
            </NuxtLink>
            <NuxtLink 
              to="/admin/events" 
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UIcon name="i-heroicons-home" class="ml-2 h-4 w-4" />
              لیست رویدادها
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Template Categories -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <!-- Category 1: Binary Predictions -->
        <UCard class="hover:shadow-lg transition-shadow duration-200 cursor-pointer" @click="selectCategory('BINARY')">
          <template #header>
            <div class="flex items-center">
              <div class="p-3 bg-blue-100 rounded-lg">
                <UIcon name="i-heroicons-check-circle" class="h-8 w-8 text-blue-600" />
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-semibold text-gray-900">پیش‌بینی‌های باینری</h3>
                <p class="text-sm text-gray-500">بله/خیر - آسان و سریع</p>
              </div>
            </div>
          </template>
          
          <div class="space-y-4">
            <p class="text-gray-600">قالب‌های ساده برای پیش‌بینی‌های بله/خیر که کاربران می‌توانند به راحتی روی آنها شرط ببندند.</p>
            
            <div class="space-y-2">
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>Goal Achievement - دستیابی به هدف</span>
              </div>
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>Metric Exceedance - تجاوز از معیار</span>
              </div>
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>Event Occurrence - وقوع رویداد</span>
              </div>
            </div>
            
            <div class="flex items-center justify-between text-sm text-gray-500">
              <span>تعداد قالب‌ها: 4</span>
              <UIcon name="i-heroicons-arrow-left" class="h-4 w-4" />
            </div>
          </div>
        </UCard>

        <!-- Category 2: Competitive & Dynamic -->
        <UCard class="hover:shadow-lg transition-shadow duration-200 cursor-pointer" @click="selectCategory('COMPETITIVE')">
          <template #header>
            <div class="flex items-center">
              <div class="p-3 bg-purple-100 rounded-lg">
                <UIcon name="i-heroicons-users" class="h-8 w-8 text-purple-600" />
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-semibold text-gray-900">رقابت و انتخاب</h3>
                <p class="text-sm text-gray-500">چند گزینه‌ای - پویا و انعطاف‌پذیر</p>
              </div>
            </div>
          </template>
          
          <div class="space-y-4">
            <p class="text-gray-600">قالب‌های پیشرفته برای رقابت‌ها، نظرسنجی‌ها و پیش‌بینی‌های عددی با گزینه‌های پویا.</p>
            
            <div class="space-y-2">
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>Competition Winner - برنده رقابت</span>
              </div>
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>Multi-Choice Poll - نظرسنجی چندگانه</span>
              </div>
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>Numerical Predictions - پیش‌بینی‌های عددی</span>
              </div>
            </div>
            
            <div class="flex items-center justify-between text-sm text-gray-500">
              <span>تعداد قالب‌ها: 5</span>
              <UIcon name="i-heroicons-arrow-left" class="h-4 w-4" />
            </div>
          </div>
        </UCard>

        <!-- Category 3: Head to Head -->
        <UCard class="hover:shadow-lg transition-shadow duration-200 cursor-pointer" @click="selectCategory('HEAD_TO_HEAD')">
          <template #header>
            <div class="flex items-center">
              <div class="p-3 bg-green-100 rounded-lg">
                <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 text-green-600" />
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-semibold text-gray-900">مقایسه مستقیم</h3>
                <p class="text-sm text-gray-500">مقایسه دو گزینه - ساده و مؤثر</p>
              </div>
            </div>
          </template>
          
          <div class="space-y-4">
            <p class="text-gray-600">قالب‌های تخصصی برای مقایسه مستقیم دو گزینه، محصول یا نتیجه.</p>
            
            <div class="space-y-2">
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>Product Comparison - مقایسه محصولات</span>
              </div>
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>Performance Battle - نبرد عملکرد</span>
              </div>
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>Winner Takes All - برنده همه چیز را می‌برد</span>
              </div>
            </div>
            
            <div class="flex items-center justify-between text-sm text-gray-500">
              <span>تعداد قالب‌ها: 3</span>
              <UIcon name="i-heroicons-arrow-left" class="h-4 w-4" />
            </div>
          </div>
        </UCard>

        <!-- Category 4: Advanced Templates -->
        <UCard class="hover:shadow-lg transition-shadow duration-200 cursor-pointer" @click="selectCategory('ADVANCED')">
          <template #header>
            <div class="flex items-center">
              <div class="p-3 bg-orange-100 rounded-lg">
                <UIcon name="i-heroicons-cog-6-tooth" class="h-8 w-8 text-orange-600" />
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-semibold text-gray-900">قالب‌های پیشرفته</h3>
                <p class="text-sm text-gray-500">مقایسه‌ای و توالی - برای کارشناسان</p>
              </div>
            </div>
          </template>
          
          <div class="space-y-4">
            <p class="text-gray-600">قالب‌های تخصصی برای پیش‌بینی‌های مقایسه‌ای، رتبه‌بندی و رویدادهای توالی.</p>
            
            <div class="space-y-2">
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>Metric Comparison - مقایسه معیارها</span>
              </div>
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>Ranking Prediction - پیش‌بینی رتبه</span>
              </div>
              <div class="flex items-center text-sm text-gray-700">
                <UIcon name="i-heroicons-check" class="h-4 w-4 text-green-500 ml-2" />
                <span>Sequential Events - رویدادهای توالی</span>
              </div>
            </div>
            
            <div class="flex items-center justify-between text-sm text-gray-500">
              <span>تعداد قالب‌ها: 2</span>
              <UIcon name="i-heroicons-arrow-left" class="h-4 w-4" />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Quick Stats -->
      <div class="mt-12">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">آمار قالب‌ها</h3>
          </template>
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">4</div>
              <div class="text-sm text-gray-500">دسته‌بندی</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">14+</div>
              <div class="text-sm text-gray-500">قالب آماده</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">100%</div>
              <div class="text-sm text-gray-500">بهینه‌سازی</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-orange-600">24/7</div>
              <div class="text-sm text-gray-500">پشتیبانی</div>
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
  title: 'انتخاب دسته قالب - پنل مدیریت',
  meta: [
    { name: 'description', content: 'انتخاب دسته قالب برای ایجاد رویداد جدید' }
  ]
})

// Page breadcrumb
definePageMeta({
  layout: 'admin'
})

// Function to select category and navigate to templates
function selectCategory(category: string) {
  navigateTo(`/admin/events/create/template-based/templates?category=${category}`)
}
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

/* Cursor pointer for clickable cards */
.cursor-pointer {
  cursor: pointer;
}
</style>
