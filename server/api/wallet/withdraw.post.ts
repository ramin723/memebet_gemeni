import { defineEventHandler, createError, readBody } from '#imports';
import { User } from '../../models/User';
import { Transaction } from '../../models/Transaction';
import { WalletHistory } from '../../models/WalletHistory';

interface WithdrawBody {
  amount: string;
}

export default defineEventHandler(async (event) => {
  console.log('🎯 [/api/wallet/withdraw] Processing withdrawal request...');

  try {
    // احراز هویت
    if (!event.context.user) {
      throw createError({
        statusCode: 401,
        message: 'احراز هویت مورد نیاز است'
      });
    }

    const userId = event.context.user.id;
    console.log('👤 User authenticated:', userId);

    // اعتبارسنجی ورودی
    const body = await readBody<WithdrawBody>(event);
    const { amount } = body;

    // اعتبارسنجی داده‌های ورودی
    if (!amount) {
      throw createError({
        statusCode: 400,
        message: 'مبلغ برداشت باید ارائه شود'
      });
    }

    const withdrawAmount = BigInt(amount);
    
    if (withdrawAmount <= 0) {
      throw createError({
        statusCode: 400,
        message: 'مبلغ برداشت باید بیشتر از صفر باشد'
      });
    }

    // بررسی حداقل و حداکثر مبلغ برداشت
    const MIN_WITHDRAW_AMOUNT = BigInt(1000); // 1000 واحد
    const MAX_WITHDRAW_AMOUNT = BigInt(1000000000); // 1 میلیارد واحد

    if (withdrawAmount < MIN_WITHDRAW_AMOUNT) {
      throw createError({
        statusCode: 400,
        message: `حداقل مبلغ برداشت ${MIN_WITHDRAW_AMOUNT} واحد است`
      });
    }

    if (withdrawAmount > MAX_WITHDRAW_AMOUNT) {
      throw createError({
        statusCode: 400,
        message: `حداکثر مبلغ برداشت ${MAX_WITHDRAW_AMOUNT} واحد است`
      });
    }

    console.log('📊 Withdrawal validation passed:', { amount });

    // شروع تراکنش دیتابیس
    const transaction = await event.context.sequelize.transaction();

    try {
      // پیدا کردن کاربر و قفل کردن ردیف
      const userToUpdate = await User.findByPk(userId, { transaction, lock: true });
      if (!userToUpdate) {
        throw createError({ statusCode: 404, message: 'کاربر یافت نشد' });
      }

      // --- شروع استاندارد طلایی ---

      // ۱. خواندن مقادیر اولیه (همیشه به صورت رشته هستند)
      const userBalanceStr = userToUpdate.getDataValue('balance');
      if (!userBalanceStr) {
        throw createError({ statusCode: 500, message: 'موجودی کاربر یافت نشد' });
      }
      
      // ۲. تبدیل به BigInt برای محاسبات
      const userBalance = BigInt(userBalanceStr);

      // ۳. انجام محاسبات با BigInt
      if (userBalance < withdrawAmount) {
        throw createError({ statusCode: 400, message: 'موجودی کافی نیست' });
      }
      const newBalance = userBalance - withdrawAmount;

      // ۴. نوشتن مقادیر در دیتابیس (تبدیل دوباره به رشته)
      userToUpdate.set('balance', newBalance.toString());
      await userToUpdate.save({ transaction });

      // ایجاد رکورد تراکنش
      const newTransaction = await Transaction.create({
        userId: userId.toString(),
        type: 'WITHDRAWAL',
        amount: withdrawAmount.toString(),
        status: 'PENDING',
        walletAddress: userToUpdate.getDataValue('wallet_address'),
        description: `درخواست برداشت ${withdrawAmount.toString()} واحد`,
      } as any, { transaction });

      const transactionId = newTransaction.get('id') as unknown as string;

      // ایجاد رکورد تاریخچه کیف پول
      await WalletHistory.create({
        userId: userId.toString(),
        amount: (-withdrawAmount).toString(),
        type: 'WITHDRAWAL',
        balanceBefore: userBalance.toString(),
        balanceAfter: newBalance.toString(),
        description: `درخواست برداشت ${withdrawAmount.toString()} واحد`,
        referenceId: transactionId,
      } as any, { transaction });
      
      // --- پایان استاندارد طلایی ---

      await transaction.commit();

      console.log('🟢 [/api/wallet/withdraw] Withdrawal request created successfully');

      return { 
        success: true, 
        message: 'درخواست برداشت با موفقیت ثبت شد', 
        data: { 
          transactionId: transactionId,
          amount: withdrawAmount.toString(),
          newBalance: newBalance.toString() 
        } 
      };

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Transaction rolled back due to error:', error);
      throw error;
    }

  } catch (error: any) {
    console.error('🔴 [/api/wallet/withdraw] Error processing withdrawal:', error);
    
    // اگر خطا از قبل createError باشد، آن را مستقیماً throw کن
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: 'خطا در ثبت درخواست برداشت. لطفاً دوباره تلاش کنید.',
    });
  }
});