import { defineEventHandler, getRouterParam, createError } from 'h3'
import { Event } from '../../../../models/Event'
import { Outcome } from '../../../../models/Outcome'

export default defineEventHandler(async (event) => {
  // این API توسط میدل‌ور ادمین محافظت می‌شود
  const adminUser = event.context.user
  if (!adminUser) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // دریافت شناسه رویداد از پارامترهای URL
  const eventId = getRouterParam(event, 'id')
  if (!eventId) {
    throw createError({ statusCode: 400, statusMessage: 'شناسه رویداد الزامی است' })
  }

  try {
    // پیدا کردن رویداد به همراه گزینه‌ها
    const targetEvent = await Event.findByPk(eventId, {
      include: [{ model: Outcome, as: 'outcomes' }]
    })

    if (!targetEvent) {
      throw createError({ statusCode: 404, statusMessage: 'رویداد مورد نظر یافت نشد' })
    }

    // تبدیل به فرمت مناسب برای فرم ویرایش
    const eventData = targetEvent.get({ plain: true })
    
    // تبدیل تاریخ‌ها به فرمت مناسب برای input datetime-local
    if (eventData.bettingDeadline) {
      eventData.bettingDeadline = new Date(eventData.bettingDeadline)
        .toISOString()
        .slice(0, 16) // فرمت YYYY-MM-DDTHH:MM
    }

    return {
      success: true,
      message: 'رویداد با موفقیت دریافت شد',
      data: eventData
    }

  } catch (error: any) {
    console.error('Error fetching event:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'خطا در دریافت اطلاعات رویداد',
      data: { details: error.message }
    })
  }
})
