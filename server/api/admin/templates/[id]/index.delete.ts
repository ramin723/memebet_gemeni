import { defineEventHandler, getRouterParam, createError } from 'h3';
import { EventTemplate } from '../../../../models/EventTemplate';
import { Event } from '../../../../models/Event';

export default defineEventHandler(async (event) => {
  try {
    // دریافت templateId از پارامترها
    const templateId = getRouterParam(event, 'id');
    
    if (!templateId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Template ID is required'
      });
    }

    // پیدا کردن قالب
    const template = await EventTemplate.findByPk(templateId);
    
    if (!template) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Template not found'
      });
    }

    // بررسی اینکه آیا رویدادی از این قالب استفاده می‌کند
    const eventsUsingTemplate = await Event.count({
      where: {
        templateId: templateId
      } as any
    });

    if ((eventsUsingTemplate as number) > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Cannot delete template. ${eventsUsingTemplate} event(s) are using this template.`
      });
    }

    // حذف قالب
    await template.destroy();

    return {
      success: true,
      message: 'Template deleted successfully',
      data: {
        id: (template as any).id,
        name: (template as any).name
      }
    };

  } catch (error: any) {
    console.error('Error deleting template:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while deleting template'
    });
  }
}); 