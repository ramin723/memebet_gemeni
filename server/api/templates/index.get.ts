import { defineEventHandler, createError } from '#imports';
import { EventTemplate } from '../../models/EventTemplate';

export default defineEventHandler(async (event) => {
  console.log('🎯 [/api/templates] Fetching event templates...');

  try {
    // دریافت تمام قالب‌ها (شرط isActive حذف شده است)
    const templates = await EventTemplate.findAll({
      order: [['createdAt', 'DESC']]
    });

    // تبدیل به آبجکت ساده. دیگر نیازی به JSON.parse نیست.
    const plainTemplates = templates.map(template => {
      return template.get({ plain: true });
    });

    console.log(`✅ Found ${plainTemplates.length} templates.`);

    return {
      success: true,
      message: 'قالب‌ها با موفقیت دریافت شدند',
      data: {
        templates: plainTemplates,
        count: plainTemplates.length
      }
    };

  } catch (error: any) {
    console.error('🔴 Error fetching templates:', error);
    throw createError({
      statusCode: 500,
      message: 'خطا در دریافت قالب‌ها.'
    });
  }
});