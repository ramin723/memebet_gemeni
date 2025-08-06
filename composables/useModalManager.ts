import { ref, readonly } from 'vue'

export const useModalManager = () => {
  const activeModals = ref<Set<string>>(new Set())

  const registerModal = (modalId: string) => {
    activeModals.value.add(modalId)
  }

  const unregisterModal = (modalId: string) => {
    activeModals.value.delete(modalId)
  }

  const hasActiveModals = computed(() => activeModals.value.size > 0)

  return {
    activeModals: readonly(activeModals),
    hasActiveModals: readonly(hasActiveModals),
    registerModal,
    unregisterModal
  }
} 