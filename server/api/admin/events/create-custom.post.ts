import { defineEventHandler, readBody, createError } from 'h3'
import { Event } from '../../../models/Event'
import { Outcome } from '../../../models/Outcome'
import type { EventAttributes } from '../../../types/EventInterface'

export default defineEventHandler(async (event) => {
  // این API توسط میدل‌ور ادمین محافظت می‌شود
  const adminUser = event.context.user
  if (!adminUser) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)

  // اعتبارسنجی ورودی‌های پایه
  const { title, description, bettingDeadline, outcomes, imageUrl, resolutionSourceUrl, isFeatured } = body
  if (!title || !bettingDeadline || !outcomes || !Array.isArray(outcomes) || outcomes.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'ورودی‌های ضروری (عنوان، مهلت شرط‌بندی و حداقل دو گزینه) ارسال نشده‌اند.' })
  }

  const transaction = await event.context.sequelize.transaction();
  try {
    // ایجاد رویداد اصلی
    const newEvent = await Event.create({
      creatorId: adminUser.id,
      title,
      description,
      bettingDeadline: new Date(bettingDeadline),
      imageUrl,
      resolutionSourceUrl,
      isFeatured: isFeatured || false,
      isCustom: true, // تمام رویدادهای ساخته شده توسط ادمین، سفارشی هستند
      status: 'ACTIVE' // رویدادهای ادمین به صورت پیش‌فرض فعال هستند
    }, { transaction });

    // ایجاد گزینه‌ها (Outcomes)
    const outcomePromises = outcomes.map((outcomeTitle: string) => {
      return Outcome.create({
        eventId: String(newEvent.get('id')),
        title: outcomeTitle,
      }, { transaction });
    });

    await Promise.all(outcomePromises);

    await transaction.commit();
    
    // متد .get({ plain: true }) برای ارسال یک آبجکت تمیز به فرانت‌اند
    return newEvent.get({ plain: true });

  } catch (error: any) {
    await transaction.rollback();
    console.error('Error creating custom event:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'خطا در ایجاد رویداد سفارشی',
      data: { details: error.message }
    })
  }
})
