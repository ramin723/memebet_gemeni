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
  console.log('User ID:', event.context.user?.id);
  console.log('User ID Type:', typeof event.context.user?.id);
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
      // بررسی ID کاربر
      console.log('🔍 User ID before creating event:', event.context.user.id);
      console.log('🔍 User ID type:', typeof event.context.user.id);
      
      if (!event.context.user.id) {
        throw createError({
          statusCode: 500,
          message: 'شناسه کاربر نامعتبر است'
        })
      }

      // ایجاد رویداد
      const eventData = {
        title: body.title,
        description: body.description,
        creatorId: event.context.user.id,
        bettingDeadline: body.bettingDeadline,
        status: 'PENDING_APPROVAL',
        isFeatured: false,
        adminNote: null
      }

      console.log('📝 Event data to create:', eventData);

      const newEvent = await Event.create(eventData as any, { transaction })

      console.log('✅ Event created with ID:', newEvent.id);

      // تبدیل به آبجکت ساده بلافاصله بعد از ایجاد
      const plainNewEvent = newEvent.get({ plain: true });
      console.log('✅ Plain new event:', plainNewEvent);

      // ایجاد outcome ها
      await Promise.all(
        body.outcomes.map(async (outcome) => {
          const outcomeData = {
            eventId: plainNewEvent.id, // استفاده از نسخه ساده
            title: outcome.title,
            totalAmount: BigInt(0),
            totalBets: 0,
            isWinner: false
          }
          await Outcome.create(outcomeData as any, { transaction })
        })
      )

      console.log('✅ Outcomes created');

      // ثبت تراکنش
      await transaction.commit()

      console.log('✅ Transaction committed');

      // دریافت رویداد با تمام اطلاعات
      const createdEvent = await Event.findByPk(plainNewEvent.id, {
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

      // تبدیل به آبجکت ساده
      const plainEvent = createdEvent?.get({ plain: true });

      console.log('✅ Final event data:', plainEvent);

      return {
        success: true,
        message: 'رویداد با موفقیت ایجاد شد',
        data: plainEvent
      }
    } catch (error: any) {
      // برگرداندن تراکنش در صورت خطا
      await transaction.rollback()
      console.error('❌ Error in transaction:', error);
      throw error
    }
  } catch (error: any) {
    console.error('❌ Error in event creation:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'خطا در ایجاد رویداد'
    })
  }
}) 