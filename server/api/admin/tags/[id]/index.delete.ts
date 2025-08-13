import { defineEventHandler, getRouterParam, createError } from '#imports';
import { Tag } from '../../../../models/Tag';
import { EventTag } from '../../../../models/EventTag';

export default defineEventHandler(async (event) => {
  try {
    const tagId = getRouterParam(event, 'id');

    // بررسی وجود تگ
    const existingTag = await Tag.findByPk(tagId);
    if (!existingTag) {
      throw createError({
        statusCode: 404,
        message: 'تگ مورد نظر یافت نشد'
      });
    }

    // بررسی وجود تگ‌های فرزند
    const childTags = await Tag.findAll({
      where: { parentId: tagId }
    });

    if (childTags.length > 0) {
      throw createError({
        statusCode: 400,
        message: `این تگ دارای ${childTags.length} تگ فرزند است. ابتدا تگ‌های فرزند را حذف کنید.`
      });
    }

    // بررسی استفاده از تگ در رویدادها
    const eventTagUsage = await EventTag.findAll({
      where: { tagId: tagId }
    });

    if (eventTagUsage.length > 0) {
      throw createError({
        statusCode: 400,
        message: `این تگ در ${eventTagUsage.length} رویداد استفاده شده است. ابتدا تگ را از رویدادها حذف کنید.`
      });
    }

    // حذف تگ
    await existingTag.destroy();

    console.log('✅ [Admin Tags DELETE] Tag deleted:', {
      tagId: existingTag.id,
      tagName: existingTag.name,
      adminId: event.context.user.id
    });

    return {
      success: true,
      message: 'تگ با موفقیت حذف شد',
      data: {
        id: existingTag.id,
        name: existingTag.name
      }
    };

  } catch (error: any) {
    if (error.statusCode) {
      throw error; // خطاهای validation را دوباره پرتاب کن
    }

    console.error('❌ [Admin Tags DELETE] Error:', error);
    throw createError({
      statusCode: 500,
      message: 'خطا در حذف تگ'
    });
  }
});
