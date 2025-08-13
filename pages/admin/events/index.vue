<template>
  <div>
    <!-- Header Component -->
    <AdminEventsHeader />
    
    <!-- Filters Component -->
    <AdminEventsFilters 
      :total-events="totalEvents" 
      @update-filters="handleFiltersUpdate" 
    />
    
    <!-- Table Component -->
    <AdminEventsTable 
      :events="filteredEvents"
      :pending="pending"
      :error="error"
      @approve-event="openModal($event, 'approve')"
      @reject-event="openModal($event, 'reject')"
      @resolve-event="openResolveModal($event)"
      @toggle-featured="toggleFeatured($event)"
    />

    <!-- Action Modal Component -->
    <AdminEventsActionModal
      :is-modal-open="isModalOpen"
      :is-resolve-modal-open="isResolveModalOpen"

      :is-template-modal-open="isTemplateModalOpen"
      :is-free-form-modal-open="isFreeFormModalOpen"
      :selected-event="selectedEvent"
      :action-type="actionType"
      :is-loading="isLoading"
      :is-resolve-loading="isResolveLoading"
      :is-template-loading="isTemplateLoading"
      :is-free-form-loading="isFreeFormLoading"
      :betting-stats="bettingStats"
      :outcome-options="outcomeOptions"
      :templates="templates"
      :selected-template="selectedTemplate"
      :template-based-event="templateBasedEvent"
      :free-form-event="freeFormEvent"
      :is-template-event-valid="isTemplateEventValid"
      :is-free-form-event-valid="isFreeFormEventValid"
      v-model:admin-note="adminNote"
      v-model:winning-outcome-id="winningOutcomeId"
      @close-modal="isModalOpen = false"
      @close-resolve-modal="isResolveModalOpen = false"
      @close-template-modal="isTemplateModalOpen = false"
      @close-free-form-modal="isFreeFormModalOpen = false"
      @confirm-action="handleConfirmAction"
      @resolve-event="handleResolveEvent"
      @open-template-based-modal="openTemplateBasedModal"
      @open-free-form-modal="openFreeFormModal"
      @create-template-event="handleCreateTemplateEvent"
      @create-free-form-event="handleCreateFreeFormEvent"
      @select-template="selectTemplate"
      @add-template-outcome="addTemplateOutcome"
      @remove-template-outcome="removeTemplateOutcome"
      @add-free-form-outcome="addFreeFormOutcome"
    />
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns-jalali'

// Import components
import AdminEventsHeader from '~/components/admin/AdminEventsHeader.vue'
import AdminEventsFilters from '~/components/admin/AdminEventsFilters.vue'
import AdminEventsTable from '~/components/admin/AdminEventsTable.vue'
import AdminEventsActionModal from '~/components/admin/AdminEventsActionModal.vue'

definePageMeta({ layout: 'admin' });

// State برای مودال
const isModalOpen = ref(false)
const selectedEvent = ref<any>(null)
const actionType = ref<'approve' | 'reject'>('approve')
const adminNote = ref('')
const isLoading = ref(false)

// State برای مودال تسویه
const isResolveModalOpen = ref(false)
const winningOutcomeId = ref('')
const isResolveLoading = ref(false)
const bettingStats = ref({
  totalBets: 0,
  totalAmount: 0
})

// State برای مودال‌های ایجاد رویداد - isCreateModalOpen removed
const isTemplateModalOpen = ref(false)
const isFreeFormModalOpen = ref(false)



// State برای مودال قالب
const isTemplateLoading = ref(false)
const templateBasedEvent = ref({
  templateId: '' as string,
  templateInputs: {} as Record<string, string>,
  bettingDeadline: '',
  isFeatured: false,
  outcomes: [] as Array<{ title: string }>
})

// State برای مودال فرم آزاد
const isFreeFormLoading = ref(false)
const freeFormEvent = ref({
  title: '',
  description: '',
  bettingDeadline: '',
  imageUrl: '',
  resolutionSourceUrl: '',
  isFeatured: false,
  outcomes: [
    { title: '', imageUrl: '' },
    { title: '', imageUrl: '' }
  ] as Array<{ title: string; imageUrl: string }>
})

// State برای قالب‌ها
const templates = ref<any[]>([])
const selectedTemplate = ref<any>(null)

