import { defineEventHandler, createError, getRouterParam } from '#imports';
import { EventTemplate } from '../../../models/EventTemplate';

export default defineEventHandler(async (event) => {
  const templateId = getRouterParam(event, 'id');
  console.log(`🎯 [/api/templates/${templateId}] Fetching event template...`);

  if (!templateId) {
    throw createError({
      statusCode: 400,
      message: 'شناسه قالب الزامی است.'
    });
  }

  try {
    const template = await EventTemplate.findByPk(templateId);

    if (!template) {
      throw createError({
        statusCode: 404,
        message: 'قالب مورد نظر یافت نشد.'
      });
    }

    // تبدیل به آبجکت ساده
    const plainTemplate = template.get({ plain: true });

    console.log(`✅ Template ${templateId} found successfully.`);

    return {
      success: true,
      message: 'قالب با موفقیت دریافت شد',
      data: {
        template: plainTemplate
      }
    };

  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    
    console.error(`🔴 Error fetching template ${templateId}:`, error);
    throw createError({
      statusCode: 500,
      message: 'خطا در دریافت قالب.'
    });
  }
});
