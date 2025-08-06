import { ref, computed, watch, onMounted, onUnmounted, readonly, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { defu } from 'defu'

// Types
interface Command {
  id: string;
  title: string;
  description?: string;
  icon: string;
  shortcut?: string; //  <-- FIX 1: Add shortcut back as an optional property
  action: () => void;
  category: string;
}

interface UserSearchResult {
  id: string;
  username: string | null;
  wallet_address: string;
}

interface ApiUserResponse {
  data: {
    users: UserSearchResult[];
  }
}

// State a global, so it can be shared across components
const isOpen = ref(false)
const isModalActive = ref(false) // <-- متغیر جدید و حیاتی

export const useCommandPalette = (options: any = {}) => {
  const { defineShortcuts, ...shortcutOptions } = defu(options, {
    open: true,
    close: true,
    closeOnContentClick: true
  })

  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value ? close() : open()
  }

  // این تابع را به گونه‌ای تغییر می‌دهیم که وقتی مودال فعال است، کاری انجام ندهد
  function onSelect(option: any) {
    if (isModalActive.value) return // <-- شرط جدید

    if (option.click) {
      option.click()
    } else if (option.to) {
      // ... (بقیه کد بدون تغییر)
    }
  }

  return {
    isOpen,
    isModalActive, // <-- متغیر جدید را export می‌کنیم
    open,
    close,
    toggle,
    onSelect
  }
}