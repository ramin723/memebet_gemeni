<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          مدیریت رویدادها
        </h1>
        <p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
          لیست تمام رویدادهای در انتظار تأیید، فعال و گذشته.
        </p>
      </div>
      <div>
        <UButton icon="i-heroicons-plus-circle" size="lg">ایجاد رویداد جدید</UButton>
      </div>
    </div>

        <!-- فیلتر و جستجو -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <!-- جستجو -->
        <div class="md:col-span-2">
          <UFormGroup label="جستجو" name="search">
            <UInput 
              v-model="filters.search" 
              placeholder="جستجو در عنوان، توضیحات و سازنده..."
              icon="i-heroicons-magnifying-glass"
            />
          </UFormGroup>
        </div>
        
        <!-- فیلتر وضعیت -->
        <div>
          <UFormGroup label="وضعیت" name="status">
            <USelectMenu 
              v-model="filters.status" 
              :options="statusOptions"
              placeholder="همه وضعیت‌ها"
            />
          </UFormGroup>
        </div>
        
        <!-- فیلتر Featured -->
        <div>
          <UFormGroup label="ویژه" name="featured">
            <USelectMenu 
              v-model="filters.featured" 
              :options="featuredOptions"
              placeholder="همه رویدادها"
            />
          </UFormGroup>
        </div>
        
        <!-- فیلتر تاریخ -->
        <div>
          <UFormGroup label="تاریخ" name="dateRange">
            <USelectMenu 
              v-model="filters.dateRange" 
              :options="dateRangeOptions"
              placeholder="همه تاریخ‌ها"
            />
          </UFormGroup>
        </div>
      </div>
      
      <!-- دکمه‌های عملیات -->
      <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex gap-2">
          <UButton 
            color="neutral" 
            variant="ghost" 
            size="sm"
            @click="clearFilters"
          >
            پاک کردن فیلترها
          </UButton>
        </div>
        
        <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>{{ totalEvents }} رویداد یافت شد</span>
        </div>
      </div>
    </div>

    <div v-if="pending" class="py-10 text-center"><p>در حال بارگذاری رویدادها...</p></div>
    <div v-else-if="error" class="py-10">
       <UAlert color="error" variant="soft" :title="error.message || 'خطا در دریافت اطلاعات رویدادها'" />
    </div>
    
    <div v-else-if="formattedEvents.length" class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th v-for="column in columns" :key="column.key" class="px-4 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="event in formattedEvents" :key="event.id">
            <td class="whitespace-nowrap px-4 py-4 text-sm">{{ event.id }}</td>
            <td class="whitespace-nowrap px-4 py-4 text-sm max-w-xs truncate">{{ event.title }}</td>
            <td class="whitespace-nowrap px-4 py-4 text-sm">
              <UBadge :color="getStatusColor(event.status)" variant="soft">{{ event.status }}</UBadge>
            </td>
            <td class="whitespace-nowrap px-4 py-4 text-sm">{{ event.creatorName }}</td>
            <td class="whitespace-nowrap px-4 py-4 text-sm">
              <div class="flex flex-col">
                <span>{{ event.deadline }}</span>
                <span v-if="event.status === 'ACTIVE'" class="text-xs text-gray-500">
                  {{ isEventReadyForResolve(event._original) ? 'آماده برای تسویه' : 'در انتظار پایان مهلت' }}
                </span>
              </div>
            </td>
            <td class="whitespace-nowrap px-4 py-4 text-sm">
              <div class="flex items-center gap-2">
                <!-- دکمه‌های عملیات بر اساس وضعیت -->
                <div v-if="event.status === 'PENDING_APPROVAL'" class="flex items-center gap-2">
                  <UButton size="xs" color="success" @click="openModal(event._original, 'approve')">تأیید</UButton>
                  <UButton size="xs" color="error" variant="soft" @click="openModal(event._original, 'reject')">رد</UButton>
                </div>
                
                <div v-if="event.status === 'ACTIVE'" class="flex items-center gap-2">
                  <UButton 
                    size="xs" 
                    color="primary" 
                    :disabled="!isEventReadyForResolve(event._original)"
                    @click="openResolveModal(event._original)"
                  >
                    تسویه
                  </UButton>
                  <UButton 
                    size="xs" 
                    :color="event.isFeatured ? 'warning' : 'neutral'" 
                    variant="soft" 
                    @click="toggleFeatured(event._original)"
                  >
                    {{ event.isFeatured ? 'حذف از ویژه' : 'ویژه' }}
                  </UButton>
                </div>
                
                <div v-if="event.status === 'RESOLVED'" class="flex items-center gap-2">
                  <UBadge color="success" variant="soft" size="xs">تسویه شده</UBadge>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="text-center py-10"><p>هیچ رویدادی برای نمایش وجود ندارد.</p></div>

    <!-- مودال جزئیات رویداد -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click="isModalOpen = false">
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
              <UBadge :color="getStatusColor(selectedEvent.status || '')" variant="soft" class="mt-1">{{ selectedEvent.status || 'نامشخص' }}</UBadge>
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
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ selectedEvent.bettingDeadline ? format(new Date(selectedEvent.bettingDeadline), 'yyyy/MM/dd HH:mm') : 'نامشخص' }}</p>
            </div>
          </div>

          <!-- فرم دلیل رد کردن -->
          <div v-if="actionType === 'reject'" class="mt-6">
            <UFormGroup label="دلیل رد کردن (اجباری)" name="adminNote">
              <UTextarea v-model="adminNote" placeholder="لطفاً دلیل رد کردن رویداد را بنویسید..." />
            </UFormGroup>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="isModalOpen = false">انصراف</UButton>
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
    <div v-if="isResolveModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click="isResolveModalOpen = false">
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
                v-model="winningOutcomeId" 
                :options="outcomeOptions"
                placeholder="نتیجه برنده را انتخاب کنید..."
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
            <UButton color="neutral" variant="ghost" @click="isResolveModalOpen = false">انصراف</UButton>
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
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns-jalali'

definePageMeta({ layout: 'admin' });

// --- ارتباط با CommandPalette ---
const { isModalActive } = useCommandPalette()

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
  dateRange: ''
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
  { label: 'هفته گذشته', value: 'last_week' },
  { label: 'ماه گذشته', value: 'last_month' },
  { label: 'سال گذشته', value: 'last_year' }
]

// --- Watcher برای همگام‌سازی وضعیت ---
watch(isModalOpen, (newValue) => {
  isModalActive.value = newValue
})

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
    const eventDate = new Date();
    
    switch (filters.value.dateRange) {
      case 'today':
        events = events.filter((event: any) => {
          const eventCreatedAt = new Date(event.createdAt);
          return eventCreatedAt.toDateString() === now.toDateString();
        });
        break;
      case 'last_week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        events = events.filter((event: any) => {
          const eventCreatedAt = new Date(event.createdAt);
          return eventCreatedAt >= weekAgo;
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
    dateRange: ''
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