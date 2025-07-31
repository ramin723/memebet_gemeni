import { defineEventHandler, createError } from '#imports';
import { Bet } from '../../../models/Bet';
import { User } from '../../../models/User';
import { WalletHistory } from '../../../models/WalletHistory';

export default defineEventHandler(async (event) => {
  console.log('🎯 [/api/bets/[id]/cancel] Cancelling bet...');

  // احراز هویت
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      message: 'احراز هویت مورد نیاز است'
    });
  }

  const currentUserId = event.context.user.id;
  const betId = event.context.params?.id;

  if (!betId) {
    throw createError({
      statusCode: 400,
      message: 'شناسه شرط‌بندی نامعتبر است.',
    });
  }

  try {
    // شروع تراکنش دیتابیس
    const transaction = await event.context.sequelize.transaction();

    try {
      // پیدا کردن شرط با اطلاعات کامل
      const bet = await Bet.findByPk(betId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'wallet_address', 'username', 'balance']
          }
        ],
        transaction
      });

      if (!bet) {
        throw createError({
          statusCode: 404,
          message: 'شرط‌بندی یافت نشد.',
        });
      }

      // بررسی مالکیت شرط
      const betUserId = bet.get('userId') as string;
      if (betUserId !== currentUserId.toString()) {
        throw createError({
          statusCode: 403,
          message: 'شما مجاز به لغو این شرط نیستید.',
        });
      }

      console.log('✅ Bet found and ownership verified:', bet.get('id'));

      // بررسی وضعیت شرط
      // در مدل جدید ما هنوز status نداریم، پس فعلاً این بررسی را حذف می‌کنیم
      // if (bet.status !== 'ACTIVE') {
      //   throw createError({
      //     statusCode: 400,
      //     message: 'شرط قابل لغو نیست.',
      //   });
      // }

      const user = bet.get('user') as any;
      if (!user) {
        throw createError({
          statusCode: 404,
          message: 'کاربر یافت نشد.',
        });
      }

      // بازگرداندن مبلغ به کیف پول کاربر
      const refundAmount = BigInt(bet.get('amount') as string);
      const userBalance = BigInt(user.balance);
      const newBalance = userBalance + refundAmount;
      
      await user.update({ balance: newBalance.toString() }, { transaction });

      console.log('💸 User balance refunded:', { 
        old: user.balance, 
        new: newBalance.toString(), 
        refund: refundAmount.toString() 
      });

      // حذف شرط (یا تغییر وضعیت آن)
      await bet.destroy({ transaction });

      console.log('🗑️ Bet deleted:', bet.get('id'));

      // ایجاد رکورد تاریخچه کیف پول برای بازپرداخت
      await WalletHistory.create({
        userId: currentUserId.toString(),
        type: 'REFUND',
        amount: refundAmount.toString(),
        balanceBefore: user.balance,
        balanceAfter: newBalance.toString(),
        description: `بازپرداخت شرط لغو شده`,
        referenceId: null
      } as any, { transaction });

      console.log('📝 Refund wallet history created');

      // ثبت تراکنش
      await transaction.commit();

      console.log('🟢 [/api/bets/[id]/cancel] Bet cancelled successfully');

      return { 
        success: true, 
        message: 'شرط‌بندی با موفقیت لغو شد.',
        refundAmount: refundAmount.toString(),
        newBalance: newBalance.toString()
      };

    } catch (error) {
      // rollback در صورت خطا
      await transaction.rollback();
      console.error('❌ Transaction rolled back due to error:', error);
      throw error;
    }

  } catch (error: any) {
    console.error('🔴 [/api/bets/[id]/cancel] Error cancelling bet:', error);
    
    // اگر خطا از قبل createError باشد، آن را مستقیماً throw کن
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: 'خطا در لغو شرط‌بندی.',
    });
  }
}); 