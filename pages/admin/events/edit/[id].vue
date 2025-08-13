<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">ویرایش رویداد</h1>
            <p class="mt-2 text-gray-600">اطلاعات رویداد را ویرایش کنید</p>
          </div>
          <NuxtLink 
            to="/admin/events" 
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UIcon name="i-heroicons-arrow-right" class="ml-2 h-4 w-4" />
            بازگشت به لیست رویدادها
          </NuxtLink>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="flex justify-center items-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">در حال بارگذاری رویداد...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <UIcon name="i-heroicons-exclamation-triangle" class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">خطا در بارگذاری رویداد</h3>
            <div class="mt-2 text-sm text-red-700">
              <p>{{ error.message || 'خطایی رخ داده است. لطفاً دوباره تلاش کنید.' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Form -->
      <div v-else-if="eventData" class="space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900">اطلاعات رویداد</h3>
          </div>
          
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Title -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">عنوان رویداد *</label>
              <input 
                v-model="eventData.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="عنوان رویداد را وارد کنید"
                required
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">توضیحات *</label>
              <textarea 
                v-model="eventData.description"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="توضیحات کامل رویداد را وارد کنید"
                required
              ></textarea>
            </div>

            <!-- Betting Deadline -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">مهلت شرط‌بندی *</label>
              <input 
                v-model="eventData.bettingDeadline"
                type="datetime-local"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              <p class="mt-1 text-sm text-gray-500">تاریخ و زمان پایان شرط‌بندی - پس از این زمان کاربران نمی‌توانند شرط ببندند</p>
            </div>

            <!-- Image URL -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">URL تصویر رویداد</label>
              <input 
                v-model="eventData.imageUrl"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://example.com/image.jpg"
              />
              <p class="mt-1 text-sm text-gray-500">لینک تصویر رویداد - ابتدا تصویر را در سرویس‌های مانند Imgur آپلود کرده و لینک آن را اینجا قرار دهید</p>
            </div>

            <!-- Resolution Source URL -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">URL منبع داوری</label>
              <input 
                v-model="eventData.resolutionSourceUrl"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://example.com/source"
              />
              <p class="mt-1 text-sm text-gray-500">لینک منبع رسمی برای داوری نتیجه - مانند سایت رسمی مسابقات، آمار رسمی یا خبرگزاری معتبر</p>
            </div>

            <!-- Outcomes -->
            <div class="space-y-4">
              <label class="block text-sm font-medium text-gray-700">
                نتایج ممکن *
              </label>
              <div class="space-y-3">
                <div v-for="(outcome, index) in eventData.outcomes" :key="index" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input 
                    v-model="outcome.title"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="عنوان نتیجه"
                    required
                  />
                  <div class="flex gap-2">
                    <input 
                      v-model="outcome.imageUrl"
                      type="url"
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="URL تصویر (اختیاری)"
                    />
                    <button
                      v-if="eventData.outcomes.length > 2"
                      type="button"
                      @click="removeOutcome(index)"
                      class="px-3 py-2 text-red-600 hover:text-red-800 focus:outline-none"
                    >
                      <UIcon name="i-heroicons-trash" class="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  @click="addOutcome"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <UIcon name="i-heroicons-plus" class="h-4 w-4 ml-2" />
                  افزودن نتیجه
                </button>
              </div>
            </div>

            <!-- Featured Event -->
            <div class="flex items-center gap-3">
              <input 
                v-model="eventData.isFeatured"
                type="checkbox"
                id="isFeatured"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label for="isFeatured" class="text-sm font-medium text-gray-700">
                رویداد ویژه
              </label>
            </div>

            <!-- Submit Buttons -->
            <div class="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button 
                type="button"
                @click="router.push('/admin/events')"
                class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                انصراف
              </button>
              <button 
                type="submit"
                :disabled="isSubmitting"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <span v-if="isSubmitting">در حال ذخیره...</span>
                <span v-else>ذخیره تغییرات</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()

// State
const eventData = ref<any>(null)
const pending = ref(true)
const error = ref<any>(null)
const isSubmitting = ref(false)

// Get event ID from route
const eventId = route.params.id as string

// Fetch event data
async function fetchEvent() {
  try {
    pending.value = true
    error.value = null
    
    const response = await $fetch(`/api/admin/events/${eventId}`, {
      headers: {
        'x-dev-user-wallet': 'wallet_superadmin'
      }
    }) as any
    
    if (response.success) {
      eventData.value = response.data
    } else {
      error.value = { message: response.message || 'خطا در بارگذاری رویداد' }
    }
  } catch (err: any) {
    error.value = { message: err.message || 'خطا در بارگذاری رویداد' }
  } finally {
    pending.value = false
  }
}

// Add outcome
function addOutcome() {
  eventData.value.outcomes.push({
    title: '',
    imageUrl: ''
  })
}

// Remove outcome
function removeOutcome(index: number) {
  if (eventData.value.outcomes.length > 2) {
    eventData.value.outcomes.splice(index, 1)
  }
}

// Handle form submission
async function handleSubmit() {
  try {
    isSubmitting.value = true
    
    const response = await $fetch(`/api/admin/events/${eventId}/edit`, {
      method: 'PUT',
      headers: {
        'x-dev-user-wallet': 'wallet_superadmin'
      },
      body: eventData.value
    }) as any
    
    if (response.success) {
      // Show success message and redirect
      await navigateTo('/admin/events')
    } else {
      error.value = { message: response.message || 'خطا در ذخیره تغییرات' }
    }
  } catch (err: any) {
    error.value = { message: err.message || 'خطا در ذخیره تغییرات' }
  } finally {
    isSubmitting.value = false
  }
}

// Fetch event data on component mount
onMounted(() => {
  fetchEvent()
})
</script>
