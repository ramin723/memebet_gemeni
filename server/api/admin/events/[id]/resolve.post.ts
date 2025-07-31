import { defineEventHandler, createError, readBody } from '#imports';
import { Event } from '../../../../../models/Event';
import { Bet } from '../../../../../models/Bet';
import { Outcome } from '../../../../../models/Outcome';
import { User } from '../../../../../models/User';
import { WalletHistory } from '../../../../../models/WalletHistory';
import { PendingCommission } from '../../../../../models/PendingCommission';

interface ResolveEventBody {
  winningOutcomeId: string;
}

export default defineEventHandler(async (event) => {
  console.log('🎯 [/api/admin/events/resolve] Processing event resolution...');

  try {
    // شناسه رویداد از پارامترهای مسیر
    const eventId = event.context.params?.id;
    if (!eventId) {
      throw createError({
        statusCode: 400,
        message: 'شناسه رویداد الزامی است'
      });
    }

    // خواندن winningOutcomeId از body
    const body = await readBody<ResolveEventBody>(event);
    const { winningOutcomeId } = body;

    if (!winningOutcomeId) {
      throw createError({
        statusCode: 400,
        message: 'شناسه نتیجه برنده الزامی است'
      });
    }

    console.log('📋 Event ID:', eventId, 'Winning Outcome ID:', winningOutcomeId);

    // شروع تراکنش دیتابیس
    const transaction = await event.context.sequelize.transaction();

    try {
      // پیدا کردن رویداد و قفل کردن ردیف
      const eventToResolve = await Event.findByPk(eventId, { 
        transaction, 
        lock: true,
        include: [
          {
            model: Bet,
            as: 'bets',
            include: [
              {
                model: User,
                as: 'user'
              },
              {
                model: Outcome,
                as: 'outcome'
              }
            ]
          },
          {
            model: Outcome,
            as: 'outcomes'
          }
        ]
      });

      if (!eventToResolve) {
        throw createError({
          statusCode: 404,
          message: 'رویداد یافت نشد'
        });
      }

      // بررسی وضعیت رویداد
      const eventStatus = eventToResolve.get('status') as string;
      if (eventStatus !== 'ACTIVE') {
        throw createError({
          statusCode: 400,
          message: 'فقط رویدادهای فعال قابل تسویه هستند'
        });
      }

      // بررسی وجود نتیجه برنده
      const winningOutcome = eventToResolve.get('outcomes')?.find(
        (outcome: any) => outcome.get('id') === winningOutcomeId
      );

      if (!winningOutcome) {
        throw createError({
          statusCode: 400,
          message: 'نتیجه برنده در این رویداد یافت نشد'
        });
      }

      console.log('✅ Event and winning outcome found');

      // تبدیل به آبجکت ساده
      const plainEvent = eventToResolve.get({ plain: true });
      const bets = plainEvent.bets || [];
      const outcomes = plainEvent.outcomes || [];

      // --- شروع استاندارد طلایی ---

      // ۱. محاسبه کل استخر نقدینگی
      const totalPool = bets.reduce((sum: bigint, bet: any) => {
        return sum + BigInt(bet.amount);
      }, BigInt(0));

      console.log('💰 Total pool calculated:', totalPool.toString());

      // ۲. محاسبه کل مبلغ شرط‌های برنده
      const winningBets = bets.filter((bet: any) => bet.outcomeId === winningOutcomeId);
      const totalWinningAmount = winningBets.reduce((sum: bigint, bet: any) => {
        return sum + BigInt(bet.amount);
      }, BigInt(0));

      console.log('🏆 Total winning amount:', totalWinningAmount.toString());

      // ۳. محاسبه کمیسیون‌های در انتظار
      const pendingCommissions = await PendingCommission.findAll({
        where: {
          eventId: eventId,
          status: 'PENDING'
        },
        include: [
          {
            model: User,
            as: 'user'
          }
        ],
        transaction,
        lock: true
      });

      const totalCommission = pendingCommissions.reduce((sum: bigint, commission: any) => {
        return sum + BigInt(commission.get('amount') as string);
      }, BigInt(0));

      console.log('💸 Total commission:', totalCommission.toString());

      // ۴. محاسبه استخر جایزه
      const prizePool = totalPool - totalCommission;

      if (prizePool <= 0) {
        throw createError({
          statusCode: 400,
          message: 'استخر جایزه کافی نیست'
        });
      }

      console.log('🎁 Prize pool calculated:', prizePool.toString());

      // ۵. پرداخت جوایز به شرط‌های برنده
      for (const bet of winningBets) {
        const betAmount = BigInt(bet.amount);
        const prizeAmount = (betAmount * prizePool) / totalWinningAmount;

        // پیدا کردن کاربر برنده
        const winningUser = await User.findByPk(bet.userId, { transaction, lock: true });
        if (!winningUser) {
          throw createError({
            statusCode: 404,
            message: `کاربر برنده با شناسه ${bet.userId} یافت نشد`
          });
        }

        // خواندن موجودی فعلی کاربر
        const userBalanceStr = winningUser.getDataValue('balance');
        if (!userBalanceStr) {
          throw createError({ statusCode: 500, message: 'موجودی کاربر یافت نشد' });
        }

        const userBalance = BigInt(userBalanceStr);
        const newBalance = userBalance + prizeAmount;

        // به‌روزرسانی موجودی کاربر
        winningUser.set('balance', newBalance.toString());
        await winningUser.save({ transaction });

        // ثبت رکورد WalletHistory
        await WalletHistory.create({
          userId: bet.userId.toString(),
          amount: prizeAmount.toString(),
          type: 'WIN',
          balanceBefore: userBalance.toString(),
          balanceAfter: newBalance.toString(),
          description: `جایزه برنده شدن در رویداد "${plainEvent.title}"`,
          betId: bet.id.toString(),
          eventId: eventId.toString(),
        } as any, { transaction });

        // تغییر وضعیت شرط به WON
        const betToUpdate = await Bet.findByPk(bet.id, { transaction, lock: true });
        if (betToUpdate) {
          betToUpdate.set('status', 'WON');
          await betToUpdate.save({ transaction });
        }

        console.log('✅ Prize paid to user:', {
          userId: bet.userId,
          prizeAmount: prizeAmount.toString(),
          newBalance: newBalance.toString()
        });
      }

      // ۶. پرداخت کمیسیون‌ها
      for (const commission of pendingCommissions) {
        const commissionAmount = BigInt(commission.get('amount') as string);
        const userId = commission.get('userId') as string;

        // پیدا کردن کاربر
        const commissionUser = await User.findByPk(userId, { transaction, lock: true });
        if (!commissionUser) {
          throw createError({
            statusCode: 404,
            message: `کاربر کمیسیون با شناسه ${userId} یافت نشد`
          });
        }

        // خواندن موجودی فعلی کاربر
        const userBalanceStr = commissionUser.getDataValue('balance');
        if (!userBalanceStr) {
          throw createError({ statusCode: 500, message: 'موجودی کاربر یافت نشد' });
        }

        const userBalance = BigInt(userBalanceStr);
        const newBalance = userBalance + commissionAmount;

        // به‌روزرسانی موجودی کاربر
        commissionUser.set('balance', newBalance.toString());
        await commissionUser.save({ transaction });

        // ثبت رکورد WalletHistory
        await WalletHistory.create({
          userId: userId.toString(),
          amount: commissionAmount.toString(),
          type: 'COMMISSION',
          balanceBefore: userBalance.toString(),
          balanceAfter: newBalance.toString(),
          description: `کمیسیون رویداد "${plainEvent.title}"`,
          eventId: eventId.toString(),
        } as any, { transaction });

        // تغییر وضعیت کمیسیون به PAID
        commission.set('status', 'PAID');
        await commission.save({ transaction });

        console.log('✅ Commission paid to user:', {
          userId: userId,
          commissionAmount: commissionAmount.toString(),
          newBalance: newBalance.toString()
        });
      }

      // ۷. تغییر وضعیت شرط‌های بازنده به LOST
      const losingBets = bets.filter((bet: any) => bet.outcomeId !== winningOutcomeId);
      for (const bet of losingBets) {
        const betToUpdate = await Bet.findByPk(bet.id, { transaction, lock: true });
        if (betToUpdate) {
          betToUpdate.set('status', 'LOST');
          await betToUpdate.save({ transaction });
        }
      }

      console.log('❌ Losing bets marked as LOST:', losingBets.length);

      // ۸. تغییر وضعیت رویداد به RESOLVED
      eventToResolve.set('status', 'RESOLVED');
      eventToResolve.set('winningOutcomeId', winningOutcomeId);
      await eventToResolve.save({ transaction });

      console.log('✅ Event status updated to RESOLVED');

      // --- پایان استاندارد طلایی ---

      await transaction.commit();

      console.log('🟢 [/api/admin/events/resolve] Event resolved successfully');

      return {
        success: true,
        message: 'رویداد با موفقیت تسویه شد',
        data: {
          eventId: eventId,
          winningOutcomeId: winningOutcomeId,
          totalPool: totalPool.toString(),
          totalWinningAmount: totalWinningAmount.toString(),
          totalCommission: totalCommission.toString(),
          prizePool: prizePool.toString(),
          winningBetsCount: winningBets.length,
          losingBetsCount: losingBets.length,
          commissionsPaid: pendingCommissions.length,
          status: 'RESOLVED'
        }
      };

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Transaction rolled back due to error:', error);
      throw error;
    }

  } catch (error: any) {
    console.error('🔴 [/api/admin/events/resolve] Error processing resolution:', error);
    
    // اگر خطا از قبل createError باشد، آن را مستقیماً throw کن
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: 'خطا در تسویه رویداد. لطفاً دوباره تلاش کنید.',
    });
  }
}); 