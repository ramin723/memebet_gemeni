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

    // --- ۲. ایجاد قالب‌های پیشرفته ---
    
    console.log('🌱 Seeding Event Templates...');
    // ابتدا تمام قالب‌های قدیمی را پاک می‌کنیم تا از تکرار جلوگیری شود
    await EventTemplate.destroy({ where: {} });

    // --- CATEGORY 1: Binary Predictions (Yes/No) ---
    
    await EventTemplate.create({
      name: 'Goal Achievement',
      description: 'Will [person/team/company] achieve [goal] by [date]?',
      structure: {
        templateType: 'BINARY',
        titleStructure: 'Will [person/team/company] achieve [goal] by [date]?',
        inputs: [
          { name: 'person/team/company', label: 'Person/Team/Company', type: 'text' },
          { name: 'goal', label: 'Goal to Achieve', type: 'text' },
          { name: 'date', label: 'Target Date', type: 'date' }
        ]
      },
      outcomesStructure: { type: 'FIXED', options: [{ title: 'Yes' }, { title: 'No' }] },
      creatorType: 'USER',
      isActive: true,
    });

    await EventTemplate.create({
      name: 'Metric Exceedance',
      description: 'Will [metric] exceed [value] before [date]?',
      structure: {
        templateType: 'BINARY',
        titleStructure: 'Will [metric] exceed [value] before [date]?',
        inputs: [
          { name: 'metric', label: 'Metric Name', type: 'text' },
          { name: 'value', label: 'Target Value', type: 'text' },
          { name: 'date', label: 'Target Date', type: 'date' }
        ]
      },
      outcomesStructure: { type: 'FIXED', options: [{ title: 'Yes' }, { title: 'No' }] },
      creatorType: 'USER',
      isActive: true,
    });

    // --- CATEGORY 2: Competitions (Dynamic Choices) ---

    await EventTemplate.create({
      name: 'Competition Winner',
      description: 'Who will win the [competition]?',
      structure: {
        templateType: 'COMPETITIVE',
        titleStructure: 'Who will win the [competition]?',
        inputs: [
          { name: 'competition', label: 'Competition Name', type: 'text' }
        ]
      },
      outcomesStructure: { type: 'DYNAMIC_CHOICE', min: 2, max: 10, placeholder: 'Competitor Name' },
      creatorType: 'USER',
      isActive: true,
    });

    await EventTemplate.create({
      name: 'Multi-Choice Poll',
      description: 'Which option in [topic] will be the most popular?',
      structure: {
        templateType: 'COMPETITIVE',
        titleStructure: 'Which option in [topic] will be the most popular?',
        inputs: [
          { name: 'topic', label: 'Topic/Subject', type: 'text' }
        ]
      },
      outcomesStructure: { type: 'DYNAMIC_CHOICE', min: 2, max: 5, placeholder: 'Option Title' },
      creatorType: 'USER',
      isActive: true,
    });
    
    // --- CATEGORY 3: Numerical Predictions (Dynamic Ranges) ---

    await EventTemplate.create({
      name: 'Exact Value Prediction',
      description: 'What will be the final value of [metric] on [date]?',
      structure: {
        templateType: 'COMPETITIVE',
        titleStructure: 'What will be the final value of [metric] on [date]?',
        inputs: [
          { name: 'metric', label: 'Metric to Predict', type: 'text' },
          { name: 'date', label: 'Target Date', type: 'date' }
        ]
      },
      outcomesStructure: { type: 'DYNAMIC_RANGE', min: 2, max: 5, placeholder: 'e.g., 20-30' },
      creatorType: 'USER',
      isActive: true,
    });
    
    await EventTemplate.create({
      name: 'Production/Sales Volume',
      description: 'How many [units] will [entity] produce/sell by [date]?',
      structure: {
        templateType: 'COMPETITIVE',
        titleStructure: 'How many [units] will [entity] produce/sell by [date]?',
        inputs: [
          { name: 'units', label: 'Units (e.g., cars, phones)', type: 'text' },
          { name: 'entity', label: 'Company/Entity', type: 'text' },
          { name: 'date', label: 'Target Date', type: 'date' }
        ]
      },
      outcomesStructure: { type: 'DYNAMIC_RANGE', min: 2, max: 5, placeholder: 'e.g., 1-1.5 Million' },
      creatorType: 'USER',
      isActive: true,
    });

    // --- CATEGORY 4: Comparative Predictions ---

    await EventTemplate.create({
      name: 'Metric Comparison',
      description: 'Which will be higher on [date]: [metric A] or [metric B]?',
      structure: {
        templateType: 'HEAD_TO_HEAD',
        titleStructure: 'Which will be higher on [date]: [metric A] or [metric B]?',
        inputs: [
          { name: 'metric A', label: 'First Metric', type: 'text' },
          { name: 'metric B', label: 'Second Metric', type: 'text' },
          { name: 'date', label: 'Comparison Date', type: 'date' }
        ]
      },
      outcomesStructure: { type: 'FIXED', options: [{ title: 'Metric A' }, { title: 'Metric B' }] },
      creatorType: 'USER',
      isActive: true,
    });

    await EventTemplate.create({
      name: 'Ranking Prediction',
      description: 'Will [entity] rank in the top [N] for [category] by [date]?',
      structure: {
        templateType: 'BINARY',
        titleStructure: 'Will [entity] rank in the top [N] for [category] by [date]?',
        inputs: [
          { name: 'entity', label: 'Entity/Company', type: 'text' },
          { name: 'N', label: 'Rank Position (e.g., 5)', type: 'text' },
          { name: 'category', label: 'Category/Industry', type: 'text' },
          { name: 'date', label: 'Target Date', type: 'date' }
        ]
      },
      outcomesStructure: { type: 'FIXED', options: [{ title: 'Yes' }, { title: 'No' }] },
      creatorType: 'USER',
      isActive: true,
    });

    // --- CATEGORY 5: Timeline Predictions ---

    await EventTemplate.create({
      name: 'Event Occurrence',
      description: 'Will [event] occur before [date]?',
      structure: {
        templateType: 'BINARY',
        titleStructure: 'Will [event] occur before [date]?',
        inputs: [
          { name: 'event', label: 'Event Description', type: 'text' },
          { name: 'date', label: 'Deadline Date', type: 'date' }
        ]
      },
      outcomesStructure: { type: 'FIXED', options: [{ title: 'Yes' }, { title: 'No' }] },
      creatorType: 'USER',
      isActive: true,
    });
    
    // --- CATEGORY 6: Sequential Events (My Suggestion) ---
    
    await EventTemplate.create({
      name: 'Sequential Event Race',
      description: 'Which will happen first: [Event A] or [Event B]?',
      structure: {
        templateType: 'HEAD_TO_HEAD',
        titleStructure: 'Which will happen first: [Event A] or [Event B]?',
        inputs: [
          { name: 'Event A', label: 'First Event', type: 'text' },
          { name: 'Event B', label: 'Second Event', type: 'text' }
        ]
      },
      outcomesStructure: { type: 'FIXED', options: [{ title: 'Event A' }, { title: 'Event B' }, { title: 'Neither by end of year' }] },
      creatorType: 'USER',
      isActive: true,
    });

    console.log('✅ Event Templates seeded successfully.');

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