import { defineEventHandler, createError, readBody } from '#imports';
import { User } from '../../models/User';
import { Event } from '../../models/Event';
import { Outcome } from '../../models/Outcome';
import { Bet } from '../../models/Bet';
import { WalletHistory } from '../../models/WalletHistory';
import { EventReferral } from '../../models/EventReferral';

interface CreateBetBody {
  eventId: string;
  outcomeId: string;
  amount: string;
  referralCode?: string;
}

export default defineEventHandler(async (event) => {
  console.log('🎯 [/api/bets] Creating new bet...');

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
    const body = await readBody<CreateBetBody>(event);
    const { eventId, outcomeId, amount } = body;

    // اعتبارسنجی داده‌های ورودی
    if (!eventId || !outcomeId || !amount) {
      throw createError({
        statusCode: 400,
        message: 'تمام فیلدهای مورد نیاز باید ارائه شوند'
      });
    }

    const amountBigInt = BigInt(amount);
    
    if (amountBigInt <= 0) {
      throw createError({
        statusCode: 400,
        message: 'مبلغ شرط باید بیشتر از صفر باشد'
      });
    }

    // بررسی حداقل و حداکثر مبلغ شرط
    const MIN_BET_AMOUNT = BigInt(1000); // 1000 واحد
    const MAX_BET_AMOUNT = BigInt(1000000000); // 1 میلیارد واحد

    if (amountBigInt < MIN_BET_AMOUNT) {
      throw createError({
        statusCode: 400,
        message: `حداقل مبلغ شرط ${MIN_BET_AMOUNT} واحد است`
      });
    }

    if (amountBigInt > MAX_BET_AMOUNT) {
      throw createError({
        statusCode: 400,
        message: `حداکثر مبلغ شرط ${MAX_BET_AMOUNT} واحد است`
      });
    }

    console.log('📊 Bet validation passed:', { eventId, outcomeId, amount });

    // شروع تراکنش دیتابیس
    const transaction = await event.context.sequelize.transaction();

    try {
      // پیدا کردن رویداد و گزینه
      const eventData = await Event.findByPk(eventId, { transaction });
      if (!eventData || eventData.get({ plain: true }).status !== 'ACTIVE') {
        throw createError({ statusCode: 400, message: 'رویداد فعال نیست یا یافت نشد' });
      }

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
      const betAmount = BigInt(amount);

      // ۳. انجام محاسبات با BigInt
      if (userBalance < betAmount) {
        throw createError({ statusCode: 400, message: 'موجودی کافی نیست' });
      }
      const newBalance = userBalance - betAmount;

      // ۴. نوشتن مقادیر در دیتابیس (تبدیل دوباره به رشته)
      userToUpdate.set('balance', newBalance.toString());
      await userToUpdate.save({ transaction });

      const newBet = await Bet.create({
        userId: userId.toString(),
        eventId: eventId,
        outcomeId: outcomeId,
        amount: betAmount.toString(),
      } as any, { transaction });

      // برای دسترسی به ID بعد از ساخت، از get استفاده می‌کنیم
      const newBetId = newBet.get('id') as string;

      await WalletHistory.create({
        userId: userId.toString(),
        amount: (-betAmount).toString(),
        type: 'BET',
        balanceBefore: userBalance.toString(),
        balanceAfter: newBalance.toString(),
        description: `شرط روی رویداد #${eventId}`,
        referenceId: newBetId,
      } as any, { transaction });
      
      // --- پایان استاندارد طلایی ---

      // --- START REFERRAL LOGIC ---
      const { referralCode } = body;

      if (referralCode) {
        console.log(`🤝 Referral code provided: ${referralCode}`);

        // ۱. پیدا کردن کاربر معرف
        const referrer = await User.findOne({
          where: { referralCode: referralCode },
          transaction
        });

        // ۲. بررسی شرایط: معرف باید وجود داشته باشد و کاربر نمی‌تواند خودش را معرفی کند
        if (referrer && referrer.get('id') !== userId) {
          const referrerId = referrer.get('id') as string;
          console.log(`✅ Referrer found with ID: ${referrerId}`);

          // ۳. بررسی اینکه آیا قبلاً برای این کاربر و این رویداد ارجاعی ثبت شده یا نه
          const existingReferral = await EventReferral.findOne({
            where: {
              eventId: eventId,
              referredId: userId
            },
            transaction
          });

          if (!existingReferral) {
            // ۴. ایجاد رکورد ارجاع جدید
            await EventReferral.create({
              eventId: eventId,
              referrerId: referrerId,
              referredId: userId.toString(),
              // فعلا کمیسیون را صفر در نظر می‌گیریم. بعدا می‌توانیم منطق آن را اضافه کنیم.
              commission: '0', 
              status: 'pending'
            } as any, { transaction });
            console.log(`✅ New referral recorded for event ${eventId} from referrer ${referrerId} to user ${userId}`);
          } else {
            console.log(`🟡 Referral already exists for this user and event. Skipping.`);
          }
        } else if (referrer && referrer.get('id') === userId) {
          console.log(`🟡 User tried to refer themselves. Skipping.`);
        } 
        else {
          console.log(`⚠️ Referral code "${referralCode}" not found or invalid.`);
        }
      }
      // ---  END REFERRAL LOGIC  ---

      await transaction.commit();

      return { success: true, message: 'شرط با موفقیت ثبت شد', data: { betId: newBetId, newBalance: newBalance.toString() } };

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Transaction rolled back due to error:', error);
      throw error;
    }

  } catch (error: any) {
    console.error('🔴 [/api/bets] Error creating bet:', error);
    
    // اگر خطا از قبل createError باشد، آن را مستقیماً throw کن
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: 'خطا در ثبت شرط. لطفاً دوباره تلاش کنید.',
    });
  }
}); 