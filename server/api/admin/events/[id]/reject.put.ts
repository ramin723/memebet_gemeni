import { defineEventHandler, createError, readBody, getRouterParam } from '#imports';
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

    // دریافت adminNote از body
    const body = await readBody(event);
    const { adminNote } = body;

    if (!adminNote) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Admin note is required'
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

    // تغییر وضعیت به REJECTED و ذخیره adminNote
    targetEvent.set('status', 'REJECTED');
    targetEvent.set('adminNote', adminNote);
    await targetEvent.save();

    return {
      success: true,
      message: 'Event rejected successfully',
      data: {
        id: targetEvent.get('id'),
        status: targetEvent.get('status'),
        adminNote: targetEvent.get('adminNote')
      }
    };

  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    
    console.error('Error rejecting event:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
}); 