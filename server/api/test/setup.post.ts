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

    // --- ۲. ایجاد قالب‌های پیش‌فرض ---
    
    // Template 1: Binary Yes/No Template
    const [yesNoTemplate] = await EventTemplate.findOrCreate({
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
            },
            outcomesStructure: {
                type: 'FIXED',
                options: [
                    { title: 'Yes' },
                    { title: 'No' }
                ]
            }
        },
        transaction
    });

    // Template 2: Who will win? (Dynamic Outcomes)
    await EventTemplate.findOrCreate({
        where: { name: 'Competition (Who will win?)' },
        defaults: {
            name: 'Competition (Who will win?)',
            description: 'A template for predicting the winner of a match or competition. You define the competitors.',
            structure: {
                templateType: 'COMPETITIVE',
                titleStructure: 'Who will win the [title] [context]?',
                inputs: [
                    { name: 'title', label: 'Competition Title', type: 'text' },
                    { name: 'context', label: 'Additional Context', type: 'text' }
                ]
            },
            outcomesStructure: {
                type: 'DYNAMIC',
                min: 2,
                max: 10
            },
            creatorType: 'USER',
            isActive: true,
        },
        transaction
    });

    // Template 3: Numerical Range Prediction (Dynamic Outcomes)
    await EventTemplate.findOrCreate({
        where: { name: 'Numerical Prediction' },
        defaults: {
            name: 'Numerical Prediction',
            description: 'A template for predicting a numerical outcome within defined ranges.',
            structure: {
                templateType: 'COMPETITIVE',
                titleStructure: 'What will be the [metric] by [date]?',
                inputs: [
                    { name: 'metric', label: 'Metric to Predict', type: 'text' },
                    { name: 'date', label: 'Prediction Date', type: 'date' }
                ]
            },
            outcomesStructure: {
                type: 'DYNAMIC',
                min: 2,
                max: 5
            },
            creatorType: 'USER',
            isActive: true,
        },
        transaction
    });

    const template = yesNoTemplate.get({ plain: true });

    // --- ۳. ایجاد 10 رویداد متنوع ---
    const events = [
        {
            title: '[PENDING] Will jafar reach $200 by end of month?',
            description: 'A test event created by a user, waiting for admin approval.',
            status: 'PENDING_APPROVAL' as const,
            bettingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            creatorId: creator.id
        },
        {
            title: '[PENDING] Will Bitcoin hit $100,000 in 2024?',
            description: 'Bitcoin price prediction for the year 2024.',
            status: 'PENDING_APPROVAL' as const,
            bettingDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
            creatorId: creator.id
        },
        {
            title: '[PENDING] Will Ethereum 2.0 launch in Q2?',
            description: 'Ethereum upgrade prediction.',
            status: 'PENDING_APPROVAL' as const,
            bettingDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
            creatorId: creator.id
        },
        {
            title: '[PENDING] Will Tesla stock reach $300?',
            description: 'Tesla stock price prediction.',
            status: 'PENDING_APPROVAL' as const,
            bettingDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
            creatorId: creator.id
        },
        {
            title: '[PENDING] Will Apple release new iPhone in September?',
            description: 'Apple product launch prediction.',
            status: 'PENDING_APPROVAL' as const,
            bettingDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            creatorId: creator.id
        },
        {
            title: '[PENDING] Will SpaceX land on Mars in 2024?',
            description: 'Space exploration prediction.',
            status: 'PENDING_APPROVAL' as const,
            bettingDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
            creatorId: creator.id
        },
        {
            title: '[PENDING] Will Netflix subscriber count exceed 250M?',
            description: 'Streaming service growth prediction.',
            status: 'PENDING_APPROVAL' as const,
            bettingDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
            creatorId: creator.id
        },
        {
            title: '[PENDING] Will Google release AI-powered search?',
            description: 'Tech company AI development prediction.',
            status: 'PENDING_APPROVAL' as const,
            bettingDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days
            creatorId: creator.id
        },
        {
            title: '[PENDING] Will Amazon drone delivery become mainstream?',
            description: 'E-commerce innovation prediction.',
            status: 'PENDING_APPROVAL' as const,
            bettingDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            creatorId: creator.id
        },
        {
            title: '[PENDING] Will Meta VR headset sales exceed 10M units?',
            description: 'Virtual reality market prediction.',
            status: 'PENDING_APPROVAL' as const,
            bettingDeadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days
            creatorId: creator.id
        }
    ];

    // ایجاد رویدادها
    for (const eventData of events) {
        const [eventInstance] = await Event.findOrCreate({
            where: { title: eventData.title },
            defaults: {
                creatorId: eventData.creatorId,
                title: eventData.title,
                description: eventData.description,
                status: eventData.status,
                bettingDeadline: eventData.bettingDeadline,
            },
            transaction
        });
        const event = eventInstance.get({ plain: true });

        // ایجاد گزینه‌ها برای هر رویداد
        await Outcome.findOrCreate({ 
            where: { eventId: event.id, title: 'Yes' }, 
            defaults: { eventId: event.id, title: 'Yes' },
            transaction 
        });
        await Outcome.findOrCreate({ 
            where: { eventId: event.id, title: 'No' }, 
            defaults: { eventId: event.id, title: 'No' },
            transaction 
        });

        console.log(`✅ Event "${eventData.title}" created.`);
    }


    console.log('✅ All test data setup complete!');
    await transaction.commit();
    return { success: true, message: 'Rich test data setup complete!' };

  } catch (error: any) {
    await transaction.rollback();
    console.error('🔴 Test setup failed:', error);
    throw createError({ statusCode: 500, message: error.message });
  }
});