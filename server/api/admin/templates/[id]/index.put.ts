import { defineEventHandler, readBody, getRouterParam, createError } from 'h3';
import { EventTemplate } from '../../../../models/EventTemplate';
import type { TemplateStructure, OutcomesStructure } from '../../../../types/EventTemplateInterface';
import adminMiddleware from '../../../../middleware/02.admin';

// Helper function for validation
const isValidTemplateStructure = (structure: any): structure is TemplateStructure => {
  if (!structure || typeof structure !== 'object') return false;
  const { templateType, titleStructure, inputs } = structure;
  if (!['BINARY', 'COMPETITIVE', 'HEAD_TO_HEAD'].includes(templateType)) return false;
  if (typeof titleStructure !== 'string' || !titleStructure) return false;
  if (!Array.isArray(inputs) || inputs.length === 0) return false;
  return true;
};

// Helper function for outcomesStructure validation
const isValidOutcomesStructure = (outcomesStructure: any): outcomesStructure is OutcomesStructure => {
  if (!outcomesStructure || typeof outcomesStructure !== 'object') return false;
  const { type } = outcomesStructure;
  
  if (!['FIXED', 'DYNAMIC'].includes(type)) return false;
  
  if (type === 'FIXED') {
    const { options } = outcomesStructure;
    if (!Array.isArray(options) || options.length === 0) return false;
    // Validate each option has a title
    for (const option of options) {
      if (!option.title || typeof option.title !== 'string') return false;
    }
  } else if (type === 'DYNAMIC') {
    const { min, max } = outcomesStructure;
    if (typeof min !== 'number' || typeof max !== 'number') return false;
    if (min < 2 || max < min || max > 20) return false; // Reasonable limits
  }
  
  return true;
};

export default defineEventHandler(async (event) => {
  await adminMiddleware(event);

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
    const { name, description, structure, outcomesStructure, creatorType, isActive } = body;

    // اعتبارسنجی داده‌های ورودی
    if (!name || !structure || !creatorType) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name, structure, and creatorType are required'
      });
    }

    // اعتبارسنجی ساختار قالب
    if (!isValidTemplateStructure(structure)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ساختار قالب ارسال شده نامعتبر است.'
      });
    }

    // اعتبارسنجی outcomesStructure (اختیاری)
    if (outcomesStructure && !isValidOutcomesStructure(outcomesStructure)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ساختار گزینه‌ها نامعتبر است'
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

    // به‌روزرسانی قالب
    const updateData: any = {
      name,
      description,
      structure,
      outcomesStructure,
      creatorType,
      isActive: isActive !== undefined ? isActive : template.get('isActive')
    };

    await template.update(updateData);

    // بازگرداندن قالب به‌روزرسانی شده
    const updatedTemplate = template.get({ plain: true });
    
    return {
      success: true,
      message: 'قالب با موفقیت به‌روزرسانی شد',
      data: updatedTemplate
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