<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">فرم‌ساز هوشمند</h1>
            <p class="mt-2 text-gray-600">{{ selectedTemplate?.name || 'در حال بارگذاری...' }}</p>
          </div>
          <div class="flex space-x-3 space-x-reverse">
            <NuxtLink 
              :to="`/admin/events/create/template-based/templates?category=${getTemplateCategory()}`" 
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UIcon name="i-heroicons-arrow-right" class="ml-2 h-4 w-4" />
              بازگشت به قالب‌ها
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
      <div v-if="pending || !selectedTemplate" class="flex justify-center items-center py-12">
        <div class="text-center">
          <UIcon name="i-heroicons-arrow-path" class="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p class="text-gray-600">در حال بارگذاری قالب...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 mb-2">خطا در بارگذاری قالب</h3>
        <p class="text-gray-600 mb-4">{{ error.message }}</p>
        <UButton @click="loadTemplate" color="primary">
          تلاش مجدد
        </UButton>
      </div>

      <!-- Form Builder -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left Column: Form Inputs -->
        <div class="lg:col-span-2">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-semibold text-gray-900">فرم ورودی</h2>
                <div class="flex items-center space-x-2 space-x-reverse">
                  <span class="text-sm text-gray-500">وضعیت:</span>
                  <span 
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      isFormValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ isFormValid ? 'تکمیل شده' : 'ناقص' }}
                  </span>
                </div>
              </div>
            </template>
            
            <div class="space-y-6">
              <!-- Template Inputs -->
              <div v-if="templateInputs.length > 0" class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">اطلاعات قالب</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    v-for="input in templateInputs" 
                    :key="input.name"
                    class="space-y-2"
                  >
                    <label :for="input.name" class="block text-sm font-medium text-gray-700">
                      {{ input.label }}
                      <span v-if="isInputRequired(input)" class="text-red-500">*</span>
                    </label>
                    
                    <!-- Text Input -->
                    <input
                      v-if="input.type === 'text'"
                      :id="input.name"
                      v-model="formData.templateInputs[input.name]"
                      type="text"
                      :placeholder="input.placeholder || `مثال: ${input.label}`"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      @input="updatePreview"
                    />
                    
                    <!-- Date Input -->
                    <input
                      v-else-if="input.type === 'date'"
                      :id="input.name"
                      v-model="formData.templateInputs[input.name]"
                      type="datetime-local"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      @input="updatePreview"
                    />
                    
                    <!-- Textarea Input -->
                    <textarea
                      v-else-if="input.type === 'textarea'"
                      :id="input.name"
                      v-model="formData.templateInputs[input.name]"
                      :rows="3"
                      :placeholder="input.placeholder || `توضیحات ${input.label}`"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      @input="updatePreview"
                    />
                  </div>
                </div>
              </div>

              <!-- Event Settings -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">تنظیمات رویداد</h3>
                
                <!-- Betting Deadline -->
                <div class="space-y-2">
                  <label for="bettingDeadline" class="block text-sm font-medium text-gray-700">
                    مهلت شرط‌بندی <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="bettingDeadline"
                    v-model="formData.bettingDeadline"
                    type="datetime-local"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    @input="updatePreview"
                  />
                </div>

                <!-- Featured Event -->
                <div class="flex items-center">
                  <input
                    id="isFeatured"
                    v-model="formData.isFeatured"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label for="isFeatured" class="mr-2 block text-sm text-gray-700">
                    رویداد ویژه
                  </label>
                </div>
              </div>

              <!-- Dynamic Outcomes -->
              <div v-if="isDynamicOutcomes" class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-medium text-gray-900">نتایج</h3>
                  <div class="flex items-center space-x-2 space-x-reverse">
                    <span class="text-sm text-gray-500">
                      {{ formData.outcomes.length }}/{{ maxOutcomes }}
                    </span>
                    <UButton
                      v-if="canAddOutcome"
                      @click="addOutcome"
                      color="primary"
                      variant="outline"
                      size="sm"
                    >
                      <UIcon name="i-heroicons-plus" class="h-4 w-4 ml-1" />
                      افزودن
                    </UButton>
                  </div>
                </div>
                
                <div class="space-y-3">
                  <div 
                    v-for="(outcome, index) in formData.outcomes" 
                    :key="index"
                    class="flex items-center space-x-2 space-x-reverse"
                  >
                    <input
                      v-model="outcome.title"
                      type="text"
                      :placeholder="`نتیجه ${index + 1}`"
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      @input="updatePreview"
                    />
                    <UButton
                      v-if="canRemoveOutcome"
                      @click="removeOutcome(index)"
                      color="error"
                      variant="outline"
                      size="sm"
                    >
                      <UIcon name="i-heroicons-trash" class="h-4 w-4" />
                    </UButton>
                  </div>
                </div>
              </div>

              <!-- Fixed Outcomes Info -->
              <div v-else-if="selectedTemplate?.outcomesStructure?.type === 'FIXED'" class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">نتایج ثابت</h3>
                <div class="bg-gray-50 p-4 rounded-lg">
                  <p class="text-sm text-gray-600 mb-3">این قالب دارای نتایج ثابت است:</p>
                  <div class="space-y-2">
                    <div 
                      v-for="(outcome, index) in selectedTemplate.outcomesStructure.options" 
                      :key="index"
                      class="flex items-center text-sm text-gray-700"
                    >
                      <UIcon name="i-heroicons-check-circle" class="h-4 w-4 text-green-500 ml-2" />
                      <span>{{ outcome.title }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Right Column: Live Preview -->
        <div class="lg:col-span-1">
          <div class="sticky top-8">
            <UCard>
              <template #header>
                <h2 class="text-xl font-semibold text-gray-900">پیش‌نمایش زنده</h2>
              </template>
              
              <div class="space-y-4">
                <!-- Event Title Preview -->
                <div class="space-y-2">
                  <h4 class="text-sm font-medium text-gray-700">عنوان رویداد:</h4>
                  <div class="p-3 bg-gray-50 rounded-lg">
                    <p class="text-sm text-gray-900 font-medium">
                      {{ previewTitle || 'عنوان بر اساس ورودی‌ها نمایش داده می‌شود' }}
                    </p>
                  </div>
                </div>

                <!-- Template Info -->
                <div class="space-y-2">
                  <h4 class="text-sm font-medium text-gray-700">اطلاعات قالب:</h4>
                  <div class="space-y-1 text-xs text-gray-600">
                    <div>نوع: {{ getTemplateTypeLabel(selectedTemplate?.structure?.templateType) }}</div>
                    <div>فیلدها: {{ templateInputs.length }}</div>
                    <div>نتایج: {{ getOutcomesCount() }}</div>
                  </div>
                </div>

                <!-- Validation Status -->
                <div class="space-y-2">
                  <h4 class="text-sm font-medium text-gray-700">وضعیت اعتبارسنجی:</h4>
                  <div class="space-y-2">
                    <div 
                      v-for="validation in validationChecks" 
                      :key="validation.key"
                      class="flex items-center text-xs"
                      :class="validation.isValid ? 'text-green-600' : 'text-red-600'"
                    >
                      <UIcon 
                        :name="validation.isValid ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'" 
                        class="h-3 w-3 ml-1" 
                      />
                      <span>{{ validation.message }}</span>
                    </div>
                  </div>
                </div>

                <!-- Create Button -->
                <UButton
                  :disabled="!isFormValid || isCreating"
                  @click="createEvent"
                  color="primary"
                  variant="solid"
                  class="w-full"
                  :loading="isCreating"
                >
                  {{ isCreating ? 'در حال ایجاد...' : 'ایجاد رویداد' }}
                </UButton>

                <!-- Form Progress -->
                <div class="space-y-2">
                  <div class="flex justify-between text-xs text-gray-600">
                    <span>پیشرفت فرم</span>
                    <span>{{ formProgress }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      :style="{ width: `${formProgress}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page metadata
useHead({
  title: 'فرم‌ساز هوشمند - پنل مدیریت',
  meta: [
    { name: 'description', content: 'فرم‌ساز هوشمند برای ایجاد رویداد بر اساس قالب' }
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
  placeholder?: string;
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
const templateId = computed(() => route.query.templateId as string)

// Template data
const data = ref<any>(null)
const pending = ref(false)
const error = ref<any>(null)

// Function to load template
async function loadTemplate() {
  if (!templateId.value) return
  
  pending.value = true
  error.value = null
  
  try {
    const response = await $fetch(`/api/templates/${templateId.value}`)
    data.value = response
  } catch (err: any) {
    error.value = err
    console.error('Failed to load template:', err)
  } finally {
    pending.value = false
  }
}

// Load template initially
if (templateId.value) {
  loadTemplate()
}

// Form state
const formData = ref({
  templateInputs: {} as Record<string, string>,
  bettingDeadline: '',
  isFeatured: false,
  outcomes: [] as Array<{ title: string }>
})

const isCreating = ref(false)

// Computed properties
const selectedTemplate = computed<EventTemplate | undefined>(() => data.value?.data?.template)
const templateInputs = computed<TemplateInput[]>(() => selectedTemplate.value?.structure?.inputs || [])
const isDynamicOutcomes = computed(() => 
  selectedTemplate.value?.outcomesStructure?.type === 'DYNAMIC_CHOICE'
)
const minOutcomes = computed(() => selectedTemplate.value?.outcomesStructure?.min || 2)
const maxOutcomes = computed(() => selectedTemplate.value?.outcomesStructure?.max || 10)
const canAddOutcome = computed(() => formData.value.outcomes.length < maxOutcomes.value)
const canRemoveOutcome = computed(() => formData.value.outcomes.length > minOutcomes.value)

// Preview and validation
const previewTitle = ref('')
const validationChecks = computed(() => [
  {
    key: 'templateInputs',
    message: 'تمام فیلدهای قالب تکمیل شده‌اند',
    isValid: isAllTemplateInputsFilled()
  },
  {
    key: 'bettingDeadline',
    message: 'مهلت شرط‌بندی تنظیم شده است',
    isValid: !!formData.value.bettingDeadline
  },
  {
    key: 'outcomes',
    message: `تعداد نتایج بین ${minOutcomes.value} تا ${maxOutcomes.value} است`,
    isValid: isOutcomesValid()
  }
])

const isFormValid = computed(() => 
  validationChecks.value.every(check => check.isValid)
)

const formProgress = computed(() => {
  const totalChecks = validationChecks.value.length
  const validChecks = validationChecks.value.filter(check => check.isValid).length
  return Math.round((validChecks / totalChecks) * 100)
})

// Functions
// loadTemplate function is already defined above

function getTemplateCategory(): string {
  return selectedTemplate.value?.structure?.templateType || ''
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

function getOutcomesCount(): string | number {
  if (selectedTemplate.value?.outcomesStructure?.type === 'FIXED') {
    return selectedTemplate.value.outcomesStructure.options?.length || 0
  } else if (selectedTemplate.value?.outcomesStructure?.type === 'DYNAMIC_CHOICE') {
    return `${minOutcomes.value}-${maxOutcomes.value}`
  }
  return 'نامشخص'
}

function isInputRequired(input: TemplateInput): boolean {
  return true // All template inputs are required for now
}

function isAllTemplateInputsFilled(): boolean {
  if (!selectedTemplate.value) return false
  const inputs = selectedTemplate.value.structure?.inputs || []
  return inputs.every((input: TemplateInput) => {
    const value = formData.value.templateInputs[input.name]
    return typeof value === 'string' && value.trim() !== ''
  })
}

function isOutcomesValid(): boolean {
  if (selectedTemplate.value?.outcomesStructure?.type === 'FIXED') {
    return true
  }
  
  const outcomesCount = formData.value.outcomes.length
  if (outcomesCount < minOutcomes.value || outcomesCount > maxOutcomes.value) {
    return false
  }
  
  return formData.value.outcomes.every(outcome => outcome.title.trim() !== '')
}

function updatePreview() {
  if (!selectedTemplate.value) return
  
  const structure = selectedTemplate.value.structure
  let title = structure?.titleStructure || ''
  
  if (!title) return
  
  const inputs = formData.value.templateInputs || {}
  ;(structure?.inputs || []).forEach((input: TemplateInput) => {
    const value = inputs[input.name] || ''
    title = title.replace(new RegExp(`\\[${input.name}\\]`, 'g'), value)
  })
  
  previewTitle.value = title
}

function addOutcome() {
  if (canAddOutcome.value) {
    formData.value.outcomes.push({ title: '' })
  }
}

function removeOutcome(index: number) {
  if (canRemoveOutcome.value) {
    formData.value.outcomes.splice(index, 1)
  }
}

async function createEvent() {
  if (!isFormValid.value || !selectedTemplate.value) return
  
  isCreating.value = true
  
  try {
    const eventData = {
      templateId: selectedTemplate.value.id,
      templateInputs: formData.value.templateInputs,
      bettingDeadline: formData.value.bettingDeadline,
      isFeatured: formData.value.isFeatured,
      outcomes: isDynamicOutcomes.value 
        ? formData.value.outcomes 
        : selectedTemplate.value.outcomesStructure?.options || []
    }
    
    await $fetch('/api/events', {
      method: 'POST',
      headers: {
        'x-dev-user-wallet': 'wallet_superadmin'
      },
      body: eventData
    })
    
    // Redirect to events list with success message
    await navigateTo('/admin/events?created=true')
    
  } catch (err: any) {
    console.error('Failed to create event:', err)
    // TODO: Show error message to user
  } finally {
    isCreating.value = false
  }
}

// Watch for templateId changes
watch(templateId, (newId) => {
  if (newId) {
    // Load the new template
    loadTemplate()
  }
})

// Initialize form when template loads
watch(selectedTemplate, (template) => {
  if (template) {
    // Initialize template inputs
    formData.value.templateInputs = {}
    ;(template.structure?.inputs || []).forEach((input: TemplateInput) => {
      formData.value.templateInputs[input.name] = ''
    })
    
    // Initialize outcomes for dynamic templates
    if (template.outcomesStructure?.type === 'DYNAMIC_CHOICE' && template.outcomesStructure.min) {
      formData.value.outcomes = []
      for (let i = 0; i < template.outcomesStructure.min; i++) {
        formData.value.outcomes.push({ title: '' })
      }
    }
    
    // Set default deadline (24 hours from now)
    const tomorrow = new Date()
    tomorrow.setHours(tomorrow.getHours() + 24)
    formData.value.bettingDeadline = tomorrow.toISOString().slice(0, 16)
    
    updatePreview()
  }
}, { immediate: true })
</script>

<style scoped>
/* Custom styles for better Persian text rendering */
.text-right {
  text-align: right;
}

/* Sticky positioning for preview card */
.sticky {
  position: sticky;
  top: 2rem;
}

/* Smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>