// گزینه‌های نتیجه (موقت - باید از API دریافت شود)
const outcomeOptions = [
  { label: 'نتیجه 1', value: '1' },
  { label: 'نتیجه 2', value: '2' },
  { label: 'نتیجه 3', value: '3' }
]

// --- فیلترها و جستجو ---
const filters = ref({
  search: '',
  status: '',
  featured: '',
  dateRange: '',
  startDate: '',
  endDate: ''
})

const statusOptions = [
  { label: 'همه وضعیت‌ها', value: '' },
  { label: 'در انتظار تأیید', value: 'PENDING_APPROVAL' },
  { label: 'فعال', value: 'ACTIVE' },
  { label: 'تسویه شده', value: 'RESOLVED' },
  { label: 'رد شده', value: 'REJECTED' },
  { label: 'لغو شده', value: 'CANCELLED' }
]

const featuredOptions = [
  { label: 'همه رویدادها', value: '' },
  { label: 'فقط ویژه', value: 'true' },
  { label: 'غیر ویژه', value: 'false' }
]

const dateRangeOptions = [
  { label: 'همه تاریخ‌ها', value: '' },
  { label: 'امروز', value: 'today' },
  { label: 'آخرین 3 روز', value: 'last_3_days' },
  { label: 'آخرین 7 روز', value: 'last_7_days' },
  { label: 'هفته گذشته', value: 'last_week' },
  { label: 'آخرین 30 روز', value: 'last_30_days' },
  { label: 'ماه گذشته', value: 'last_month' },
  { label: 'سال گذشته', value: 'last_year' },
  { label: 'تاریخ سفارشی', value: 'custom' }
]





const { data, pending, error, refresh } = await useFetch('/api/admin/events', {
  headers: {
    'x-dev-user-wallet': 'wallet_superadmin'
  }
});

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'عنوان' },
  { key: 'status', label: 'وضعیت' },
  { key: 'creatorName', label: 'ایجاد کننده' },
  { key: 'deadline', label: 'مهلت شرط‌بندی' },
  { key: 'actions', label: 'اقدامات' }
];

// تابع برای تبدیل وضعیت به رنگ مجاز
function getStatusColor(status: string): 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'PENDING_APPROVAL':
      return 'warning';
    case 'ACTIVE':
      return 'success';
    case 'RESOLVED':
      return 'info';
    case 'REJECTED':
      return 'error';
    case 'CANCELLED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

const formattedEvents = computed(() => {
  if (!data.value || !data.value.events) return [];
  
  let events = data.value.events;
  
  // فیلتر بر اساس جستجو
  if (filters.value.search) {
    const searchTerm = filters.value.search.toLowerCase();
    events = events.filter((event: any) => 
      event.title?.toLowerCase().includes(searchTerm) ||
      event.description?.toLowerCase().includes(searchTerm) ||
      event.creator?.username?.toLowerCase().includes(searchTerm)
    );
  }
  
  // فیلتر بر اساس وضعیت
  if (filters.value.status) {
    events = events.filter((event: any) => event.status === filters.value.status);
  }
  
  // فیلتر بر اساس Featured
  if (filters.value.featured) {
    const isFeatured = filters.value.featured === 'true';
    events = events.filter((event: any) => event.isFeatured === isFeatured);
  }
  
  // فیلتر بر اساس تاریخ
  if (filters.value.dateRange) {
    const now = new Date();
    
    switch (filters.value.dateRange) {
      case 'today':
        events = events.filter((event: any) => {
          const eventCreatedAt = new Date(event.createdAt);
          return eventCreatedAt.toDateString() === now.toDateString();
        });
        break;
      case 'last_3_days':
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        events = events.filter((event: any) => {
          const eventCreatedAt = new Date(event.createdAt);
          return eventCreatedAt >= threeDaysAgo;
        });
        break;
      case 'last_7_days':
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        events = events.filter((event: any) => {
          const eventCreatedAt = new Date(event.createdAt);
          return eventCreatedAt >= sevenDaysAgo;
        });
        break;
      case 'last_week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        events = events.filter((event: any) => {
          const eventCreatedAt = new Date(event.createdAt);
          return eventCreatedAt >= weekAgo;
        });
        break;
      case 'last_30_days':
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        events = events.filter((event: any) => {
          const eventCreatedAt = new Date(event.createdAt);
          return eventCreatedAt >= thirtyDaysAgo;
        });
        break;
      case 'last_month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        events = events.filter((event: any) => {
          const eventCreatedAt = new Date(event.createdAt);
          return eventCreatedAt >= monthAgo;
        });
        break;
      case 'last_year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        events = events.filter((event: any) => {
          const eventCreatedAt = new Date(event.createdAt);
          return eventCreatedAt >= yearAgo;
        });
        break;
      case 'custom':
        if (filters.value.startDate && filters.value.endDate) {
          const startDate = new Date(filters.value.startDate);
          const endDate = new Date(filters.value.endDate);
          endDate.setHours(23, 59, 59, 999); // تا آخر روز
          
          events = events.filter((event: any) => {
            const eventCreatedAt = new Date(event.createdAt);
            return eventCreatedAt >= startDate && eventCreatedAt <= endDate;
          });
        }
        break;
    }
  }
  
  return events.map((event: any) => ({
    id: event.id,
    title: event.title,
    status: event.status,
    isFeatured: event.isFeatured,
    creatorName: event.creator?.username || 'نامشخص',
    deadline: event.bettingDeadline && typeof event.bettingDeadline === 'string' ? format(new Date(event.bettingDeadline as string), 'yyyy/MM/dd HH:mm') : 'نامشخص',
    _original: event 
  }));
});

