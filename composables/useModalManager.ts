// composables/useModalManager.ts

import { ref, readonly, computed } from 'vue'

// ✅ وضعیت را به بیرون از تابع منتقل کنید تا در کل برنامه مشترک باشد
const activeModals = ref<Set<string>>(new Set())

export const useModalManager = () => {
  const registerModal = (modalId: string) => {
    activeModals.value.add(modalId)
  }

  const unregisterModal = (modalId: string) => {
    activeModals.value.delete(modalId)
  }

  const hasActiveModals = computed(() => activeModals.value.size > 0)

  return {
    activeModals: readonly(activeModals),
    hasActiveModals,
    registerModal,
    unregisterModal
  }
}