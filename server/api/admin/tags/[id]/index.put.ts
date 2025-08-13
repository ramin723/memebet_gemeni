import { defineEventHandler, readBody, getRouterParam, createError } from '#imports';
import { Tag } from '../../../../models/Tag';

export default defineEventHandler(async (event) => {
  try {
    const tagId = getRouterParam(event, 'id');
    const body = await readBody(event);
    const { name, description, parentId } = body;

    // بررسی وجود تگ
    const existingTag = await Tag.findByPk(tagId);
    if (!existingTag) {
      throw createError({
        statusCode: 400,
        message: 'تگ مورد نظر یافت نشد'
      });
    }

    // اعتبارسنجی ورودی‌ها
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        throw createError({
          statusCode: 400,
          message: 'نام تگ نمی‌تواند خالی باشد'
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

      // بررسی تکراری نبودن نام (به جز خود تگ)
      const duplicateTag = await Tag.findOne({
        where: { 
          name: name.trim(),
          id: { [event.context.sequelize.Sequelize.Op.ne]: tagId }
        }
      });

      if (duplicateTag) {
        throw createError({
          statusCode: 400,
          message: 'تگ دیگری با این نام وجود دارد'
        });
      }
    }

    // بررسی وجود تگ والد (اگر مشخص شده باشد)
    if (parentId !== undefined) {
      if (parentId === tagId) {
        throw createError({
          statusCode: 400,
          message: 'تگ نمی‌تواند والد خودش باشد'
        });
      }

      if (parentId) {
        const parentTag = await Tag.findByPk(parentId);
        if (!parentTag) {
          throw createError({
            statusCode: 400,
            message: 'تگ والد مورد نظر یافت نشد'
          });
        }

        // بررسی حلقه‌ای نبودن ساختار سلسله‌مراتبی
        let currentParentId = parentId;
        while (currentParentId) {
          const currentParent = await Tag.findByPk(currentParentId);
          if (currentParent && (currentParent as any).parentId === tagId) {
            throw createError({
              statusCode: 400,
              message: 'نمی‌توانید تگ والد را به گونه‌ای تنظیم کنید که حلقه ایجاد شود'
            });
          }
          currentParentId = currentParent ? (currentParent as any).parentId : null;
        }
      }
    }

    // به‌روزرسانی تگ
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (parentId !== undefined) updateData.parentId = parentId;

    await existingTag.update(updateData);

    console.log('✅ [Admin Tags PUT] Tag updated:', {
      tagId: existingTag.id,
      tagName: existingTag.name,
      adminId: event.context.user.id,
      changes: updateData
    });

    return {
      success: true,
      message: 'تگ با موفقیت به‌روزرسانی شد',
      data: {
        id: existingTag.id,
        name: existingTag.name,
        description: existingTag.description,
        parentId: (existingTag as any).parentId,
        createdAt: existingTag.createdAt,
        updatedAt: existingTag.updatedAt
      }
    };

  } catch (error: any) {
    if (error.statusCode) {
      throw error; // خطاهای validation را دوباره پرتاب کن
    }

    console.error('❌ [Admin Tags PUT] Error:', error);
    throw createError({
      statusCode: 500,
      message: 'خطا در به‌روزرسانی تگ'
    });
  }
});
