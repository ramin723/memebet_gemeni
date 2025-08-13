<template>
  <ClientOnly>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <!-- جستجو -->
        <div class="md:col-span-2">
          <UFormGroup label="جستجو" name="search">
            <UInput 
              v-model="filters.search" 
              placeholder="جستجو در عنوان، توضیحات و سازنده..."
              icon="i-heroicons-magnifying-glass"
              name="search-input"
              id="search-input"
            />
          </UFormGroup>
        </div>
        
        <!-- فیلتر وضعیت -->
        <div>
          <UFormGroup label="وضعیت" name="status">
            <UPopover :popper="{ placement: 'bottom-start' }">
              <UButton 
                variant="outline" 
                class="w-full justify-between"
                :class="{ 'text-gray-500': !filters.status }"
              >
                {{ getStatusLabel(filters.status) || 'همه وضعیت‌ها' }}
                <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
              </UButton>
              
              <template #content>
                <div class="w-48 p-1">
                  <UButton
                    v-for="option in statusOptions"
                    :key="option.value"
                    variant="ghost"
                    class="w-full justify-start"
                    :class="{ 'bg-primary-50 text-primary-700': filters.status === option.value }"
                    @click="filters.status = option.value"
                  >
                    {{ option.label }}
                  </UButton>
                </div>
              </template>
            </UPopover>
          </UFormGroup>
        </div>
        
        <!-- فیلتر Featured -->
        <div>
          <UFormGroup label="ویژه" name="featured">
            <UPopover :popper="{ placement: 'bottom-start' }">
              <UButton 
                variant="outline" 
                class="w-full justify-between"
                :class="{ 'text-gray-500': !filters.featured }"
              >
                {{ getFeaturedLabel(filters.featured) || 'همه رویدادها' }}
                <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
              </UButton>
              
              <template #content>
                <div class="w-48 p-1">
                  <UButton
                    v-for="option in featuredOptions"
                    :key="option.value"
                    variant="ghost"
                    class="w-full justify-start"
                    :class="{ 'bg-primary-50 text-primary-700': filters.featured === option.value }"
                    @click="filters.featured = option.value"
                  >
                    {{ option.label }}
                  </UButton>
                </div>
              </template>
            </UPopover>
          </UFormGroup>
        </div>
        
        <!-- فیلتر تاریخ -->
        <div>
          <UFormGroup label="تاریخ" name="dateRange">
            <UPopover :popper="{ placement: 'bottom-start' }">
              <UButton 
                variant="outline" 
                class="w-full justify-between"
                :class="{ 'text-gray-500': !filters.dateRange }"
              >
                {{ getDateRangeLabel(filters.dateRange) || 'همه تاریخ‌ها' }}
                <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
              </UButton>
              
              <template #content>
                <div class="w-48 p-1">
                  <UButton
                    v-for="option in dateRangeOptions"
                    :key="option.value"
                    variant="ghost"
                    class="w-full justify-start"
                    :class="{ 'bg-primary-50 text-primary-700': filters.dateRange === option.value }"
                    @click="filters.dateRange = option.value"
                  >
                    {{ option.label }}
                  </UButton>
                </div>
              </template>
            </UPopover>
          </UFormGroup>
        </div>
        
        <!-- فیلتر تاریخ سفارشی -->
        <div v-if="filters.dateRange === 'custom'" class="md:col-span-2">
          <div class="grid grid-cols-2 gap-2">
            <UFormGroup label="از تاریخ" name="startDate">
              <UInput 
                v-model="filters.startDate" 
                type="date"
                placeholder="از تاریخ"
                name="start-date-input"
                id="start-date-input"
              />
            </UFormGroup>
            <UFormGroup label="تا تاریخ" name="endDate">
              <UInput 
                v-model="filters.endDate" 
                type="date"
                placeholder="تا تاریخ"
                name="end-date-input"
                id="end-date-input"
              />
            </UFormGroup>
          </div>
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
    <template #fallback>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 h-[150px]">
        <p class="text-center pt-12">در حال بارگذاری فیلترها...</p>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
// Props
interface Props {
  totalEvents: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update-filters': [filters: any]
}>()

// Filters state
const filters = ref({
  search: '',
  status: '',
  featured: '',
  dateRange: '',
  startDate: '',
  endDate: ''
})

// Options
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

// Watch filters changes
watch(filters, (newFilters) => {
  emit('update-filters', newFilters)
}, { deep: true })

// Functions
function getStatusLabel(value: string): string {
  const option = statusOptions.find(opt => opt.value === value)
  return option ? option.label : ''
}

function getFeaturedLabel(value: string): string {
  const option = featuredOptions.find(opt => opt.value === value)
  return option ? option.label : ''
}

function getDateRangeLabel(value: string): string {
  const option = dateRangeOptions.find(opt => opt.value === value)
  return option ? option.label : ''
}

function clearFilters() {
  filters.value = {
    search: '',
    status: '',
    featured: '',
    dateRange: '',
    startDate: '',
    endDate: ''
  }
}
</script>
