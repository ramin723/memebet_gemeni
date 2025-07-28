import { defineEventHandler, createError, readBody } from 'h3'
import { Event } from '../../models/Event'
import { User } from '../../models/User'
import { Outcome } from '../../models/Outcome'
import type { H3Event } from 'h3'

interface CreateEventBody {
  title: string
  description: string
  bettingDeadline: Date
  outcomes: Array<{
    title: string
  }>
}

export default defineEventHandler(async (event: H3Event) => {
  // --- START DEBUG CODE ---
  console.log('--- [DEBUG] Inside /api/events POST ---');
  console.log('Headers:', JSON.stringify(event.node.req.headers, null, 2));
  console.log('Context User:', event.context.user);
  console.log('------------------------------------');
  // ---  END DEBUG CODE  ---

  try {
    // بررسی احراز هویت
    if (!event.context.user) {
      throw createError({
        statusCode: 401,
        message: 'احراز هویت مورد نیاز است'
      })
    }

    const body = await readBody<CreateEventBody>(event)

    // شروع تراکنش
    const transaction = await event.context.sequelize.transaction()

    try {
      // ایجاد رویداد
      const eventData = {
        title: body.title,
        description: body.description,
        creatorId: event.context.user.dataValues.id,
        bettingDeadline: body.bettingDeadline,
        status: 'PENDING_APPROVAL',
        isFeatured: false,
        adminNote: null
      }

      const newEvent = await Event.create(eventData as any, { transaction })

      // ایجاد outcome ها
      await Promise.all(
        body.outcomes.map(async (outcome) => {
          const outcomeData = {
            eventId: newEvent.dataValues.id,
            title: outcome.title,
            totalAmount: BigInt(0),
            totalBets: 0,
            isWinner: false
          }
          await Outcome.create(outcomeData as any, { transaction })
        })
      )

      // ثبت تراکنش
      await transaction.commit()

      // دریافت رویداد با تمام اطلاعات
      const createdEvent = await Event.findByPk(newEvent.id, {
        include: [
          {
            model: Outcome,
            as: 'outcomes'
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'wallet_address', 'username']
          }
        ]
      })

      return {
        success: true,
        message: 'رویداد با موفقیت ایجاد شد',
        data: createdEvent
      }
    } catch (error: any) {
      // برگرداندن تراکنش در صورت خطا
      await transaction.rollback()
      throw error
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'خطا در ایجاد رویداد'
    })
  }
}) 