const totalEvents = computed(() => formattedEvents.value.length);

// متغیر برای رویدادهای فیلتر شده
const filteredEvents = computed(() => formattedEvents.value);

// تابع برای به‌روزرسانی فیلترها
function handleFiltersUpdate(newFilters: any) {
  filters.value = { ...newFilters };
}

// --- توابع فیلتر و جستجو ---
function handleSearch() {
  // جستجو به صورت real-time انجام می‌شود
}

function handleFilter() {
  // فیلتر به صورت real-time انجام می‌شود
}

function clearFilters() {
  filters.value = {
    search: '',
    status: '',
    featured: '',
    dateRange: '',
    startDate: '',
    endDate: ''
  };
}

function openModal(event: any, type: 'approve' | 'reject') {
  selectedEvent.value = event;
  actionType.value = type;
  adminNote.value = '';
  isModalOpen.value = true;
}

async function handleConfirmAction() {
  if (!selectedEvent.value) return;
  
  isLoading.value = true;
  const endpoint = `/api/admin/events/${selectedEvent.value.id}/${actionType.value}`;
  const body = actionType.value === 'reject' ? { adminNote: adminNote.value } : {};

  try {
    await $fetch(endpoint, { 
      method: 'PUT', 
      body,
      headers: {
        'x-dev-user-wallet': 'wallet_superadmin'
      }
    });
    await refresh();
    isModalOpen.value = false;
  } catch (err) {
    console.error(`Failed to ${actionType.value} event:`, err);
  } finally {
    isLoading.value = false;
  }
}

// --- توابع جدید ---
function openResolveModal(event: any) {
  selectedEvent.value = event;
  winningOutcomeId.value = '';
  isResolveModalOpen.value = true;
  // TODO: دریافت آمار شرط‌بندی از API
  bettingStats.value = {
    totalBets: 0,
    totalAmount: 0
  };
}

async function handleResolveEvent() {
  if (!selectedEvent.value || !winningOutcomeId.value) return;
  
  isResolveLoading.value = true;
  
  try {
    await $fetch(`/api/admin/events/${selectedEvent.value.id}/resolve`, {
      method: 'POST',
      headers: {
        'x-dev-user-wallet': 'wallet_superadmin'
      },
      body: {
        winningOutcomeId: winningOutcomeId.value
      }
    });
    
    await refresh();
    isResolveModalOpen.value = false;
    // TODO: نمایش پیام موفقیت
  } catch (err) {
    console.error('Failed to resolve event:', err);
    // TODO: نمایش خطا به کاربر
  } finally {
    isResolveLoading.value = false;
  }
}

// --- توابع validation ---
function isEventReadyForResolve(event: any): boolean {
  if (!event || !event.bettingDeadline) return false;
  
  const now = new Date();
  const deadline = new Date(event.bettingDeadline);
  
  // فقط رویدادهایی که مهلتشان تمام شده قابل تسویه هستند
  return now >= deadline;
}

