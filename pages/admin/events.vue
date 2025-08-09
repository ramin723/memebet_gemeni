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
        <UButton 
          icon="i-heroicons-plus-circle" 
          size="lg"
          @click="openCreateEventModal"
        >
          ایجاد رویداد جدید
        </UButton>
      </div>
    </div>

        <!-- فیلتر و جستجو -->
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

    <div v-if="pending" class="py-10 text-center"><p>در حال بارگذاری رویدادها...</p></div>
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
      <template #fallback>
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
           <p class="text-center py-10">در حال آماده‌سازی جدول...</p>
        </div>
      </template>
    </ClientOnly>

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
              <UTextarea 
                v-model="adminNote" 
                placeholder="لطفاً دلیل رد کردن رویداد را بنویسید..." 
                name="admin-note-textarea"
                id="admin-note-textarea"
              />
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

    <!-- مودال انتخاب نوع ایجاد رویداد -->
    <div v-if="isCreateModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click="isCreateModalOpen = false">
      <UCard @click.stop class="w-full max-w-md mx-4">
        <template #header>
          <h3 class="text-base font-semibold">انتخاب نوع ایجاد رویداد</h3>
        </template>
        
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4">
            <!-- ایجاد بر اساس قالب -->
            <UButton 
              variant="outline" 
              size="lg"
              class="h-20 flex flex-col items-center justify-center"
              @click="openTemplateBasedModal"
            >
              <UIcon name="i-heroicons-document-text" class="w-8 h-8 mb-2" />
              <span class="font-medium">ایجاد بر اساس قالب</span>
              <span class="text-sm text-gray-500">استفاده از قالب‌های از پیش تعریف شده</span>
            </UButton>
            
            <!-- ایجاد آزاد -->
            <UButton 
              variant="outline" 
              size="lg"
              class="h-20 flex flex-col items-center justify-center"
              @click="openFreeFormModal"
            >
              <UIcon name="i-heroicons-pencil-square" class="w-8 h-8 mb-2" />
              <span class="font-medium">ایجاد آزاد</span>
              <span class="text-sm text-gray-500">ایجاد رویداد سفارشی بدون محدودیت</span>
            </UButton>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end">
            <UButton color="neutral" variant="ghost" @click="isCreateModalOpen = false">انصراف</UButton>
          </div>
        </template>
      </UCard>
    </div>

    <!-- مودال ایجاد رویداد بر اساس قالب -->
    <div v-if="isTemplateModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click="isTemplateModalOpen = false">
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
                    v-model="templateBasedEvent.templateInputs[inputDef.name]"
                    :rows="3"
                    :placeholder="inputDef.placeholder || ''"
                  />
                </template>
                <template v-else>
                  <UInput
                    v-model="templateBasedEvent.templateInputs[inputDef.name]"
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
            <UButton color="neutral" variant="ghost" @click="isTemplateModalOpen = false">انصراف</UButton>
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
    <div v-if="isFreeFormModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click="isFreeFormModalOpen = false">
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
            <UButton color="neutral" variant="ghost" @click="isFreeFormModalOpen = false">انصراف</UButton>
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
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns-jalali'

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

// State برای مودال‌های ایجاد رویداد
const isCreateModalOpen = ref(false)
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
function openCreateEventModal() {
  isCreateModalOpen.value = true;
}

function openTemplateBasedModal() {
  isCreateModalOpen.value = false;
  isTemplateModalOpen.value = true;
  loadTemplates();
  resetTemplateEvent();
}

function openFreeFormModal() {
  isCreateModalOpen.value = false;
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