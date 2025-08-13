import { defineEventHandler, createError } from '#imports';
import { EventTemplate } from '../../models/EventTemplate';
import type { CreateEventTemplateInput } from '../../types/EventTemplateInterface';

export default defineEventHandler(async (event) => {
  console.log('🎯 [/api/test/setup-templates] Setting up sample templates...');

  try {
    // ابتدا تمام قالب‌های قدیمی را پاک می‌کنیم تا از تکرار جلوگیری شود
    await EventTemplate.destroy({ where: {} });

    // Sample templates data
    const sampleTemplates: CreateEventTemplateInput[] = [
      {
        name: 'Goal Achievement - دستیابی به هدف',
        description: 'قالب برای پیش‌بینی دستیابی به هدف در زمان مشخص',
        structure: {
          templateType: 'BINARY',
          titleStructure: 'آیا [goal] تا [deadline] محقق می‌شود؟',
          inputs: [
            { name: 'goal', label: 'هدف', type: 'text', placeholder: 'مثال: فروش 1000 واحد' },
            { name: 'deadline', label: 'مهلت', type: 'date', placeholder: 'تاریخ هدف' }
          ]
        },
        outcomesStructure: {
          type: 'FIXED',
          options: [
            { title: 'بله' },
            { title: 'خیر' }
          ]
        },
        creatorType: 'ADMIN',
        isActive: true
      },
      {
        name: 'Competition Winner - برنده رقابت',
        description: 'قالب برای پیش‌بینی برنده در رقابت‌ها',
        structure: {
          templateType: 'COMPETITIVE',
          titleStructure: 'برنده [competition] چه کسی خواهد بود؟',
          inputs: [
            { name: 'competition', label: 'رقابت', type: 'text', placeholder: 'مثال: انتخابات ریاست جمهوری' }
          ]
        },
        outcomesStructure: {
          type: 'DYNAMIC_CHOICE',
          min: 2,
          max: 10,
          placeholder: 'نام نامزد'
        },
        creatorType: 'ADMIN',
        isActive: true
      },
      {
        name: 'Product Comparison - مقایسه محصولات',
        description: 'قالب برای مقایسه مستقیم دو محصول',
        structure: {
          templateType: 'HEAD_TO_HEAD',
          titleStructure: 'کدام محصول در [metric] بهتر است؟',
          inputs: [
            { name: 'product1', label: 'محصول اول', type: 'text', placeholder: 'نام محصول اول' },
            { name: 'product2', label: 'محصول دوم', type: 'text', placeholder: 'نام محصول دوم' },
            { name: 'metric', label: 'معیار مقایسه', type: 'text', placeholder: 'مثال: کیفیت، قیمت، عملکرد' }
          ]
        },
        outcomesStructure: {
          type: 'FIXED',
          options: [
            { title: 'محصول اول' },
            { title: 'محصول دوم' }
          ]
        },
        creatorType: 'ADMIN',
        isActive: true
      },
      {
        name: 'Metric Exceedance - تجاوز از معیار',
        description: 'قالب برای پیش‌بینی تجاوز از معیار عددی',
        structure: {
          templateType: 'BINARY',
          titleStructure: 'آیا [metric] تا [deadline] از [target] بیشتر می‌شود؟',
          inputs: [
            { name: 'metric', label: 'معیار', type: 'text', placeholder: 'مثال: تعداد کاربران' },
            { name: 'target', label: 'هدف', type: 'text', placeholder: 'مثال: 10000' },
            { name: 'deadline', label: 'مهلت', type: 'date', placeholder: 'تاریخ هدف' }
          ]
        },
        outcomesStructure: {
          type: 'FIXED',
          options: [
            { title: 'بله' },
            { title: 'خیر' }
          ]
        },
        creatorType: 'ADMIN',
        isActive: true
      }
    ];

    // Create templates
    const createdTemplates = await EventTemplate.bulkCreate(sampleTemplates);

    console.log(`✅ Created ${createdTemplates.length} sample templates successfully.`);

    return {
      success: true,
      message: `${createdTemplates.length} قالب نمونه با موفقیت ایجاد شدند`,
      data: {
        templates: createdTemplates.map(t => t.get({ plain: true })),
        count: createdTemplates.length
      }
    };

  } catch (error: any) {
    console.error('🔴 Error setting up templates:', error);
    throw createError({
      statusCode: 500,
      message: 'خطا در ایجاد قالب‌های نمونه.'
    });
  }
});
