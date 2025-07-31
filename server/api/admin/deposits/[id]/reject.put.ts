import { defineEventHandler, createError } from '#imports';
import { Transaction } from '../../../../models/Transaction';
import { WalletHistory } from '../../../../models/WalletHistory';

export default defineEventHandler(async (event) => {
  console.log('🎯 [/api/admin/deposits/reject] Processing deposit rejection...');

  try {
    // شناسه تراکنش از پارامترهای مسیر
    const transactionId = event.context.params?.id;
    if (!transactionId) {
      throw createError({
        statusCode: 400,
        message: 'شناسه تراکنش الزامی است'
      });
    }

    console.log('📋 Transaction ID:', transactionId);

    // شروع تراکنش دیتابیس
    const transaction = await event.context.sequelize.transaction();

    try {
      // پیدا کردن تراکنش با وضعیت PENDING
      const depositTransaction = await Transaction.findOne({
        where: {
          id: transactionId,
          type: 'DEPOSIT',
          status: 'PENDING'
        },
        transaction,
        lock: true
      });

      if (!depositTransaction) {
        throw createError({
          statusCode: 404,
          message: 'تراکنش واریز با وضعیت در انتظار یافت نشد'
        });
      }

      console.log('✅ Deposit transaction found:', {
        id: depositTransaction.get('id'),
        amount: depositTransaction.get('amount'),
        userId: depositTransaction.get('userId')
      });

      // تغییر وضعیت تراکنش به REJECTED
      depositTransaction.set('status', 'REJECTED');
      await depositTransaction.save({ transaction });

      console.log('✅ Transaction status updated to REJECTED');

      // پیدا کردن و به‌روزرسانی رکورد WalletHistory
      const walletHistoryRecord = await WalletHistory.findOne({
        where: {
          referenceId: transactionId,
          type: 'DEPOSIT'
        },
        transaction,
        lock: true
      });

      if (!walletHistoryRecord) {
        throw createError({
          statusCode: 404,
          message: 'رکورد تاریخچه کیف پول یافت نشد'
        });
      }

      // به‌روزرسانی وضعیت به CANCELLED
      walletHistoryRecord.set('status', 'CANCELLED');
      walletHistoryRecord.set('description', `واریز مبلغ ${depositTransaction.get('amount')} واحد رد شد`);
      await walletHistoryRecord.save({ transaction });

      console.log('✅ Wallet history updated to CANCELLED');

      await transaction.commit();

      console.log('🟢 [/api/admin/deposits/reject] Deposit rejected successfully');

      return {
        success: true,
        message: 'واریز با موفقیت رد شد',
        data: {
          transactionId: transactionId,
          amount: depositTransaction.get('amount'),
          status: 'REJECTED'
        }
      };

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Transaction rolled back due to error:', error);
      throw error;
    }

  } catch (error: any) {
    console.error('🔴 [/api/admin/deposits/reject] Error processing rejection:', error);
    
    // اگر خطا از قبل createError باشد، آن را مستقیماً throw کن
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: 'خطا در رد واریز. لطفاً دوباره تلاش کنید.',
    });
  }
}); 