<template>
  <!-- مودال تأیید/رد رویداد -->
  <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click="closeModal">
    <UCard @click.stop class="w-full max-w-2xl mx-4">
      <template #header>
        <h3 class="text-base font-semibold">
          {{ actionType === 'approve' ? 'تأیید رویداد' : 'رد کردن رویداد' }}
        </h3>
      </template>

      <div v-if="selectedEvent" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">شناسه</label>
            <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ selectedEvent.id }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">وضعیت</label>
            <UBadge :color="getStatusColor(selectedEvent.status || '')" variant="soft" class="mt-1">
              {{ selectedEvent.status || 'نامشخص' }}
            </UBadge>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">عنوان</label>
            <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ selectedEvent.title }}</p>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">توضیحات</label>
            <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ selectedEvent.description || 'توضیحی ارائه نشده' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">ایجاد کننده</label>
            <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ selectedEvent.creator?.username || 'نامشخص' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">مهلت شرط‌بندی</label>
            <p class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ selectedEvent.bettingDeadline ? format(new Date(selectedEvent.bettingDeadline), 'yyyy/MM/dd HH:mm') : 'نامشخص' }}
            </p>
          </div>
        </div>

        <!-- فرم دلیل رد کردن -->
        <div v-if="actionType === 'reject'" class="mt-6">
          <UFormGroup label="دلیل رد کردن (اجباری)" name="adminNote">
            <UTextarea
              :model-value="adminNote"
              @update:model-value="$emit('update:adminNote', $event)"
              placeholder="لطفاً دلیل رد کردن رویداد را بنویسید..."
              name="admin-note-textarea"
              id="admin-note-textarea"
            />
          </UFormGroup>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="closeModal">انصراف</UButton>
          <UButton
            v-if="actionType === 'approve'"
            color="success"
            :loading="isLoading"
            @click="handleConfirmAction"
          >
            تأیید رویداد
          </UButton>
          <UButton
            v-if="actionType === 'reject'"
            color="error"
            :disabled="!adminNote.trim()"
            :loading="isLoading"
            @click="handleConfirmAction"
          >
            رد کردن رویداد
          </UButton>
        </div>
      </template>
    </UCard>
  </div>

  <!-- مودال تسویه رویداد -->
  <div v-if="isResolveModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click="closeResolveModal">
    <UCard @click.stop class="w-full max-w-2xl mx-4">
      <template #header>
        <h3 class="text-base font-semibold">تسویه رویداد</h3>
      </template>

      <div v-if="selectedEvent" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">شناسه</label>
            <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ selectedEvent.id }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">عنوان</label>
            <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ selectedEvent.title }}</p>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">توضیحات</label>
            <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ selectedEvent.description || 'توضیحی ارائه نشده' }}</p>
          </div>
        </div>

        <!-- انتخاب نتیجه برنده -->
        <div class="mt-6">
          <UFormGroup label="نتیجه برنده (اجباری)" name="winningOutcomeId">
            <USelect
              :model-value="props.winningOutcomeId"
              @update:model-value="(value) => $emit('update:winningOutcomeId', String(value || ''))"
              :options="props.outcomeOptions"
              placeholder="نتیجه برنده را انتخاب کنید..."
              name="winning-outcome-select"
              id="winning-outcome-select"
            />
          </UFormGroup>
        </div>

        <!-- آمار شرط‌بندی -->
        <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">آمار شرط‌بندی</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600 dark:text-gray-400">تعداد شرط‌ها:</span>
              <span class="ml-2 font-medium">{{ bettingStats.totalBets || 0 }}</span>
            </div>
            <div>
              <span class="text-gray-600 dark:text-gray-400">مجموع مبالغ:</span>
              <span class="ml-2 font-medium">{{ bettingStats.totalAmount || 0 }} تومان</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="closeResolveModal">انصراف</UButton>
          <UButton
            color="success"
            :loading="isResolveLoading"
            :disabled="!winningOutcomeId"
            @click="handleResolveEvent"
          >
            تسویه رویداد
          </UButton>
        </div>
      </template>
    </UCard>
  </div>

  <!-- مودال انتخاب نوع ایجاد رویداد - حذف شده و به صفحه create.vue منتقل شده -->

  <!-- مودال ایجاد رویداد بر اساس قالب -->
  <div v-if="isTemplateModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click="closeTemplateModal">
    <UCard @click.stop class="w-full max-w-2xl mx-4">
      <template #header>
        <h3 class="text-base font-semibold">ایجاد رویداد بر اساس قالب</h3>
      </template>
      
      <div class="space-y-4">
        <!-- انتخاب قالب -->
        <UFormGroup label="انتخاب قالب" name="templateId">
          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton 
              variant="outline" 
              class="w-full justify-between"
              :class="{ 'text-gray-500': !templateBasedEvent.templateId }"
            >
              {{ getSelectedTemplateName() || 'قالب مورد نظر را انتخاب کنید...' }}
              <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
            </UButton>
            
            <template #content>
              <div class="w-64 p-1">
                <UButton
                  v-for="template in templates"
                  :key="template.id"
                  variant="ghost"
                  class="w-full justify-start"
                  :class="{ 'bg-primary-50 text-primary-700': templateBasedEvent.templateId === template.id }"
                  @click="selectTemplate(template)"
                >
                  <div class="text-right w-full">
                    <div class="font-medium">{{ template.name }}</div>
                    <div class="text-xs text-gray-500">{{ template.description }}</div>
                  </div>
                </UButton>
              </div>
            </template>
          </UPopover>
        </UFormGroup>

        <!-- فیلدهای قالب -->
        <div v-if="selectedTemplate" class="space-y-4">
          <div
            v-for="inputDef in selectedTemplate.structure?.inputs"
            :key="inputDef.name"
            class="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <UFormGroup :label="inputDef.label" :name="inputDef.name">
              <template v-if="inputDef.type === 'textarea'">
                <UTextarea
                  :model-value="templateBasedEvent.templateInputs[inputDef.name]"
                  @update:model-value="templateBasedEvent.templateInputs[inputDef.name] = $event"
                  :rows="3"
                  :placeholder="inputDef.placeholder || ''"
                />
              </template>
              <template v-else>
                <UInput
                  :model-value="templateBasedEvent.templateInputs[inputDef.name]"
                  @update:model-value="templateBasedEvent.templateInputs[inputDef.name] = $event"
                  :type="inputDef.type === 'date' ? 'date' : 'text'"
                  :placeholder="inputDef.placeholder || ''"
                />
              </template>
            </UFormGroup>
          </div>

          <!-- پیش‌نمایش عنوان -->
          <div class="p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm">
            <span class="text-gray-600 dark:text-gray-300">پیش‌نمایش عنوان: </span>
            <span class="font-medium">{{ getTemplateTitlePreview() }}</span>
          </div>
        </div>

        <!-- گزینه‌های پویا -->
        <div v-if="selectedTemplate?.outcomesStructure?.type === 'DYNAMIC'" class="space-y-3">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            گزینه‌های نتیجه ({{ selectedTemplate.outcomesStructure.min }} تا {{ selectedTemplate.outcomesStructure.max }} گزینه)
          </label>
          <div class="space-y-2">
            <div v-for="(outcome, index) in templateBasedEvent.outcomes" :key="index" class="flex gap-2">
              <UInput 
                v-model="outcome.title" 
                placeholder="عنوان گزینه..."
                class="flex-1"
              />
              <UButton 
                variant="ghost" 
                color="error" 
                size="sm"
                @click="removeTemplateOutcome(index)"
                :disabled="templateBasedEvent.outcomes.length <= selectedTemplate.outcomesStructure.min"
              >
                <UIcon name="i-heroicons-trash" class="w-4 h-4" />
              </UButton>
            </div>
          </div>
          <UButton 
            v-if="templateBasedEvent.outcomes.length < selectedTemplate.outcomesStructure.max"
            variant="outline" 
            size="sm"
            @click="addTemplateOutcome"
          >
            <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
            افزودن گزینه
          </UButton>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormGroup label="مهلت شرط‌بندی" name="bettingDeadline">
            <UInput 
              v-model="templateBasedEvent.bettingDeadline" 
              type="datetime-local"
              placeholder="مهلت شرط‌بندی را انتخاب کنید..."
            />
            <template #help>
              <span class="text-sm text-gray-500">تاریخ و زمان پایان شرط‌بندی - پس از این زمان کاربران نمی‌توانند شرط ببندند</span>
            </template>
          </UFormGroup>
        </div>

        <div class="flex items-center gap-2">
          <UCheckbox 
            v-model="templateBasedEvent.isFeatured" 
          />
          <label class="text-sm text-gray-700 dark:text-gray-300">رویداد ویژه</label>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="closeTemplateModal">انصراف</UButton>
          <UButton 
            color="success" 
            :loading="isTemplateLoading"
            :disabled="!isTemplateEventValid"
            @click="handleCreateTemplateEvent"
          >
            ایجاد رویداد
          </UButton>
        </div>
      </template>
    </UCard>
  </div>

  <!-- مودال ایجاد رویداد آزاد -->
  <div v-if="isFreeFormModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click="closeFreeFormModal">
    <UCard @click.stop class="w-full max-w-3xl mx-4">
      <template #header>
        <h3 class="text-base font-semibold">ایجاد رویداد آزاد</h3>
      </template>
      
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormGroup label="عنوان رویداد" name="title">
            <UInput 
              v-model="freeFormEvent.title" 
              placeholder="عنوان رویداد را وارد کنید..."
            />
          </UFormGroup>
          
          <UFormGroup label="مهلت شرط‌بندی" name="bettingDeadline">
            <UInput 
              v-model="freeFormEvent.bettingDeadline" 
              type="datetime-local"
              placeholder="مهلت شرط‌بندی را انتخاب کنید..."
            />
            <template #help>
              <span class="text-sm text-gray-500">تاریخ و زمان پایان شرط‌بندی - پس از این زمان کاربران نمی‌توانند شرط ببندند</span>
            </template>
          </UFormGroup>
        </div>
        
        <UFormGroup label="توضیحات" name="description">
          <UTextarea 
            v-model="freeFormEvent.description" 
            placeholder="توضیحات رویداد را وارد کنید..."
            :rows="3"
          />
        </UFormGroup>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormGroup label="URL تصویر رویداد" name="imageUrl">
            <UInput 
              v-model="freeFormEvent.imageUrl" 
              placeholder="https://example.com/image.jpg"
            />
            <template #help>
              <span class="text-sm text-gray-500">لینک تصویر رویداد - ابتدا تصویر را در سرویس‌های مانند Imgur آپلود کرده و لینک آن را اینجا قرار دهید</span>
            </template>
          </UFormGroup>
          
          <UFormGroup label="URL منبع داوری" name="resolutionSourceUrl">
            <UInput 
              v-model="freeFormEvent.resolutionSourceUrl" 
              placeholder="https://example.com/source"
            />
            <template #help>
              <span class="text-sm text-gray-500">لینک منبع رسمی برای داوری نتیجه - مانند سایت رسمی مسابقات، آمار رسمی یا خبرگزاری معتبر</span>
            </template>
          </UFormGroup>
        </div>

        <!-- گزینه‌های نتیجه -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">گزینه‌های نتیجه</label>
          <div class="space-y-2">
            <div v-for="(outcome, index) in freeFormEvent.outcomes" :key="index" class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <UInput 
                v-model="outcome.title" 
                placeholder="عنوان گزینه..."
              />
              <UInput 
                v-model="outcome.imageUrl" 
                placeholder="URL تصویر گزینه (اختیاری)"
              />
            </div>
          </div>
          <UButton 
            variant="outline" 
            size="sm"
            @click="addFreeFormOutcome"
            :disabled="freeFormEvent.outcomes.length >= 10"
          >
            <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
            افزودن گزینه
          </UButton>
        </div>

        <div class="flex items-center gap-2">
          <UCheckbox 
            v-model="freeFormEvent.isFeatured" 
          />
          <label class="text-sm text-gray-700 dark:text-gray-300">رویداد ویژه</label>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="closeFreeFormModal">انصراف</UButton>
          <UButton 
            color="success" 
            :loading="isFreeFormLoading"
            :disabled="!isFreeFormEventValid"
            @click="handleCreateFreeFormEvent"
          >
            ایجاد رویداد
          </UButton>
        </div>
      </template>
    </UCard>
  </div>


