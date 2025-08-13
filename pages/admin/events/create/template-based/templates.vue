<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">{{ getCategoryTitle() }}</h1>
            <p class="mt-2 text-gray-600">قالب مورد نظر خود را انتخاب کنید تا رویداد جدیدی ایجاد کنید</p>
          </div>
          <div class="flex space-x-3 space-x-reverse">
            <NuxtLink 
              to="/admin/events/create/template-based" 
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UIcon name="i-heroicons-arrow-right" class="ml-2 h-4 w-4" />
              بازگشت به دسته‌ها
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

      <!-- Loading State -->
      <div v-if="pending" class="flex justify-center items-center py-12">
        <div class="text-center">
          <UIcon name="i-heroicons-arrow-path" class="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p class="text-gray-600">در حال بارگذاری قالب‌ها...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 mb-2">خطا در بارگذاری قالب‌ها</h3>
        <p class="text-gray-600 mb-4">{{ error.message }}</p>
        <UButton @click="loadTemplates" color="primary">
          تلاش مجدد
        </UButton>
      </div>

      <!-- Templates Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="template in filteredTemplates" 
          :key="template.id"
          class="group cursor-pointer"
          @click="selectTemplate(template)"
        >
          <UCard class="h-full hover:shadow-lg transition-all duration-200 group-hover:scale-105">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="p-2 bg-blue-100 rounded-lg">
                    <UIcon name="i-heroicons-document-text" class="h-5 w-5 text-blue-600" />
                  </div>
                  <div class="ml-3">
                    <h3 class="text-lg font-semibold text-gray-900">{{ template.name }}</h3>
                    <p class="text-sm text-gray-500">{{ getTemplateTypeLabel(template.structure?.templateType) }}</p>
                  </div>
                </div>
                <UIcon 
                  name="i-heroicons-arrow-left" 
                  class="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" 
                />
              </div>
            </template>
            
            <div class="space-y-4">
              <p class="text-gray-600 text-sm">{{ template.description || 'توضیحات قالب در دسترس نیست' }}</p>
              
              <!-- Template Structure Preview -->
              <div class="space-y-2">
                <div class="text-xs font-medium text-gray-700 uppercase tracking-wide">ساختار قالب:</div>
                <div class="space-y-1">
                  <div class="flex items-center text-xs text-gray-600">
                    <UIcon name="i-heroicons-tag" class="h-3 w-3 text-blue-500 ml-1" />
                    <span>{{ template.structure?.inputs?.length || 0 }} فیلد ورودی</span>
                  </div>
                  <div class="flex items-center text-xs text-gray-600">
                    <UIcon name="i-heroicons-list-bullet" class="h-3 w-3 text-green-500 ml-1" />
                    <span>{{ getOutcomesCount(template) }} نتیجه</span>
                  </div>
                </div>
              </div>

              <!-- Template Features -->
              <div class="space-y-2">
                <div class="text-xs font-medium text-gray-700 uppercase tracking-wide">ویژگی‌ها:</div>
                <div class="flex flex-wrap gap-1">
                  <span 
                    v-for="feature in getTemplateFeatures(template)" 
                    :key="feature"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ feature }}
                  </span>
                </div>
              </div>

              <!-- Action Button -->
              <UButton 
                color="primary" 
                variant="solid" 
                class="w-full group-hover:bg-blue-700 transition-colors"
              >
                انتخاب این قالب
              </UButton>
            </div>
          </UCard>
        </div>
      </div>

      <!-- No Templates Found -->
      <div v-if="!pending && !error && filteredTemplates.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-document-magnifying-glass" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 mb-2">قالبی یافت نشد</h3>
        <p class="text-gray-600 mb-4">در این دسته‌بندی قالب‌ای موجود نیست.</p>
        <NuxtLink 
          to="/admin/events/create/template-based"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          بازگشت به دسته‌ها
        </NuxtLink>
      </div>

      <!-- Quick Stats -->
      <div class="mt-12">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">آمار دسته {{ getCategoryTitle() }}</h3>
          </template>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ filteredTemplates.length }}</div>
              <div class="text-sm text-gray-500">قالب موجود</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">{{ getCategoryTemplateCount() }}</div>
              <div class="text-sm text-gray-500">کل قالب‌های دسته</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">100%</div>
              <div class="text-sm text-gray-500">بهینه‌سازی</div>
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
  title: 'انتخاب قالب - پنل مدیریت',
  meta: [
    { name: 'description', content: 'انتخاب قالب برای ایجاد رویداد جدید' }
  ]
})

