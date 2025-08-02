import { defineEventHandler, readBody, getRouterParam, createError } from 'h3';
import { EventTemplate } from '../../../../models/EventTemplate';

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

    // دریافت داده‌ها از body
    const body = await readBody(event);
    const { name, description, category, outcomes, isActive } = body;

    // اعتبارسنجی داده‌های ورودی
    if (!name || !description || !category || !outcomes) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name, description, category, and outcomes are required'
      });
    }

    // بررسی اینکه outcomes آرایه باشد و حداقل 2 آیتم داشته باشد
    if (!Array.isArray(outcomes) || outcomes.length < 2) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Outcomes must be an array with at least 2 items'
      });
    }

    // بررسی اینکه هر outcome دارای name باشد
    for (const outcome of outcomes) {
      if (!outcome.name || typeof outcome.name !== 'string') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Each outcome must have a valid name'
        });
      }
    }

    // پیدا کردن قالب
    const template = await EventTemplate.findByPk(templateId);
    
    if (!template) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Template not found'
      });
    }

    // به‌روزرسانی قالب
    const updateData: any = {
      name,
      description,
      category,
      outcomes,
      isActive: isActive !== undefined ? isActive : (template as any).isActive
    };

    await template.update(updateData);

    // بازگرداندن قالب به‌روزرسانی شده
    return {
      success: true,
      message: 'Template updated successfully',
      data: {
        id: (template as any).id,
        name: (template as any).name,
        description: (template as any).description,
        category: (template as any).category,
        outcomes: (template as any).outcomes,
        isActive: (template as any).isActive,
        updatedAt: (template as any).updatedAt
      }
    };

  } catch (error: any) {
    console.error('Error updating template:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while updating template'
    });
  }
}); 