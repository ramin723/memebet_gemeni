import { defineEventHandler, createError } from '#imports';
import { Event } from '../../../../models/Event';

export default defineEventHandler(async (event) => {
  console.log('🎯 [/api/admin/events/featured] Processing featured toggle...');

  const eventId = event.context.params?.id as string;
  const { isFeatured } = await readBody(event);

  if (!eventId || typeof isFeatured !== 'boolean') {
    throw createError({ statusCode: 400, message: 'شناسه رویداد و وضعیت Featured الزامی است' });
  }

  try {
    const eventInstance = await Event.findByPk(eventId);

    if (!eventInstance) {
      throw createError({ statusCode: 404, message: 'رویداد یافت نشد' });
    }

    // فقط رویدادهای فعال یا تأیید شده قابل تغییر وضعیت Featured هستند
    if (!['ACTIVE', 'RESOLVED'].includes(eventInstance.get('status'))) {
      throw createError({ statusCode: 400, message: 'فقط رویدادهای فعال یا تسویه شده قابل تغییر وضعیت Featured هستند' });
    }

    eventInstance.set('isFeatured', isFeatured);
    await eventInstance.save();

    return { 
      success: true, 
      message: `رویداد ${isFeatured ? 'ویژه' : 'غیر ویژه'} شد`,
      isFeatured: eventInstance.get('isFeatured')
    };

  } catch (error: any) {
    console.error('🔴 Error toggling featured:', error);
    throw createError({ 
      statusCode: 500, 
      message: error.message || 'خطا در تغییر وضعیت Featured' 
    });
  }
}); 