</template>

<script setup lang="ts">
import { format } from 'date-fns-jalali'

// Props
interface Props {
  isModalOpen: boolean
  isResolveModalOpen: boolean
  // isCreateModalOpen removed - using page-based navigation
  isTemplateModalOpen: boolean
  isFreeFormModalOpen: boolean
  selectedEvent: any
  actionType: 'approve' | 'reject'
  isLoading: boolean
  isResolveLoading: boolean
  isTemplateLoading: boolean
  isFreeFormLoading: boolean
  adminNote: string
  winningOutcomeId: string
  bettingStats: {
    totalBets: number
    totalAmount: number
  }
  outcomeOptions: Array<{ label: string; value: string }>
  templates: any[]
  selectedTemplate: any
  templateBasedEvent: {
    templateId: string
    templateInputs: Record<string, string>
    bettingDeadline: string
    isFeatured: boolean
    outcomes: Array<{ title: string }>
  }
  freeFormEvent: {
    title: string
    description: string
    bettingDeadline: string
    imageUrl: string
    resolutionSourceUrl: string
    isFeatured: boolean
    outcomes: Array<{ title: string; imageUrl: string }>
  }
  isTemplateEventValid: boolean
  isFreeFormEventValid: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'close-modal': []
  'close-resolve-modal': []
  // 'close-create-modal' removed - using page-based navigation
  'close-template-modal': []
  'close-free-form-modal': []
  'confirm-action': []
  'resolve-event': []
  'open-template-based-modal': []
  'open-free-form-modal': []
  'create-template-event': []
  'create-free-form-event': []
  'select-template': [template: any]
  'add-template-outcome': []
  'remove-template-outcome': [index: number]
  'add-free-form-outcome': []
  'update:adminNote': [value: string]
  'update:winningOutcomeId': [value: string]
}>()

