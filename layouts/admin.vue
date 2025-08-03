<template>
  <div class="bg-gray-100 dark:bg-gray-900 min-h-screen">
    <header class="bg-white dark:bg-gray-800 shadow-sm p-4">
      <div class="container mx-auto flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-800 dark:text-gray-200">پنل مدیریت MemeBet</h1>
        
        <!-- Command Palette Trigger Button -->
        <button
          @click="commandPalette.open()"
          class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <Icon name="heroicons:magnifying-glass" class="h-4 w-4" />
          <span class="hidden sm:inline">جستجو</span>
          <kbd class="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
            <span class="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>
    </header>
    
    <main class="p-4 sm:p-6 lg:p-8">
      <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>
    
    <!-- Command Palette Component -->
    <BaseCommandPalette v-model="commandPalette.isOpen" />
  </div>
</template>

<script setup lang="ts">
// Layout for the admin panel
const commandPalette = useCommandPalette()
</script>

<style>
/* Global styles for the admin panel */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style> 