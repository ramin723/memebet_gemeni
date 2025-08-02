import { defineEventHandler, createError } from '#imports';
import { User } from '../../models/User';
import { Event } from '../../models/Event';
import { Outcome } from '../../models/Outcome';
import { Tag } from '../../models/Tag';
import { Bet } from '../../models/Bet';
import { PendingCommission } from '../../models/PendingCommission';
import { EventReferral } from '../../models/EventReferral';
import { EventTemplate } from '../../models/EventTemplate';

// Helper to create users with specific roles and permissions
const findOrCreateUser = async (data: { wallet: string, username: string, balance: bigint, referralCode: string, role?: 'USER' | 'ADMIN', status?: 'ACTIVE' | 'SUSPENDED', permissions?: any }, transaction: any) => {
    const [user] = await User.findOrCreate({
        where: { wallet_address: data.wallet },
        defaults: {
            wallet_address: data.wallet,
            username: data.username,
            balance: data.balance.toString(),
            referralCode: data.referralCode,
            role: data.role || 'USER',
            status: data.status || 'ACTIVE',
            permissions: data.permissions || null,
        },
        transaction
    });
    const status = user.isNewRecord ? 'created' : 'found';
    console.log(`✅ User "${data.username}" ${status}.`);
    return user.get({ plain: true });
};

export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV !== 'development') {
    throw createError({ statusCode: 403, message: 'This endpoint is only available in development mode.' });
  }

  const transaction = await event.context.sequelize.transaction();

  try {
    console.log('🧪 Setting up RICH test data...');

    // --- ۱. ایجاد کاربران با نقش‌های متنوع ---
    const superAdmin = await findOrCreateUser({ wallet: 'wallet_superadmin', username: 'SuperAdmin', balance: 1000000n, referralCode: 'SADMIN', role: 'ADMIN', permissions: { system_admin: true } }, transaction);
    const financialAdmin = await findOrCreateUser({ wallet: 'wallet_financial', username: 'FinancialAdmin', balance: 1000000n, referralCode: 'FADMIN', role: 'ADMIN', permissions: { financial_management: true } }, transaction);
    const eventAdmin = await findOrCreateUser({ wallet: 'wallet_event', username: 'EventAdmin', balance: 1000000n, referralCode: 'EADMIN', role: 'ADMIN', permissions: { event_management: true, template_management: true } }, transaction);
    const suspendedUser = await findOrCreateUser({ wallet: 'wallet_suspended', username: 'SuspendedUser', balance: 10000n, referralCode: 'SUSP1', status: 'SUSPENDED' }, transaction);
    const creator = await findOrCreateUser({ wallet: 'wallet_creator', username: 'EventCreator', balance: 500000n, referralCode: 'CREATE1' }, transaction);
    const bettor1 = await findOrCreateUser({ wallet: 'wallet_bettor1', username: 'BettorOne', balance: 75000n, referralCode: 'BETT1' }, transaction);
    const bettor2 = await findOrCreateUser({ wallet: 'wallet_bettor2', username: 'BettorTwo', balance: 120000n, referralCode: 'BETT2' }, transaction);

    // --- ۲. ایجاد یک قالب برای استفاده ---
    const [templateInstance] = await EventTemplate.findOrCreate({
        where: { name: 'Crypto Price Prediction' },
        defaults: {
            name: 'Crypto Price Prediction',
            description: 'A template for crypto price predictions.',
            creatorType: 'BOTH',
            isActive: true,
            structure: {
                templateType: 'BINARY',
                titleStructure: 'Will [asset] reach [target] by [date]?',
                inputs: [
                    { name: 'asset', label: 'Asset Name', type: 'text' },
                    { name: 'target', label: 'Target Price', type: 'text' },
                    { name: 'date', label: 'Target Date', type: 'date' }
                ]
            }
        },
        transaction
    });
    const template = templateInstance.get({ plain: true });

    // --- ۳. ایجاد یک رویداد در انتظار تایید ---
    const [pendingEventInstance] = await Event.findOrCreate({
        where: { title: '[PENDING] Will Solana reach $200?' },
        defaults: {
            creatorId: creator.id,
            title: '[PENDING] Will Solana reach $200?',
            description: 'A test event created by a user, waiting for admin approval.',
            status: 'PENDING_APPROVAL',
            bettingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        transaction
    });
    const pendingEvent = pendingEventInstance.get({ plain: true });

    // ایجاد گزینه‌ها برای رویداد در انتظار
    await Outcome.findOrCreate({ where: { eventId: pendingEvent.id, title: 'Yes' }, transaction });
    await Outcome.findOrCreate({ where: { eventId: pendingEvent.id, title: 'No' }, transaction });


    console.log('✅ All test data setup complete!');
    await transaction.commit();
    return { success: true, message: 'Rich test data setup complete!' };

  } catch (error: any) {
    await transaction.rollback();
    console.error('🔴 Test setup failed:', error);
    throw createError({ statusCode: 500, message: error.message });
  }
});