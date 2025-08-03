import { ofetch } from 'ofetch';

export default defineNuxtPlugin((nuxtApp) => {
  // این پلاگین فقط باید در حالت توسعه اجرا شود
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  console.log('🔧 Development Headers Plugin loaded (v2 - Robust)');

  // این آدرس کیف پول ادمین اصلی ماست
  const DEV_WALLET_ADDRESS = 'wallet_superadmin';

  // --- بخش سرور (برای رندر اولیه و useAsyncData) ---
  if (process.server) {
    const event = useRequestEvent();
    if (event) {
      // هدر را به درخواست‌های ورودی اضافه می‌کنیم تا میدل‌ور آن را ببیند
      event.node.req.headers['x-dev-user-wallet'] = DEV_WALLET_ADDRESS;
    }
  }

  // --- بخش کلاینت (برای تمام درخواست‌های useFetch از مرورگر) ---
  if (process.client) {
    // به جای بازنویسی $fetch، از nuxtApp.provide استفاده می‌کنیم
    // و یک composable برای استفاده در کامپوننت‌ها ارائه می‌دهیم
    nuxtApp.provide('devFetch', (url: string, options: any = {}) => {
      return $fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'x-dev-user-wallet': DEV_WALLET_ADDRESS,
        },
      });
    });

    // همچنین یک composable برای useFetch ارائه می‌دهیم
    nuxtApp.provide('useDevFetch', (url: string, options: any = {}) => {
      return useFetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'x-dev-user-wallet': DEV_WALLET_ADDRESS,
        },
      });
    });

    // هدر پیش‌فرض برای استفاده مستقیم
    nuxtApp.provide('devHeaders', {
      'x-dev-user-wallet': DEV_WALLET_ADDRESS,
    });
  }

  console.log('🔧 Client-side development fetch utilities configured.');
}); 