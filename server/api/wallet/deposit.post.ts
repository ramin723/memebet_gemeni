import { defineEventHandler, createError, readBody } from '#imports';
import { User } from '../../models/User';
import { Transaction } from '../../models/Transaction';
import { WalletHistory } from '../../models/WalletHistory';

interface DepositBody {
  amount: string;
  txHash: string;
}

export default defineEventHandler(async (event) => {
  console.log('🎯 [/api/wallet/deposit] Processing deposit request...');

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
    const body = await readBody<DepositBody>(event);
    const { amount, txHash } = body;

    // اعتبارسنجی داده‌های ورودی
    if (!amount) {
      throw createError({
        statusCode: 400,
        message: 'مبلغ واریز الزامی است'
      });
    }

    if (!txHash) {
      throw createError({
        statusCode: 400,
        message: 'هش تراکنش الزامی است'
      });
    }

    const depositAmount = BigInt(amount);
    
    if (depositAmount <= 0) {
      throw createError({
        statusCode: 400,
        message: 'مبلغ واریز باید بیشتر از صفر باشد'
      });
    }

    // بررسی حداقل و حداکثر مبلغ واریز
    const MIN_DEPOSIT_AMOUNT = BigInt(1000); // 1000 واحد
    const MAX_DEPOSIT_AMOUNT = BigInt(1000000000); // 1 میلیارد واحد

    if (depositAmount < MIN_DEPOSIT_AMOUNT) {
      throw createError({
        statusCode: 400,
        message: `حداقل مبلغ واریز ${MIN_DEPOSIT_AMOUNT} واحد است`
      });
    }

    if (depositAmount > MAX_DEPOSIT_AMOUNT) {
      throw createError({
        statusCode: 400,
        message: `حداکثر مبلغ واریز ${MAX_DEPOSIT_AMOUNT} واحد است`
      });
    }

    console.log('📊 Deposit validation passed:', { amount, txHash });

    // شروع تراکنش دیتابیس
    const transaction = await event.context.sequelize.transaction();

    try {
      // پیدا کردن کاربر
      const user = await User.findByPk(userId, { transaction, lock: true });
      if (!user) {
        throw createError({ statusCode: 404, message: 'کاربر یافت نشد' });
      }

      // --- شروع استاندارد طلایی ---

      // ۱. خواندن موجودی فعلی کاربر
      const userBalanceStr = user.getDataValue('balance');
      if (!userBalanceStr) {
        throw createError({ statusCode: 500, message: 'موجودی کاربر یافت نشد' });
      }

      const userBalance = BigInt(userBalanceStr);

      // ۲. ایجاد رکورد تراکنش
      const newTransaction = await Transaction.create({
        userId: userId.toString(),
        type: 'DEPOSIT',
        amount: depositAmount.toString(),
        status: 'PENDING',
        txHash: txHash,
        walletAddress: user.getDataValue('wallet_address'),
        description: `درخواست واریز مبلغ ${depositAmount.toString()} واحد`,
      } as any, { transaction });

      const transactionId = newTransaction.get('id') as unknown as string;

      console.log('✅ Transaction created:', { transactionId, amount: depositAmount.toString() });

      // ۳. ایجاد رکورد تاریخچه کیف پول
      await WalletHistory.create({
        userId: userId.toString(),
        amount: depositAmount.toString(),
        type: 'DEPOSIT',
        balanceBefore: userBalance.toString(),
        balanceAfter: userBalance.toString(), // هنوز تغییر نکرده
        description: `درخواست واریز مبلغ ${depositAmount.toString()} واحد (در انتظار تایید)`,
        referenceId: transactionId,
      } as any, { transaction });

      console.log('✅ Wallet history created for deposit');

      // --- پایان استاندارد طلایی ---

      await transaction.commit();

      console.log('🟢 [/api/wallet/deposit] Deposit request created successfully');

      return {
        success: true,
        message: 'درخواست واریز شما ثبت شد و پس از تایید ادمین، موجودی شما شارژ خواهد شد',
        data: {
          transactionId: transactionId,
          amount: depositAmount.toString(),
          txHash: txHash,
          status: 'PENDING'
        }
      };

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Transaction rolled back due to error:', error);
      throw error;
    }

  } catch (error: any) {
    console.error('🔴 [/api/wallet/deposit] Error processing deposit:', error);
    
    // اگر خطا از قبل createError باشد، آن را مستقیماً throw کن
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: 'خطا در ثبت درخواست واریز. لطفاً دوباره تلاش کنید.',
    });
  }
}); 