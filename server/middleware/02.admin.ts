import { defineEventHandler, createError } from '#imports';

// تعریف دسترسی‌های مختلف
const PERMISSIONS = {
  USER_MANAGEMENT: 'user_management',
  EVENT_MANAGEMENT: 'event_management',
  FINANCIAL_MANAGEMENT: 'financial_management',
  TEMPLATE_MANAGEMENT: 'template_management',
  TAG_MANAGEMENT: 'tag_management',
  SYSTEM_ADMIN: 'system_admin'
} as const;

// تعریف مسیرها و دسترسی‌های مورد نیاز
const PATH_PERMISSIONS: Record<string, string[]> = {
  '/api/admin/users/': [PERMISSIONS.USER_MANAGEMENT],
  '/api/admin/events/': [PERMISSIONS.EVENT_MANAGEMENT],
  '/api/admin/deposits/': [PERMISSIONS.FINANCIAL_MANAGEMENT],
  '/api/admin/withdrawals/': [PERMISSIONS.FINANCIAL_MANAGEMENT],
  '/api/admin/templates/': [PERMISSIONS.TEMPLATE_MANAGEMENT],
  '/api/admin/tags/': [PERMISSIONS.TAG_MANAGEMENT],
  '/api/admin/test/': [PERMISSIONS.SYSTEM_ADMIN]
};

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

    const user = event.context.user;

    // بررسی نقش ادمین
    if (user.role !== 'ADMIN') {
      console.log('❌ [Admin Middleware] User is not admin:', {
        userId: user.id,
        userRole: user.role
      });
      throw createError({
        statusCode: 403,
        message: 'شما دسترسی لازم برای این عملیات را ندارید'
      });
    }

    // بررسی وضعیت کاربر
    if (user.status !== 'ACTIVE') {
      console.log('❌ [Admin Middleware] User is not active:', {
        userId: user.id,
        userStatus: user.status
      });
      throw createError({
        statusCode: 403,
        message: 'حساب کاربری شما غیرفعال است'
      });
    }

    // بررسی دسترسی‌های خاص
    const requiredPermissions = getRequiredPermissions(url);
    if (requiredPermissions.length > 0) {
      const userPermissions = user.permissions || {};
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions[permission] === true || userPermissions[PERMISSIONS.SYSTEM_ADMIN] === true
      );

      if (!hasPermission) {
        console.log('❌ [Admin Middleware] User lacks required permissions:', {
          userId: user.id,
          requiredPermissions,
          userPermissions
        });
        throw createError({
          statusCode: 403,
          message: 'شما دسترسی لازم برای این عملیات را ندارید'
        });
      }
    } else {
      // اگر مسیر خاصی تعریف نشده، فقط بررسی ADMIN بودن کافی است
      console.log('✅ [Admin Middleware] General admin access granted');
    }

    console.log('✅ [Admin Middleware] Admin access granted:', {
      userId: user.id,
      userRole: user.role,
      userStatus: user.status,
      userPermissions: user.permissions
    });
  }
});

// تابع برای تعیین دسترسی‌های مورد نیاز بر اساس URL
function getRequiredPermissions(url: string): string[] {
  for (const [path, permissions] of Object.entries(PATH_PERMISSIONS)) {
    if (url.startsWith(path)) {
      return permissions;
    }
  }
  
  // اگر مسیر خاصی تعریف نشده، دسترسی SYSTEM_ADMIN نیاز است
  return [PERMISSIONS.SYSTEM_ADMIN];
} 