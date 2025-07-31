import { defineEventHandler } from '#imports';
import adminMiddleware from '../../middleware/02.admin';

export default defineEventHandler(async (event) => {
  console.log('🧪 [/api/admin/test] Testing admin middleware...');

  try {
    // اجرای Middleware ادمین
    await adminMiddleware(event);

    console.log('✅ Admin middleware passed successfully');

    return {
      success: true,
      message: 'Admin middleware working correctly',
      user: event.context.user
    };

  } catch (error: any) {
    console.error('❌ Admin middleware failed:', error);
    
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode || 500
    };
  }
}); 