// تابع برای نمایش برچسب وضعیت
function getStatusLabel(value: string): string {
  const option = statusOptions.find(opt => opt.value === value);
  return option ? option.label : '';
}

// تابع برای نمایش برچسب ویژه
function getFeaturedLabel(value: string): string {
  const option = featuredOptions.find(opt => opt.value === value);
  return option ? option.label : '';
}

// تابع برای نمایش برچسب تاریخ
function getDateRangeLabel(value: string): string {
  const option = dateRangeOptions.find(opt => opt.value === value);
  return option ? option.label : '';
}

// --- توابع ایجاد رویداد ---
// openCreateEventModal removed - now using page-based navigation

function openTemplateBasedModal() {
  isTemplateModalOpen.value = true;
  loadTemplates();
  resetTemplateEvent();
}

function openFreeFormModal() {
  isFreeFormModalOpen.value = true;
  resetFreeFormEvent();
}



// --- توابع قالب‌ها ---
async function loadTemplates() {
  try {
    const response = await $fetch('/api/templates', {
      // این endpoint عمومی است؛ هدر توسعه لازم نیست
    }) as any;
    templates.value = response?.data?.templates || [];
  } catch (err) {
    console.error('Failed to load templates:', err);
  }
}

function getSelectedTemplateName(): string {
  if (!templateBasedEvent.value.templateId) return '';
  const template = templates.value.find(t => t.id === templateBasedEvent.value.templateId);
  return template?.name || '';
}

function selectTemplate(template: any) {
  templateBasedEvent.value.templateId = template.id;
  selectedTemplate.value = template;
  
  // تنظیم فیلدهای پیش‌فرض
  templateBasedEvent.value.templateInputs = {};
  template.structure?.fields?.forEach((field: any) => {
    templateBasedEvent.value.templateInputs[field.name] = '';
  });
  
  // تنظیم outcomes بر اساس نوع قالب
  if (template.outcomesStructure?.type === 'DYNAMIC') {
    templateBasedEvent.value.outcomes = [];
    for (let i = 0; i < template.outcomesStructure.min; i++) {
      templateBasedEvent.value.outcomes.push({ title: '' });
    }
  } else if (template.outcomesStructure?.type === 'FIXED') {
    templateBasedEvent.value.outcomes = template.outcomesStructure.options || [];
  }
}

function resetTemplateEvent() {
  templateBasedEvent.value = {
    templateId: '' as string,
    templateInputs: {} as Record<string, string>,
    bettingDeadline: '',
    isFeatured: false,
    outcomes: [] as Array<{ title: string }>
  };
  selectedTemplate.value = null;
}

function addTemplateOutcome() {
  if (selectedTemplate.value?.outcomesStructure?.type === 'DYNAMIC') {
    const max = selectedTemplate.value.outcomesStructure.max;
    if (templateBasedEvent.value.outcomes.length < max) {
      templateBasedEvent.value.outcomes.push({ title: '' });
    }
  }
}

function removeTemplateOutcome(index: number) {
  if (selectedTemplate.value?.outcomesStructure?.type === 'DYNAMIC') {
    const min = selectedTemplate.value.outcomesStructure.min;
    if (templateBasedEvent.value.outcomes.length > min) {
      templateBasedEvent.value.outcomes.splice(index, 1);
    }
  }
}

function getTemplateTitlePreview(): string {
  if (!selectedTemplate.value) return '';
  const structure = selectedTemplate.value.structure;
  let title = structure?.titleStructure || '';
  if (!title) return '';
  const inputs = templateBasedEvent.value.templateInputs || {};
  (structure?.inputs || []).forEach((inp: any) => {
    const val = inputs[inp.name] || '';
    title = title.replace(new RegExp(`\\[${inp.name}\\]`, 'g'), val);
  });
  return title;
}

function isAllTemplateInputsFilled(): boolean {
  if (!selectedTemplate.value) return false;
  const inputs = selectedTemplate.value.structure?.inputs || [];
  return inputs.every((inp: any) => {
    const v = (templateBasedEvent.value.templateInputs || {})[inp.name];
    return typeof v === 'string' && v.trim() !== '';
  });
}

