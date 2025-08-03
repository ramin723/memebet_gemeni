// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ["@nuxt/ui"],
  pages: true,
  
  // تنظیمات Nuxt UI
  ui: {
    // Your configuration options here if needed in the future
  },
  
  // تنظیمات کامپوننت‌ها
  components: {
    dirs: [
      '~/components'
    ]
  },
  
  // تنظیمات CSS
  css: [
    '~/assets/css/command-palette.css'
  ]
})