// Functions
function getStatusColor(status: string): 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'PENDING_APPROVAL':
      return 'warning'
    case 'ACTIVE':
      return 'success'
    case 'RESOLVED':
      return 'info'
    case 'REJECTED':
      return 'error'
    case 'CANCELLED':
      return 'neutral'
    default:
      return 'neutral'
  }
}

function closeModal() {
  emit('close-modal')
}

function closeResolveModal() {
  emit('close-resolve-modal')
}

// closeCreateModal removed - using page-based navigation

function closeTemplateModal() {
  emit('close-template-modal')
}

function closeFreeFormModal() {
  emit('close-free-form-modal')
}



function handleConfirmAction() {
  emit('confirm-action')
}

function handleResolveEvent() {
  emit('resolve-event')
}

function openTemplateBasedModal() {
  emit('open-template-based-modal')
}

function openFreeFormModal() {
  emit('open-free-form-modal')
}

function handleCreateTemplateEvent() {
  emit('create-template-event')
}

function handleCreateFreeFormEvent() {
  emit('create-free-form-event')
}

function selectTemplate(template: any) {
  emit('select-template', template)
}

function addTemplateOutcome() {
  emit('add-template-outcome')
}

function removeTemplateOutcome(index: number) {
  emit('remove-template-outcome', index)
}

function addFreeFormOutcome() {
  emit('add-free-form-outcome')
}

function getSelectedTemplateName(): string {
  if (!props.templateBasedEvent.templateId) return ''
  const template = props.templates.find(t => t.id === props.templateBasedEvent.templateId)
  return template?.name || ''
}

function getTemplateTitlePreview(): string {
  if (!props.selectedTemplate) return ''
  const structure = props.selectedTemplate.structure
  let title = structure?.titleStructure || ''
  if (!title) return ''
  const inputs = props.templateBasedEvent.templateInputs || {}
  ;(structure?.inputs || []).forEach((inp: any) => {
    const val = inputs[inp.name] || ''
    title = title.replace(new RegExp(`\\[${inp.name}\\]`, 'g'), val)
  })
  return title
}


</script>
