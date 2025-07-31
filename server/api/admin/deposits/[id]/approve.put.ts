import { defineEventHandler, createError } from '#imports';
import { User } from '../../../../models/User';
import { Transaction } from '../../../../models/Transaction';
import { WalletHistory } from '../../../../models/WalletHistory';

export default defineEventHandler(async (event) => {
  console.log('🎯 [/api/admin/deposits/approve] Processing deposit approval...');

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

      // پیدا کردن کاربر و قفل کردن ردیف
      const userId = depositTransaction.get('userId') as string;
      const userToUpdate = await User.findByPk(userId, { transaction, lock: true });
      
      if (!userToUpdate) {
        throw createError({
          statusCode: 404,
          message: 'کاربر مربوط به این تراکنش یافت نشد'
        });
      }

      // --- شروع استاندارد طلایی ---

      // ۱. خواندن موجودی فعلی کاربر
      const userBalanceStr = userToUpdate.getDataValue('balance');
      if (!userBalanceStr) {
        throw createError({ statusCode: 500, message: 'موجودی کاربر یافت نشد' });
      }

      const userBalance = BigInt(userBalanceStr);
      const depositAmount = BigInt(depositTransaction.get('amount') as string);

      // ۲. افزایش موجودی کاربر
      const newBalance = userBalance + depositAmount;
      userToUpdate.set('balance', newBalance.toString());
      await userToUpdate.save({ transaction });

      console.log('💰 User balance updated:', {
        oldBalance: userBalance.toString(),
        depositAmount: depositAmount.toString(),
        newBalance: newBalance.toString()
      });

      // ۳. تغییر وضعیت تراکنش به CONFIRMED
      depositTransaction.set('status', 'CONFIRMED');
      await depositTransaction.save({ transaction });

      console.log('✅ Transaction status updated to CONFIRMED');

      // ۴. پیدا کردن و به‌روزرسانی رکورد WalletHistory
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

      // به‌روزرسانی وضعیت و موجودی نهایی
      walletHistoryRecord.set('status', 'COMPLETED');
      walletHistoryRecord.set('balanceAfter', newBalance.toString());
      walletHistoryRecord.set('description', `واریز مبلغ ${depositAmount.toString()} واحد تایید شد`);
      await walletHistoryRecord.save({ transaction });

      console.log('✅ Wallet history updated to COMPLETED');

      // --- پایان استاندارد طلایی ---

      await transaction.commit();

      console.log('🟢 [/api/admin/deposits/approve] Deposit approved successfully');

      return {
        success: true,
        message: 'واریز با موفقیت تایید شد و موجودی کاربر شارژ شد',
        data: {
          transactionId: transactionId,
          amount: depositAmount.toString(),
          newBalance: newBalance.toString(),
          status: 'CONFIRMED'
        }
      };

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Transaction rolled back due to error:', error);
      throw error;
    }

  } catch (error: any) {
    console.error('🔴 [/api/admin/deposits/approve] Error processing approval:', error);
    
    // اگر خطا از قبل createError باشد، آن را مستقیماً throw کن
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: 'خطا در تایید واریز. لطفاً دوباره تلاش کنید.',
    });
  }
}); 