import { defineEventHandler, createError } from '#imports';

export default defineEventHandler(async (event) => {
  const url = event.node.req.url || '';

  // این نگهبان فقط روی مسیرهای ادمین اعمال می‌شود
  if (url.startsWith('/api/admin/')) {
    console.log('🔒 [Admin Middleware] Checking admin access for path:', url);

    // بررسی وجود کاربر
    if (!event.context.user) {
      console.log('❌ [Admin Middleware] No user found in context');
      throw createError({
        statusCode: 401,
        message: 'احراز هویت مورد نیاز است'
      });
    }

    // بررسی نقش ادمین
    if (event.context.user.role !== 'ADMIN') {
      console.log('❌ [Admin Middleware] User is not admin:', {
        userId: event.context.user.id,
        userRole: event.context.user.role
      });
      throw createError({
        statusCode: 403,
        message: 'شما دسترسی لازم برای این عملیات را ندارید'
      });
    }

    console.log('✅ [Admin Middleware] Admin access granted:', {
      userId: event.context.user.id,
      userRole: event.context.user.role
    });
  }
}); 