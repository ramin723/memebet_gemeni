import { defineEventHandler } from '#imports';
import { User } from '../../models/User';
import { Event } from '../../models/Event';
import { Outcome } from '../../models/Outcome';

export default defineEventHandler(async (event) => {
  console.log('🧪 [/api/test/setup] Setting up test data...');

  try {
    // ایجاد کاربر تستی
    let testUser = await User.findOne({
      where: { wallet_address: 'test-wallet-123' }
    });

    if (!testUser) {
      testUser = await User.create({
        wallet_address: 'test-wallet-123',
        username: 'test-user',
        balance: BigInt(1000000) // 1 میلیون واحد موجودی
      } as any);
      console.log('✅ Test user created with ID:', testUser.id);
    } else {
      console.log('✅ Test user found with ID:', testUser.id);
    }

    // ایجاد رویداد تستی
    let testEvent = await Event.findOne({
      where: { title: 'تست قیمت بیت‌کوین' }
    });

    if (!testEvent) {
      testEvent = await Event.create({
        title: 'تست قیمت بیت‌کوین',
        description: 'آیا قیمت بیت‌کوین تا پایان هفته از 50000 دلار بیشتر می‌شود؟',
        creatorId: testUser.id,
        bettingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 روز بعد
        status: 'ACTIVE',
        isFeatured: false,
        adminNote: null
      } as any);

      console.log('✅ Test event created with ID:', testEvent.id);

      // ایجاد outcomes
      await Outcome.create({
        eventId: testEvent.id,
        title: 'بله، بالاتر از 50000 دلار',
        totalAmount: BigInt(0),
        totalBets: 0,
        isWinner: false
      } as any);

      await Outcome.create({
        eventId: testEvent.id,
        title: 'خیر، کمتر از 50000 دلار',
        totalAmount: BigInt(0),
        totalBets: 0,
        isWinner: false
      } as any);

      console.log('✅ Outcomes created');
    } else {
      console.log('✅ Test event found with ID:', testEvent.id);
    }

    // دریافت اطلاعات کامل
    const fullEvent = await Event.findByPk(testEvent.id, {
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
    });

    return {
      success: true,
      message: 'داده‌های تست با موفقیت راه‌اندازی شد',
      user: {
        id: testUser.id,
        wallet_address: testUser.wallet_address,
        username: testUser.username,
        balance: testUser.balance.toString()
      },
      event: fullEvent
    };

  } catch (error) {
    console.error('🔴 Error:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}); 