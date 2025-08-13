<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">ایجاد رویداد - فرم آزاد</h1>
            <p class="mt-2 text-gray-600">رویداد کاملاً سفارشی خود را ایجاد کنید</p>
          </div>
          <NuxtLink 
            to="/admin/events/create/" 
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UIcon name="i-heroicons-arrow-right" class="ml-2 h-4 w-4" />
            بازگشت به انتخاب نوع
          </NuxtLink>
        </div>
      </div>

      <!-- Form -->
      <UCard class="mb-8">
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900">اطلاعات رویداد</h3>
        </template>
        
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Title -->
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
              عنوان رویداد *
            </label>
            <input
              id="title"
              v-model="eventData.title"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="عنوان رویداد را وارد کنید"
            />
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
              توضیحات *
            </label>
            <textarea
              id="description"
              v-model="eventData.description"
              rows="4"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="توضیحات کامل رویداد را وارد کنید"
            />
          </div>

          <!-- End Date -->
          <div>
            <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">
              تاریخ پایان *
            </label>
            <input
              id="endDate"
              v-model="eventData.endDate"
              type="datetime-local"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <!-- Outcomes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              نتایج ممکن *
            </label>
            <div class="space-y-3">
              <div v-for="(outcome, index) in eventData.outcomes" :key="index" class="flex gap-2">
                <input
                  v-model="outcome.title"
                  type="text"
                  required
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="عنوان نتیجه"
                />
                <UButton
                  v-if="eventData.outcomes.length > 2"
                  @click="removeOutcome(index)"
                  color="red"
                  variant="ghost"
                  size="sm"
                >
                  <UIcon name="i-heroicons-trash" class="h-4 w-4" />
                </UButton>
              </div>
              <UButton
                @click="addOutcome"
                type="button"
                color="secondary"
                variant="outline"
                size="sm"
              >
                <UIcon name="i-heroicons-plus" class="h-4 w-4 ml-2" />
                افزودن نتیجه
              </UButton>
            </div>
          </div>

          <!-- Tags -->
          <div>
            <label for="tags" class="block text-sm font-medium text-gray-700 mb-2">
              برچسب‌ها
            </label>
            <input
              id="tags"
              v-model="eventData.tags"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="برچسب‌ها را با کاما جدا کنید"
            />
            <p class="text-sm text-gray-500 mt-1">مثال: ورزش، فوتبال، لیگ برتر</p>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end gap-3">
            <NuxtLink
              to="/admin/events/create/"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              انصراف
            </NuxtLink>
            <UButton
              type="submit"
              color="primary"
              variant="solid"
              :loading="isSubmitting"
            >
              ایجاد رویداد
            </UButton>
          </div>
        </form>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
});

// Event data
const eventData = ref({
  title: '',
  description: '',
  endDate: '',
  outcomes: [
    { title: '' },
    { title: '' }
  ],
  tags: ''
});

const isSubmitting = ref(false);

// Add outcome
const addOutcome = () => {
  eventData.value.outcomes.push({ title: '' });
};

// Remove outcome
const removeOutcome = (index: number) => {
  eventData.value.outcomes.splice(index, 1);
};

// Handle form submission
const handleSubmit = async () => {
  if (eventData.value.outcomes.length < 2) {
    alert('حداقل دو نتیجه باید تعریف شود');
    return;
  }

  isSubmitting.value = true;
  
  try {
    // TODO: Implement API call to create event
    console.log('Creating event:', eventData.value);
    
    // Redirect to events list
    await navigateTo('/admin/events');
  } catch (error) {
    console.error('Error creating event:', error);
    alert('خطا در ایجاد رویداد');
  } finally {
    isSubmitting.value = false;
  }
};
</script>