// Page breadcrumb
definePageMeta({
  layout: 'admin'
})

// Template interface
interface TemplateInput {
  name: string;
  label: string;
  type: 'text' | 'date' | 'textarea';
}

interface OutcomesStructure {
  type: 'FIXED' | 'DYNAMIC_CHOICE' | 'DYNAMIC_RANGE';
  options?: { title: string }[];
  min?: number;
  max?: number;
  placeholder?: string;
}

interface TemplateStructure {
  templateType: 'BINARY' | 'COMPETITIVE' | 'HEAD_TO_HEAD' | 'ADVANCED';
  titleStructure: string;
  inputs: TemplateInput[];
  outcomes?: { title: string }[];
}

interface EventTemplate {
  id: string | number;
  name: string;
  description?: string;
  structure?: TemplateStructure;
  outcomesStructure?: OutcomesStructure;
  creatorType?: 'ADMIN' | 'USER' | 'BOTH';
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Route and query parameters
const route = useRoute()
const category = computed(() => route.query.category as string)

// Template data
const { data, pending, error, refresh } = await useFetch('/api/templates')

// Computed properties
const templates = computed<EventTemplate[]>(() => data.value?.data?.templates || [])
const filteredTemplates = computed<EventTemplate[]>(() => {
  if (!category.value) return templates.value
  return templates.value.filter(template => 
    template.structure?.templateType === category.value
  )
})

// Functions
function getCategoryTitle(): string {
  const titles: Record<string, string> = {
    'BINARY': 'پیش‌بینی‌های باینری',
    'COMPETITIVE': 'رقابت و انتخاب',
    'HEAD_TO_HEAD': 'مقایسه مستقیم',
    'ADVANCED': 'قالب‌های پیشرفته'
  }
  return titles[category.value] || 'انتخاب قالب'
}

function getTemplateTypeLabel(type?: string): string {
  if (!type) return 'نامشخص'
  
  const labels: Record<string, string> = {
    'BINARY': 'پیش‌بینی باینری',
    'COMPETITIVE': 'رقابت چندگانه',
    'HEAD_TO_HEAD': 'مقایسه مستقیم',
    'ADVANCED': 'پیشرفته'
  }
  return labels[type] || type
}

function getOutcomesCount(template: EventTemplate): string | number {
  if (template.outcomesStructure?.type === 'FIXED') {
    return template.outcomesStructure?.options?.length || 0
  } else if (template.outcomesStructure?.type === 'DYNAMIC_CHOICE') {
    return `${template.outcomesStructure?.min || 0}-${template.outcomesStructure?.max || '∞'}`
  }
  return 'پویا'
}

function getTemplateFeatures(template: EventTemplate): string[] {
  const features: string[] = []
  
  if (template.structure?.templateType === 'BINARY') {
    features.push('ساده', 'سریع')
  } else if (template.structure?.templateType === 'COMPETITIVE') {
    features.push('چندگانه', 'انعطاف‌پذیر')
  } else if (template.structure?.templateType === 'HEAD_TO_HEAD') {
    features.push('مقایسه', 'مستقیم')
  } else if (template.structure?.templateType === 'ADVANCED') {
    features.push('پیشرفته', 'تخصصی')
  }
  
  if (template.outcomesStructure?.type === 'DYNAMIC_CHOICE') {
    features.push('نتایج پویا')
  }
  
  return features
}

function getCategoryTemplateCount(): number {
  const counts: Record<string, number> = {
    'BINARY': 4,
    'COMPETITIVE': 5,
    'HEAD_TO_HEAD': 3,
    'ADVANCED': 2
  }
  return counts[category.value] || 0
}

function selectTemplate(template: EventTemplate) {
  navigateTo(`/admin/events/create/template-based/builder?templateId=${template.id}`)
}

function loadTemplates() {
  refresh()
}

// Watch for category changes
watch(category, () => {
  if (category.value) {
    refresh()
  }
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
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Group hover effects */
.group:hover .group-hover\:scale-105 {
  transform: scale(1.05);
}

.group:hover .group-hover\:bg-blue-700 {
  background-color: rgb(29 78 216);
}
</style>
