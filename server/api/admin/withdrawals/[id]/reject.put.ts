import { defineEventHandler, createError } from '#imports';
import { Transaction } from '../../../../models/Transaction';
import { WalletHistory } from '../../../../models/WalletHistory';
import adminMiddleware from '../../../../middleware/02.admin';

export default defineEventHandler(async (event) => {
  console.log('🎯 [/api/admin/withdrawals/[id]/reject] Processing withdrawal rejection...');

  // اجرای Middleware ادمین
  await adminMiddleware(event);

  try {
    const adminId = event.context.user.id;
    console.log('👨‍💼 Admin authenticated:', adminId);

    // خواندن شناسه تراکنش از پارامترهای مسیر
    const transactionId = event.context.params?.id;
    if (!transactionId) {
      throw createError({
        statusCode: 400,
        message: 'شناسه تراکنش الزامی است'
      });
    }

    console.log('📋 Transaction ID to reject:', transactionId);

    // شروع تراکنش دیتابیس
    const transaction = await event.context.sequelize.transaction();

    try {
      // پیدا کردن تراکنش با وضعیت PENDING
      const withdrawalTransaction = await Transaction.findOne({
        where: {
          id: transactionId,
          type: 'WITHDRAWAL',
          status: 'PENDING'
        },
        transaction,
        lock: true
      });

      if (!withdrawalTransaction) {
        throw createError({
          statusCode: 404,
          message: 'تراکنش برداشت در انتظار یافت نشد'
        });
      }

      console.log('✅ Found pending withdrawal transaction:', {
        id: withdrawalTransaction.get('id'),
        userId: withdrawalTransaction.get('userId'),
        amount: withdrawalTransaction.get('amount')
      });

      // تغییر وضعیت تراکنش به REJECTED
      withdrawalTransaction.set('status', 'REJECTED');
      await withdrawalTransaction.save({ transaction });

      console.log('🔄 Transaction status updated to REJECTED');

      // پیدا کردن رکورد WalletHistory مرتبط
      const walletHistoryRecord = await WalletHistory.findOne({
        where: {
          referenceId: transactionId,
          type: 'WITHDRAWAL'
        },
        transaction,
        lock: true
      });

      if (!walletHistoryRecord) {
        throw createError({
          statusCode: 404,
          message: 'رکورد تاریخچه کیف پول مرتبط یافت نشد'
        });
      }

      console.log('✅ Found related wallet history record');

      // تغییر وضعیت WalletHistory به REJECTED
      walletHistoryRecord.set('status', 'REJECTED');
      await walletHistoryRecord.save({ transaction });

      console.log('🔄 Wallet history status updated to REJECTED');

      // commit تراکنش
      await transaction.commit();

      console.log('🟢 [/api/admin/withdrawals/[id]/reject] Withdrawal rejected successfully');

      return {
        success: true,
        message: 'برداشت با موفقیت رد شد',
        data: {
          transactionId: transactionId,
          status: 'REJECTED',
          rejectedBy: adminId,
          rejectedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Transaction rolled back due to error:', error);
      throw error;
    }

  } catch (error: any) {
    console.error('🔴 [/api/admin/withdrawals/[id]/reject] Error processing rejection:', error);
    
    // اگر خطا از قبل createError باشد، آن را مستقیماً throw کن
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: 'خطا در رد برداشت. لطفاً دوباره تلاش کنید.',
    });
  }
}); 