const isTemplateEventValid = computed(() => {
  if (!templateBasedEvent.value.templateId || !templateBasedEvent.value.bettingDeadline) {
    return false;
  }
  if (!isAllTemplateInputsFilled()) {
    return false;
  }
  
  if (selectedTemplate.value?.outcomesStructure?.type === 'DYNAMIC') {
    const min = selectedTemplate.value.outcomesStructure.min;
    const max = selectedTemplate.value.outcomesStructure.max;
    const outcomesCount = templateBasedEvent.value.outcomes.length;
    
    return outcomesCount >= min && 
           outcomesCount <= max && 
           templateBasedEvent.value.outcomes.every(outcome => outcome.title.trim() !== '');
  }
  
  return true;
});

async function handleCreateTemplateEvent() {
  if (!isTemplateEventValid.value) return;
  
  isTemplateLoading.value = true;
  
  try {
    await $fetch('/api/events', {
      method: 'POST',
      headers: {
        'x-dev-user-wallet': 'wallet_superadmin'
      },
      body: {
        templateId: templateBasedEvent.value.templateId,
        templateInputs: templateBasedEvent.value.templateInputs,
        bettingDeadline: templateBasedEvent.value.bettingDeadline,
        isFeatured: templateBasedEvent.value.isFeatured,
        outcomes: templateBasedEvent.value.outcomes
      }
    });
    
    await refresh();
    isTemplateModalOpen.value = false;
    // TODO: نمایش پیام موفقیت
  } catch (err) {
    console.error('Failed to create template event:', err);
    // TODO: نمایش خطا به کاربر
  } finally {
    isTemplateLoading.value = false;
  }
}

// --- توابع فرم آزاد ---
function resetFreeFormEvent() {
  freeFormEvent.value = {
    title: '',
    description: '',
    bettingDeadline: '',
    imageUrl: '',
    resolutionSourceUrl: '',
    isFeatured: false,
    outcomes: [
      { title: '', imageUrl: '' },
      { title: '', imageUrl: '' }
    ]
  };
}

function addFreeFormOutcome() {
  if (freeFormEvent.value.outcomes.length < 10) {
    freeFormEvent.value.outcomes.push({ title: '', imageUrl: '' });
  }
}

const isFreeFormEventValid = computed(() => {
  return freeFormEvent.value.title.trim() !== '' &&
         freeFormEvent.value.bettingDeadline !== '' &&
         freeFormEvent.value.outcomes.length >= 2 &&
         freeFormEvent.value.outcomes.every(outcome => outcome.title.trim() !== '');
});

async function handleCreateFreeFormEvent() {
  if (!isFreeFormEventValid.value) return;
  
  isFreeFormLoading.value = true;
  
  try {
    await $fetch('/api/admin/events/create-custom', {
      method: 'POST',
      headers: {
        'x-dev-user-wallet': 'wallet_superadmin'
      },
      body: {
        title: freeFormEvent.value.title,
        description: freeFormEvent.value.description,
        bettingDeadline: freeFormEvent.value.bettingDeadline,
        imageUrl: freeFormEvent.value.imageUrl || undefined,
        resolutionSourceUrl: freeFormEvent.value.resolutionSourceUrl || undefined,
        isFeatured: freeFormEvent.value.isFeatured,
        outcomes: freeFormEvent.value.outcomes.map(outcome => outcome.title)
      }
    });
    
    await refresh();
    isFreeFormModalOpen.value = false;
    // TODO: نمایش پیام موفقیت
  } catch (err) {
    console.error('Failed to create free form event:', err);
    // TODO: نمایش خطا به کاربر
  } finally {
    isFreeFormLoading.value = false;
  }
}

async function toggleFeatured(event: any) {
  try {
    const newFeaturedStatus = !event.isFeatured;
    
    await $fetch(`/api/admin/events/${event.id}/featured`, {
      method: 'PUT' as any,
      headers: {
        'x-dev-user-wallet': 'wallet_superadmin'
      },
      body: {
        isFeatured: newFeaturedStatus
      }
    });
    
    await refresh();
    // TODO: نمایش پیام موفقیت
  } catch (err) {
    console.error('Failed to toggle featured:', err);
    // TODO: نمایش خطا به کاربر
  }
}


</script>