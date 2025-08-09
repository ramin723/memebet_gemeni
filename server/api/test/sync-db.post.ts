import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV !== 'development') {
    throw createError({ statusCode: 403, message: 'This endpoint is only available in development mode.' });
  }

  try {
    console.log('🔄 Syncing database with new fields...');
    
    // همگام‌سازی با force: false و alter: true برای اضافه کردن ستون‌های جدید
    await event.context.sequelize.sync({ force: false, alter: true });
    
    console.log('✅ Database synced successfully!');
    
    return {
      success: true,
      message: 'Database synced successfully with new fields'
    };
    
  } catch (error: any) {
    console.error('❌ Database sync failed:', error);
    throw createError({
      statusCode: 500,
      message: 'Database sync failed',
      data: { details: error.message }
    });
  }
});
