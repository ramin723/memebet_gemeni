<template>
  <div v-if="pending" class="py-10 text-center">
    <p>در حال بارگذاری رویدادها...</p>
  </div>
  
  <div v-else-if="error" class="py-10">
    <UAlert color="error" variant="soft" :title="error.message || 'خطا در دریافت اطلاعات رویدادها'" />
  </div>
  
  <ClientOnly v-else>
    <div v-if="formattedEvents.length" class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
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
                  <UButton size="xs" color="success" @click="$emit('approve-event', event._original)">تأیید</UButton>
                  <UButton size="xs" color="error" variant="soft" @click="$emit('reject-event', event._original)">رد</UButton>
                  <UButton size="xs" color="primary" variant="outline" @click="router.push(`/admin/events/edit/${event.id}`)">ویرایش</UButton>
                </div>
                
                <div v-if="event.status === 'ACTIVE'" class="flex items-center gap-2">
                  <UButton 
                    size="xs" 
                    color="primary" 
                    :disabled="!isEventReadyForResolve(event._original)"
                    @click="$emit('resolve-event', event._original)"
                  >
                    تسویه
                  </UButton>
                  <UButton 
                    size="xs" 
                    :color="event.isFeatured ? 'warning' : 'neutral'" 
                    variant="soft" 
                    @click="$emit('toggle-featured', event._original)"
                  >
                    {{ event.isFeatured ? 'حذف از ویژه' : 'ویژه' }}
                  </UButton>
                  <UButton size="xs" color="secondary" variant="outline" @click="router.push(`/admin/events/edit/${event.id}`)">ویرایش</UButton>
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
    <div v-else class="text-center py-10">
      <p>هیچ رویدادی برای نمایش وجود ندارد.</p>
    </div>
    <template #fallback>
      <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <p class="text-center py-10">در حال آماده‌سازی جدول...</p>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { format } from 'date-fns-jalali'

// Props
interface Props {
  events: any[]
  pending: boolean
  error: any
}

const props = defineProps<Props>()
const router = useRouter()

// Emits
defineEmits<{
  'approve-event': [event: any]
  'reject-event': [event: any]
  'resolve-event': [event: any]
  'toggle-featured': [event: any]
  'edit-event': [event: any]
}>()

// Columns definition
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'عنوان' },
  { key: 'status', label: 'وضعیت' },
  { key: 'creatorName', label: 'ایجاد کننده' },
  { key: 'deadline', label: 'مهلت شرط‌بندی' },
  { key: 'actions', label: 'اقدامات' }
]

// Computed
const formattedEvents = computed(() => {
  if (!props.events) return []
  
  return props.events.map((event: any) => ({
    id: event.id,
    title: event.title,
    status: event.status,
    isFeatured: event.isFeatured,
    creatorName: event.creator?.username || 'نامشخص',
    deadline: event.bettingDeadline && typeof event.bettingDeadline === 'string' 
      ? format(new Date(event.bettingDeadline as string), 'yyyy/MM/dd HH:mm') 
      : 'نامشخص',
    _original: event 
  }))
})

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

function isEventReadyForResolve(event: any): boolean {
  if (!event || !event.bettingDeadline) return false
  
  const now = new Date()
  const deadline = new Date(event.bettingDeadline)
  
  // فقط رویدادهایی که مهلتشان تمام شده قابل تسویه هستند
  return now >= deadline
}
</script>
