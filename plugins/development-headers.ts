export default defineNuxtPlugin((nuxtApp) => {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const DEV_WALLET_ADDRESS = 'wallet_superadmin'

  // برای درخواست‌های سمت سرور (SSR)
  if (process.server) {
    const event = useRequestEvent()
    if (event) {
      event.node.req.headers['x-dev-user-wallet'] = DEV_WALLET_ADDRESS
    }
  }

  // برای تمام درخواست‌های سمت کلاینت
  if (process.client) {
    // ارائه یک تابع devFetch برای استفاده در کامپوننت‌ها
    nuxtApp.provide('devFetch', (url: string, options: any = {}) => {
      return $fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'x-dev-user-wallet': DEV_WALLET_ADDRESS,
        },
      })
    })

    // اضافه کردن به payload برای جلوگیری از خطای serialization
    nuxtApp.payload.data = nuxtApp.payload.data || {}
    nuxtApp.payload.data.devWalletAddress = DEV_WALLET_ADDRESS
  }
}) 