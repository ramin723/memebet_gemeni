import { defineEventHandler, createError, readBody } from '#imports'
import { Event, Bet, PendingCommission, User, Option } from '../../../models'
import { sequelize } from '../../../plugins/sequelize'
import { Op } from 'sequelize'
import type { H3Event } from 'h3'
import type { EventModel } from '../../../models/types/EventInterface'
import type { UserModel } from '../../../models/types/UserInterface'
import type { OptionModel } from '../../../models/types/OptionInterface'
import type { BetModel } from '../../../models/types/BetInterface'
import type { PendingCommissionModel } from '../../../models/types/PendingCommissionInterface'
import { EVENT_STATUS, BET_STATUS, COMMISSION_RATES } from '../../../constants/constants'

interface CloseEventBody {
  winner_option_id?: number
  admin_id: number
  admin_note?: string
}

interface CustomError extends Error {
  statusCode?: number
  message: string
}

export default defineEventHandler(async (event: H3Event) => {
  const eventId = event.context.params?.id
  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'شناسه رویداد الزامی است.',
    })
  }

  const body = await readBody<CloseEventBody>(event)
  const { winner_option_id, admin_id, admin_note } = body

  try {
    // بررسی دسترسی ادمین
    const admin = await User.findByPk(admin_id) as UserModel | null
    if (!admin || admin.role !== 'admin') {
      throw createError({
        statusCode: 403,
        message: 'شما اجازه‌ی بستن این رویداد را ندارید.',
      })
    }

    // شروع تراکنش
    const transaction = await sequelize.transaction()

    try {
      // دریافت رویداد با گزینه‌ها
      const eventData = await Event.findByPk(eventId, {
        include: [
          {
            model: Option,
            as: 'Options',
            include: [
              {
                model: Bet,
                where: { status: BET_STATUS.ACTIVE },
                required: false
              }
            ]
          }
        ],
        transaction
      }) as (EventModel & {
        Options: (OptionModel & {
          Bets: BetModel[]
        })[]
      }) | null

      if (!eventData) {
        throw createError({ 
          statusCode: 404, 
          message: 'رویداد یافت نشد.' 
        })
      }

      if (eventData.status === EVENT_STATUS.COMPLETED || eventData.status === EVENT_STATUS.CANCELLED) {
        throw createError({ 
          statusCode: 400, 
          message: 'این رویداد قبلاً بسته یا لغو شده است.' 
        })
      }

      // محاسبه مجموع شرط‌ها
      const totalPool = eventData.Options.reduce((sum, option) => 
        sum + option.Bets.reduce((betSum, bet) => betSum + bet.bet_amount, 0), 0
      )

      if (totalPool <= 0) {
        throw createError({ 
          statusCode: 400, 
          message: 'رویداد هیچ شرط‌بندی فعالی ندارد.' 
        })
      }

      // بررسی گزینه برنده
      let winningOption = null
      if (winner_option_id) {
        winningOption = eventData.Options.find(opt => opt.id === winner_option_id)
        if (!winningOption) {
          throw createError({ 
            statusCode: 400, 
            message: 'گزینه برنده نامعتبر است.' 
          })
        }
      }

      // محاسبه کمیسیون‌ها
      const commissionTotal = totalPool * (COMMISSION_RATES.CREATOR + COMMISSION_RATES.REFERRAL + COMMISSION_RATES.PLATFORM)
      const creatorCommission = totalPool * COMMISSION_RATES.CREATOR
      const referralCommission = totalPool * COMMISSION_RATES.REFERRAL
      const siteCommission = totalPool * COMMISSION_RATES.PLATFORM

      // پرداخت کمیسیون به سازنده
      if (eventData.creator_id) {
        await User.increment('balance', { 
          by: creatorCommission,
          where: { id: eventData.creator_id },
          transaction
        })
      }

      // پرداخت کمیسیون‌های دعوت
      const pendingCommissions = await PendingCommission.findAll({ 
        where: { 
          event_id: eventId, 
          status: 'pending' 
        },
        transaction
      }) as PendingCommissionModel[]

      await Promise.all(pendingCommissions.map(async (commission) => {
        await User.increment('balance', {
          by: commission.amount,
          where: { id: commission.user_id },
          transaction
        })

        await commission.update({ status: 'paid' }, { transaction })
      }))

      // پردازش نتیجه و پرداخت جوایز
      if (winningOption) {
        // به‌روزرسانی گزینه برنده
        await Option.update(
          { is_winner: false },
          { 
            where: { event_id: eventId },
            transaction
          }
        )

        await Option.update(
          { is_winner: true },
          { 
            where: { id: winner_option_id },
            transaction
          }
        )

        // محاسبه و پرداخت جوایز
        const winningBets = winningOption.Bets
        const totalWinningBets = winningBets.reduce((sum, bet) => sum + bet.bet_amount, 0)
        const prizePool = totalPool - commissionTotal

        if (winningBets.length > 0) {
          await Promise.all(winningBets.map(async (bet) => {
            const winAmount = (bet.bet_amount / totalWinningBets) * prizePool
            await User.increment('balance', {
              by: winAmount,
              where: { id: bet.user_id },
              transaction
            })

            await bet.update({ 
              status: BET_STATUS.WIN,
              potential_win_amount: winAmount
            }, { transaction })
          }))
        }

        // به‌روزرسانی وضعیت شرط‌های بازنده
        await Bet.update(
          { status: BET_STATUS.LOSS },
          {
            where: { 
              event_id: eventId,
              status: BET_STATUS.ACTIVE,
              id: { [Op.notIn]: winningBets.map(b => b.id) }
            },
            transaction
          }
        )

      } else {
        // بازگشت پول در صورت عدم تعیین برنده
        const refundRatio = 1 - (siteCommission / totalPool) // فقط کمیسیون سایت کم می‌شود

        await Promise.all(eventData.Options.map(async (option) => {
          await Promise.all(option.Bets.map(async (bet) => {
            const refundAmount = bet.bet_amount * refundRatio
            await User.increment('balance', {
              by: refundAmount,
              where: { id: bet.user_id },
              transaction
            })

            await bet.update({ 
              status: BET_STATUS.CANCELLED,
              potential_win_amount: refundAmount
            }, { transaction })
          }))
        }))
      }

      // به‌روزرسانی رویداد
      await eventData.update({
        status: EVENT_STATUS.COMPLETED,
        end_time: new Date(),
        admin_note: admin_note || 'رویداد توسط ادمین بسته شد.'
      }, { transaction })

      // تایید تراکنش
      await transaction.commit()

      // دریافت رویداد به‌روز شده
      const updatedEvent = await Event.findByPk(eventId, {
        include: [
          {
            model: Option,
            as: 'Options',
            include: [
              {
                model: Bet,
                attributes: ['id', 'user_id', 'bet_amount', 'status', 'potential_win_amount']
              }
            ]
          }
        ]
      }) as (EventModel & {
        Options: (OptionModel & {
          Bets: BetModel[]
        })[]
      }) | null

      if (!updatedEvent) {
        throw createError({
          statusCode: 404,
          message: 'رویداد یافت نشد.',
        })
      }

      return { 
        success: true, 
        message: 'رویداد با موفقیت بسته شد و جوایز توزیع شدند.',
        event: updatedEvent,
        summary: {
          total_pool: totalPool,
          commission: {
            total: commissionTotal,
            creator: creatorCommission,
            referral: referralCommission,
            site: siteCommission
          }
        }
      }

    } catch (error) {
      await transaction.rollback()
      throw error
    }

  } catch (error) {
    console.error('Error closing event:', error)
    const customError = error as CustomError
    throw createError({
      statusCode: customError.statusCode || 500,
      message: customError.message || 'خطا در بستن رویداد.',
    })
  }
}) 