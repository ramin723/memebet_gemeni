import { defineEventHandler, readBody, createError } from '#imports';
import { Tag } from '../../../models/Tag';
import { CreateTagInput } from '../../../types/TagInterface';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { name, description, parentId } = body;

    // اعتبارسنجی ورودی‌ها
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: 'نام تگ الزامی است و نمی‌تواند خالی باشد'
      });
    }

    if (name.trim().length < 2) {
      throw createError({
        statusCode: 400,
        message: 'نام تگ باید حداقل ۲ کاراکتر باشد'
      });
    }

    if (name.trim().length > 50) {
      throw createError({
        statusCode: 400,
        message: 'نام تگ نمی‌تواند بیشتر از ۵۰ کاراکتر باشد'
      });
    }

    // بررسی تکراری نبودن نام
    const existingTag = await Tag.findOne({
      where: { name: name.trim() }
    });

    if (existingTag) {
      throw createError({
        statusCode: 409,
        message: 'تگ با این نام قبلاً وجود دارد'
      });
    }

    // بررسی وجود تگ والد (اگر مشخص شده باشد)
    if (parentId) {
      const parentTag = await Tag.findByPk(parentId);
      if (!parentTag) {
        throw createError({
          statusCode: 400,
          message: 'تگ والد مورد نظر یافت نشد'
        });
      }
    }

    // ایجاد تگ جدید - فقط فیلدهای مورد نیاز را ارسال کن
    const tagData = {
      name: name.trim(),
      description: description?.trim() || null,
      parentId: parentId || null
    };

    const newTag = await Tag.create(tagData as any);

    console.log('✅ [Admin Tags POST] New tag created:', {
      tagId: newTag.id,
      tagName: newTag.name,
      adminId: event.context.user.id
    });

    return {
      success: true,
      message: 'تگ جدید با موفقیت ایجاد شد',
      data: {
        id: newTag.id,
        name: newTag.name,
        description: newTag.description,
        parentId: newTag.parentId,
        createdAt: newTag.createdAt,
        updatedAt: newTag.updatedAt
      }
    };

  } catch (error: any) {
    if (error.statusCode) {
      throw error; // خطاهای validation را دوباره پرتاب کن
    }

    console.error('❌ [Admin Tags POST] Error:', error);
    throw createError({
      statusCode: 500,
      message: 'خطا در ایجاد تگ جدید'
    });
  }
});
