<template>
  <Teleport to="body">
    <div v-if="isOpen && !hasActiveModals" class="command-palette-overlay" @click="close" style="z-index: 9999;">
      <div class="command-palette-container" @click.stop>
        <div class="flex items-center border-b px-3">
          <UIcon name="i-heroicons-magnifying-glass" class="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            ref="inputRef"
            v-model="search"
            placeholder="جستجو در دستورات..."
            class="command-palette-input"
            @keydown.escape="close"
            @keydown.up.prevent="selectPrevious"
            @keydown.down.prevent="selectNext"
            @keydown.enter.prevent="executeSelected"
          />
        </div>
        <div class="command-palette-list">
          <div v-if="!search" class="p-6 text-center">
            <UIcon name="i-heroicons-command-line" class="mx-auto h-12 w-12 opacity-50" />
            <p class="mt-2 text-sm text-muted-foreground">
              دستورات موجود را جستجو کنید...
            </p>
          </div>
          <div v-else-if="filteredCommands.length === 0" class="p-6 text-center">
            <UIcon name="i-heroicons-magnifying-glass" class="mx-auto h-12 w-12 opacity-50" />
            <p class="mt-2 text-sm text-muted-foreground">
              هیچ دستوری یافت نشد
            </p>
          </div>
          <div v-else>
            <!-- Navigation Commands -->
            <div v-if="groupedCommands.navigation && groupedCommands.navigation.length > 0">
              <div class="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                ناوبری
              </div>
              <div
                v-for="(item, index) in groupedCommands.navigation"
                :key="item.id"
                :class="[
                  'command-palette-item',
                  { 'command-palette-item-selected': selectedIndex === getItemIndex('navigation', index) }
                ]"
                @click="executeItem(item)"
                @mouseenter="selectedIndex = getItemIndex('navigation', index)"
              >
                <div class="command-palette-item-icon">
                  <UIcon :name="item.icon" class="h-4 w-4" />
                </div>
                <div class="command-palette-item-content">
                  <div class="command-palette-item-title">{{ item.title }}</div>
                  <div class="command-palette-item-description">{{ item.description }}</div>
                </div>
                <div v-if="item.shortcut" class="command-palette-shortcut">
                  {{ item.shortcut }}
                </div>
              </div>
            </div>

            <!-- User Search Results -->
            <div v-if="groupedCommands.users && groupedCommands.users.length > 0">
              <div class="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                کاربران
              </div>
              <div
                v-for="(item, index) in groupedCommands.users"
                :key="item.id"
                :class="[
                  'command-palette-item',
                  { 'command-palette-item-selected': selectedIndex === getItemIndex('users', index) }
                ]"
                @click="executeItem(item)"
                @mouseenter="selectedIndex = getItemIndex('users', index)"
              >
                <div class="command-palette-item-icon">
                  <UIcon :name="item.icon" class="h-4 w-4" />
                </div>
                <div class="command-palette-item-content">
                  <div class="command-palette-item-title">{{ item.title }}</div>
                  <div class="command-palette-item-description">{{ item.description }}</div>
                </div>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="isLoading" class="p-4 text-center">
              <UIcon name="i-heroicons-arrow-path" class="mx-auto h-6 w-6 animate-spin opacity-50" />
              <p class="mt-2 text-sm text-muted-foreground">در حال جستجو...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// Import the composable
import { useCommandPalette } from '~/composables/useCommandPalette'
import { useModalManager } from '~/composables/useModalManager'

// Props
interface Props {
  modelValue?: boolean | Ref<boolean>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Use the command palette composable
const {
  isOpen,
  search,
  selectedIndex,
  isLoading,
  filteredCommands,
  groupedCommands,
  open,
  close,
  toggle,
  executeSelected,
  selectNext,
  selectPrevious
} = useCommandPalette()

// Use modal manager
const { hasActiveModals } = useModalManager()

// Computed
const isOpenComputed = computed({
  get: () => unref(props.modelValue),
  set: (value) => emit('update:modelValue', value)
})

// Methods
const executeItem = (item: any) => {
  item.action()
  close()
}

const getItemIndex = (category: string, categoryIndex: number) => {
  let index = 0
  for (const [cat, items] of Object.entries(groupedCommands.value)) {
    if (cat === category) {
      return index + categoryIndex
    }
    index += (items as any[]).length
  }
  return 0
}

// Reactive refs
const inputRef = ref<HTMLInputElement>()

// Watch for open state
watch(isOpenComputed, (newValue) => {
  if (newValue) {
    open()
    nextTick(() => {
      inputRef.value?.focus()
    })
  } else {
    close()
  }
})

watch(isOpen, (newValue) => {
  isOpenComputed.value = newValue
})
</script>

<style scoped>
/* Additional scoped styles */
.command-palette-item-selected {
  background-color: #3b82f6;
  color: white;
}

.command-palette-item-selected .command-palette-item-description {
  color: #dbeafe;
}

.command-palette-item-selected .command-palette-shortcut {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}
</style> 