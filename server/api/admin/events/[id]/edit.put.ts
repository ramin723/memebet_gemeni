import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { Event } from '../../../../models/Event'
import { Outcome } from '../../../../models/Outcome'
import type { EventAttributes } from '../../../../types/EventInterface'

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

  // دریافت داده‌های ویرایش از body
  const body = await readBody(event)
  const {
    title,
    description,
    bettingDeadline,
    outcomes,
    imageUrl,
    resolutionSourceUrl,
    isFeatured
  } = body

  // پیدا کردن رویداد
  const targetEvent = await Event.findByPk(eventId)
  if (!targetEvent) {
    throw createError({ statusCode: 404, statusMessage: 'رویداد مورد نظر یافت نشد' })
  }

  const transaction = await event.context.sequelize.transaction()
  try {
    const currentStatus = targetEvent.get('status') as string
    const currentBettingDeadline = targetEvent.get('bettingDeadline') as Date
    const currentTitle = targetEvent.get('title') as string
    const currentDescription = targetEvent.get('description') as string
    const currentIsFeatured = targetEvent.get('isFeatured') as boolean
    const currentId = targetEvent.get('id') as string

    // اعمال قوانین ویرایش بر اساس وضعیت رویداد
    if (currentStatus === 'PENDING_APPROVAL') {
      // ویرایش کامل مجاز است
      const updateData: Partial<EventAttributes> = {
        title: title || currentTitle,
        description: description || currentDescription,
        bettingDeadline: bettingDeadline ? new Date(bettingDeadline as string) : currentBettingDeadline,
        imageUrl: imageUrl || undefined,
        resolutionSourceUrl: resolutionSourceUrl || undefined,
        isFeatured: typeof isFeatured === 'boolean' ? isFeatured : currentIsFeatured,
        isCustom: true // تبدیل به رویداد سفارشی
      }

      await targetEvent.update(updateData, { transaction })

      // به‌روزرسانی گزینه‌ها اگر ارائه شده باشند
      if (outcomes && Array.isArray(outcomes) && outcomes.length >= 2) {
        // حذف گزینه‌های قبلی
        await Outcome.destroy({
          where: { eventId: currentId },
          transaction
        })

        // ایجاد گزینه‌های جدید
        const outcomePromises = outcomes.map((outcomeTitle: string) => {
          return Outcome.create({
            eventId: currentId,
            title: outcomeTitle,
          }, { transaction })
        })

        await Promise.all(outcomePromises)
      }

    } else if (currentStatus === 'ACTIVE') {
      // فقط فیلدهای غیرحیاتی قابل ویرایش هستند
      const updateData: Partial<EventAttributes> = {
        imageUrl: imageUrl || undefined,
        isFeatured: typeof isFeatured === 'boolean' ? isFeatured : currentIsFeatured,
        isCustom: true // تبدیل به رویداد سفارشی
      }

      await targetEvent.update(updateData, { transaction })

    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'این رویداد در وضعیت فعلی قابل ویرایش نیست'
      })
    }

    await transaction.commit()

    // بازگرداندن رویداد به‌روزرسانی شده به همراه گزینه‌ها
    const updatedEvent = await Event.findByPk(eventId, {
      include: [{ model: Outcome, as: 'outcomes' }]
    })

    return {
      success: true,
      message: 'رویداد با موفقیت به‌روزرسانی شد',
      data: updatedEvent?.get({ plain: true })
    }

  } catch (error: any) {
    await transaction.rollback()
    console.error('Error updating event:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'خطا در به‌روزرسانی رویداد',
      data: { details: error.message }
    })
  }
})
