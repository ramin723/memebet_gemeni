<template>
  <div class="flex h-screen bg-gray-100 dark:bg-gray-900">
    <aside class="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <AdminSidebar />
    </aside>

    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div>
          </div>
        <div>
          <!-- Command Palette removed -->
        </div>
      </header>
      <main class="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
        <UContainer>
          <slot />
        </UContainer>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// Admin layout with a persistent sidebar
</script>

<style>
/* Global styles for the admin panel */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style> 