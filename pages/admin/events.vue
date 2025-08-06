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
            <td class="whitespace-nowrap px-4 py-4 text-sm">{{ event.deadline }}</td>
            <td class="whitespace-nowrap px-4 py-4 text-sm">
              <div v-if="event.status === 'PENDING_APPROVAL'" class="flex items-center gap-2">
                <UButton size="xs" color="success" @click="openEventDetails(event._original, 'approve')">تأیید</UButton>
                <UButton size="xs" color="error" variant="soft" @click="openEventDetails(event._original, 'reject')">رد</UButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="text-center py-10"><p>هیچ رویدادی برای نمایش وجود ندارد.</p></div>

    <!-- مودال جزئیات رویداد -->
    <UModal v-model="isEventDetailsOpen">
      <UCard @click.stop>
        <template #header>
          <h3 class="text-base font-semibold">
            {{ currentAction === 'approve' ? 'تأیید رویداد' : 'رد کردن رویداد' }}
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
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ formattedDeadline }}</p>
            </div>
          </div>

          <!-- فرم دلیل رد کردن -->
          <div v-if="currentAction === 'reject'" class="mt-6">
            <UFormGroup label="دلیل رد کردن (اجباری)" name="adminNote">
              <UTextarea v-model="rejectNote" placeholder="لطفاً دلیل رد کردن رویداد را بنویسید..." />
            </UFormGroup>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="closeModal">انصراف</UButton>
            <UButton 
              v-if="currentAction === 'approve'"
              color="success" 
              @click="handleApprove(selectedEvent)"
            >
              تأیید رویداد
            </UButton>
            <UButton 
              v-if="currentAction === 'reject'"
              color="error" 
              :disabled="!rejectNote.trim()"
              @click="handleRejectFromDetails"
            >
              رد کردن رویداد
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns-jalali'
import { useModalManager } from '~/composables/useModalManager'

definePageMeta({ layout: 'admin' });

// Use modal manager
const { registerModal, unregisterModal } = useModalManager()
const MODAL_ID = 'events-modal'

// تعریف interface برای Event
interface EventData {
  id?: string;
  title?: string;
  status?: string;
  bettingDeadline?: string;
  creator?: {
    id?: string;
    username?: string;
    wallet_address?: string;
  };
  [key: string]: any;
}

// State برای مودال
const selectedEvent = ref<EventData | null>(null)
const isEventDetailsOpen = ref(false)
const currentAction = ref<'approve' | 'reject'>('approve')
const rejectNote = ref('')

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
  return data.value.events.map((event: any) => ({
    id: event.id,
    title: event.title,
    status: event.status,
    creatorName: event.creator?.username || 'نامشخص',
    deadline: event.bettingDeadline && typeof event.bettingDeadline === 'string' ? format(new Date(event.bettingDeadline as string), 'yyyy/MM/dd HH:mm') : 'نامشخص',
    _original: event 
  }));
});

const formattedDeadline = computed(() => {
  if (!selectedEvent.value?.bettingDeadline) return 'نامشخص';
  try {
    const deadline = selectedEvent.value.bettingDeadline;
    if (typeof deadline === 'string' && deadline.trim()) {
      return format(new Date(deadline), 'yyyy/MM/dd HH:mm');
    }
    return 'نامشخص';
  } catch {
    return 'نامشخص';
  }
});

async function handleApprove(event: EventData | null) {
  if (!event?.id) return;
  
  try {
    await $fetch(`/api/admin/events/${event.id}/approve`, { 
      method: 'PUT',
      headers: {
        'x-dev-user-wallet': 'wallet_superadmin'
      }
    });
    isEventDetailsOpen.value = false;
    unregisterModal(MODAL_ID);
    await refresh();
    // TODO: نمایش پیام موفقیت
  } catch (err) {
    console.error('Failed to approve event:', err);
    // TODO: نمایش خطا به کاربر
  }
}

function openEventDetails(event: EventData, action: 'approve' | 'reject') {
  selectedEvent.value = event;
  currentAction.value = action;
  rejectNote.value = '';
  isEventDetailsOpen.value = true;
  registerModal(MODAL_ID);
}

function closeModal() {
  isEventDetailsOpen.value = false;
  unregisterModal(MODAL_ID);
}

// Watch for modal state changes
watch(isEventDetailsOpen, (isOpen) => {
  if (!isOpen) {
    unregisterModal(MODAL_ID);
  }
})

async function handleRejectFromDetails() {
  if (!selectedEvent.value?.id) return;
  
  try {
    await $fetch(`/api/admin/events/${selectedEvent.value.id}/reject`, {
      method: 'PUT',
      headers: {
        'x-dev-user-wallet': 'wallet_superadmin'
      },
      body: { adminNote: rejectNote.value }
    });
    
    isEventDetailsOpen.value = false;
    unregisterModal(MODAL_ID);
    await refresh();
    // TODO: نمایش پیام موفقیت
  } catch (err) {
    console.error('Failed to reject event:', err);
    // TODO: نمایش خطا به کاربر
  }
}
</script>