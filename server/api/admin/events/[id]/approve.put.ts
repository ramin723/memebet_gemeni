import { defineEventHandler, createError, getRouterParam } from '#imports';
import adminMiddleware from '../../../../middleware/02.admin';
import { Event } from '../../../../models/Event';

export default defineEventHandler(async (event) => {
  try {
    // اعمال میدل‌ور ادمین
    await adminMiddleware(event);
    
    // دریافت eventId از پارامترها
    const eventId = getRouterParam(event, 'id');
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      });
    }

    // پیدا کردن رویداد
    const targetEvent = await Event.findByPk(eventId);
    
    if (!targetEvent) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      });
    }

    // بررسی وضعیت فعلی رویداد
    if (targetEvent.get('status') !== 'PENDING_APPROVAL') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event is not in PENDING_APPROVAL status'
      });
    }

    // تغییر وضعیت به ACTIVE
    targetEvent.set('status', 'ACTIVE');
    await targetEvent.save();

    return {
      success: true,
      message: 'Event approved successfully',
      data: {
        id: targetEvent.get('id'),
        status: targetEvent.get('status')
      }
    };

  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    
    console.error('Error approving event:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
}); 