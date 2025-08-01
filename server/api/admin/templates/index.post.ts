import { defineEventHandler, createError, readBody } from '#imports';
import { EventTemplate } from '../../../models/EventTemplate';
import type { TemplateStructure } from '../../../types/EventTemplateInterface';
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

export default defineEventHandler(async (event) => {
  await adminMiddleware(event);

  console.log('🎯 [/api/admin/templates] Creating new structured event template...');

  try {
    const body = await readBody(event);
    const { name, description, structure, creatorType } = body;

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

    // ایجاد قالب جدید
    const newTemplate = await EventTemplate.create({
      name,
      description,
      structure, // Sequelize handles JSONB serialization automatically
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