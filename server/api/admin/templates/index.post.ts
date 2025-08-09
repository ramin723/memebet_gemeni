import { defineEventHandler, createError, readBody } from '#imports';
import { EventTemplate } from '../../../models/EventTemplate';
import type { TemplateStructure, OutcomesStructure } from '../../../types/EventTemplateInterface';
import adminMiddleware from '../../../middleware/02.admin';

// Helper function for validation
const isValidTemplateStructure = (structure: any): structure is TemplateStructure => {
  if (!structure || typeof structure !== 'object') return false;
  const { templateType, titleStructure, inputs } = structure;
  if (!['BINARY', 'COMPETITIVE', 'HEAD_TO_HEAD'].includes(templateType)) return false;
  if (typeof titleStructure !== 'string' || !titleStructure) return false;
  if (!Array.isArray(inputs) || inputs.length === 0) return false;
  // You can add more detailed validation for inputs array here if needed
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

  console.log('🎯 [/api/admin/templates] Creating new structured event template...');

  try {
    const body = await readBody(event);
    const { name, description, structure, outcomesStructure, creatorType } = body;

    // اعتبارسنجی ورودی‌ها
    if (!name || !structure || !creatorType) {
      throw createError({
        statusCode: 400,
        message: 'فیلدهای الزامی: name, structure, creatorType'
      });
    }

    // اعتبارسنجی ساختار قالب
    if (!isValidTemplateStructure(structure)) {
       throw createError({
        statusCode: 400,
        message: 'ساختار قالب ارسال شده نامعتبر است.'
      });
    }

    // اعتبارسنجی outcomesStructure (اختیاری)
    if (outcomesStructure && !isValidOutcomesStructure(outcomesStructure)) {
      throw createError({
        statusCode: 400,
        message: 'ساختار گزینه‌ها نامعتبر است'
      });
    }

    // ایجاد قالب جدید
    const newTemplate = await EventTemplate.create({
      name,
      description,
      structure, // Sequelize handles JSONB serialization automatically
      outcomesStructure, // New field for outcomes structure
      creatorType,
      isActive: true
    });

    const plainTemplate = newTemplate.get({ plain: true });

    console.log('✅ Structured template created successfully:', plainTemplate.name);

    return {
      success: true,
      message: 'قالب با موفقیت ایجاد شد',
      data: plainTemplate
    };

  } catch (error: any) {
    console.error('🔴 Error creating template:', error);
    if (error.statusCode) {
      throw error;
    }
    // Handle potential unique constraint error for 'name'
    if (error.name === 'SequelizeUniqueConstraintError') {
         throw createError({
            statusCode: 409, // Conflict
            message: 'قالبی با این نام از قبل وجود دارد.'
        });
    }
    throw createError({
      statusCode: 500,
      message: 'خطا در ایجاد قالب.'
    });
  }
});