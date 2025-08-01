import { defineEventHandler, createError } from '#imports';
import { User } from '../../models/User';
import { Event } from '../../models/Event';
import { Outcome } from '../../models/Outcome';
import { Tag } from '../../models/Tag';
import { Bet } from '../../models/Bet';
import { PendingCommission } from '../../models/PendingCommission';
import { EventReferral } from '../../models/EventReferral';

// Helper function to create a user if they don't exist
const findOrCreateUser = async (walletAddress: string, username: string, balance: bigint, referralCode: string, transaction: any) => {
  const [user] = await User.findOrCreate({
    where: { wallet_address: walletAddress },
    defaults: {
      wallet_address: walletAddress,
      username: username,
      balance: balance.toString(),
      referralCode: referralCode,
    },
    transaction
  });
  if (user.isNewRecord) {
      console.log(`✅ User "${username}" created.`);
  } else {
      console.log(`🟡 User "${username}" already exists.`);
  }
  return user.get({ plain: true });
};

export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV !== 'development') {
    throw createError({ statusCode: 403, message: 'This endpoint is only available in development mode.' });
  }

  const transaction = await event.context.sequelize.transaction();

  try {
    console.log('🧪 Setting up test data...');

    // ۱. ایجاد کاربران تستی
    const creator = await findOrCreateUser('wallet_creator', 'EventCreator', 1000000n, 'CREATE1', transaction);
    const referrer = await findOrCreateUser('wallet_referrer', 'ReferrerUser', 1000000n, 'REFER1', transaction);
    const referredBettor = await findOrCreateUser('wallet_referred', 'ReferredBettor', 50000n, 'BETT_A', transaction);
    const normalBettor = await findOrCreateUser('wallet_normal', 'NormalBettor', 80000n, 'BETT_B', transaction);
    const winnerBettor = await findOrCreateUser('wallet_winner', 'WinnerBettor', 120000n, 'BETT_C', transaction);

    // ۲. ایجاد تگ‌های تستی
    const [techTagInstance] = await Tag.findOrCreate({ where: { name: 'Technology' }, transaction });
    const [financeTagInstance] = await Tag.findOrCreate({ where: { name: 'Finance' }, transaction });
    const techTag = techTagInstance.get({ plain: true });
    const financeTag = financeTagInstance.get({ plain: true });

    // ۳. ایجاد رویداد اصلی
    const [eventInstance] = await Event.findOrCreate({
      where: { title: '[TEST] Bitcoin Price Prediction' },
      defaults: {
        creatorId: creator.id,
        title: '[TEST] Bitcoin Price Prediction',
        description: 'Will Bitcoin price surpass $70,000 by the end of the week?',
        status: 'ACTIVE',
        bettingDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      },
      transaction
    });
    const plainEvent = eventInstance.get({ plain: true });

    // ۴. اتصال تگ‌ها به رویداد (فعلاً حذف شده تا روابط تعریف شوند)
    console.log('✅ Event and tags created/found.');

    // ۵. ایجاد گزینه‌ها (Outcomes)
    const [outcomeYesInstance] = await Outcome.findOrCreate({
      where: { eventId: plainEvent.id, title: 'Yes, it will surpass $70,000' },
      transaction
    });
    const [outcomeNoInstance] = await Outcome.findOrCreate({
      where: { eventId: plainEvent.id, title: 'No, it will stay below $70,000' },
      transaction
    });
    const outcomeYes = outcomeYesInstance.get({ plain: true });
    const outcomeNo = outcomeNoInstance.get({ plain: true });
    console.log('✅ Outcomes created/found.');

    // ۶. ثبت ارجاع (Referral)
    await EventReferral.findOrCreate({
        where: { eventId: plainEvent.id!, referredId: referredBettor.id! },
        defaults: {
            eventId: plainEvent.id!,
            referrerId: referrer.id!,
            referredId: referredBettor.id!,
            commission: 0,
            status: 'pending'
        } as any,
        transaction
    });
    console.log('✅ Referral link established.');

    // ۷. ثبت شرط‌ها
    const betReferredInstance = await Bet.create({ eventId: plainEvent.id, userId: referredBettor.id, outcomeId: outcomeYes.id, amount: '20000' }, { transaction });
    const betWinnerInstance = await Bet.create({ eventId: plainEvent.id, userId: winnerBettor.id, outcomeId: outcomeYes.id, amount: '50000' }, { transaction });
    const betNormalInstance = await Bet.create({ eventId: plainEvent.id, userId: normalBettor.id, outcomeId: outcomeNo.id, amount: '30000' }, { transaction });
    const betReferred = betReferredInstance.get({ plain: true });
    const betWinner = betWinnerInstance.get({ plain: true });
    const betNormal = betNormalInstance.get({ plain: true });
    console.log('✅ Bets placed.');
    
    // ۸. ایجاد کمیسیون‌های در انتظار
    await PendingCommission.bulkCreate([
        // Bet 1 (Referred)
        { eventId: plainEvent.id, userId: '1', betId: betReferred.id, amount: (20000n * 6n / 100n).toString(), type: 'PLATFORM' },
        { eventId: plainEvent.id, userId: creator.id, betId: betReferred.id, amount: (20000n * 5n / 100n).toString(), type: 'CREATOR' },
        { eventId: plainEvent.id, userId: referrer.id, betId: betReferred.id, amount: (20000n * 4n / 100n).toString(), type: 'REFERRAL' },
        // Bet 2 (Winner)
        { eventId: plainEvent.id, userId: '1', betId: betWinner.id, amount: (50000n * 6n / 100n).toString(), type: 'PLATFORM' },
        { eventId: plainEvent.id, userId: creator.id, betId: betWinner.id, amount: (50000n * 5n / 100n).toString(), type: 'CREATOR' },
        // Bet 3 (Normal)
        { eventId: plainEvent.id, userId: '1', betId: betNormal.id, amount: (30000n * 6n / 100n).toString(), type: 'PLATFORM' },
        { eventId: plainEvent.id, userId: creator.id, betId: betNormal.id, amount: (30000n * 5n / 100n).toString(), type: 'CREATOR' },
    ], { transaction });
    console.log('✅ Pending commissions created.');

    await transaction.commit();
    return { success: true, message: 'Test data setup complete!', eventId: plainEvent.id };

  } catch (error: any) {
    await transaction.rollback();
    console.error('🔴 Test setup failed:', error);
    throw createError({ statusCode: 500, message: error.message });
  }
});