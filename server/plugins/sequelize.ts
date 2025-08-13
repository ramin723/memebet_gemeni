// server/plugins/sequelize.ts

import { Sequelize } from 'sequelize';
import { User, initUserModel } from '../models/User';
import { Event, initEventModel } from '../models/Event';
import { Outcome, initOutcomeModel } from '../models/Outcome';
import { Bet, initBetModel } from '../models/Bet';
import { WalletHistory, initWalletHistoryModel } from '../models/WalletHistory';
import { Transaction, initTransactionModel } from '../models/Transaction';
import { PendingCommission, initPendingCommissionModel } from '../models/PendingCommission';
import { EventReferral, initEventReferralModel } from '../models/EventReferral';
import { Tag, initTagModel } from '../models/Tag';
import { EventTag, initEventTagModel } from '../models/EventTag';
import { EventTemplate, initEventTemplateModel } from '../models/EventTemplate';
import { Task, initTaskModel } from '../models/Task';
import { UserTask, initUserTaskModel } from '../models/UserTask';
import { Comment, initCommentModel } from '../models/Comment';
import { Report, initReportModel } from '../models/Report';
import { UserPreference, initUserPreferenceModel } from '../models/UserPreference';
import { Notification, initNotificationModel } from '../models/Notification';

let sequelizeInstance: Sequelize;

export default defineNitroPlugin(async (nitroApp) => {
  console.log('🔧 Initializing Sequelize plugin...');

  sequelizeInstance = new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USER!,
    process.env.DB_PASS!,
    {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      dialect: 'postgres',
      define: {
        // تنظیمات پیش‌فرض Sequelize
      },
    }
  );

  try {
    await sequelizeInstance.authenticate();
    console.log('✅ Connection has been established successfully.');
    
    // مقداردهی اولیه مدل‌ها
    console.log('🔧 Initializing models...');
    initUserModel(sequelizeInstance);
    initEventModel(sequelizeInstance);
    initOutcomeModel(sequelizeInstance);
    initBetModel(sequelizeInstance);
    initWalletHistoryModel(sequelizeInstance);
    initTransactionModel(sequelizeInstance);
    initPendingCommissionModel(sequelizeInstance);
    initEventReferralModel(sequelizeInstance);
    initTagModel(sequelizeInstance);
    initEventTagModel(sequelizeInstance);
    initEventTemplateModel(sequelizeInstance);
    initTaskModel(sequelizeInstance);
    initUserTaskModel(sequelizeInstance);
    initCommentModel(sequelizeInstance);
    initReportModel(sequelizeInstance);
    initUserPreferenceModel(sequelizeInstance);
    initNotificationModel(sequelizeInstance);
    console.log('✅ Models initialized successfully.');
    
    // تعریف روابط بین مدل‌ها
    console.log('🔗 Setting up model associations...');
    
    // User -> Event (One-to-Many)
    User.hasMany(Event, {
      foreignKey: 'creatorId',
      as: 'events',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    Event.belongsTo(User, {
      foreignKey: 'creatorId',
      as: 'creator',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Event -> Outcome (One-to-Many)
    Event.hasMany(Outcome, {
      foreignKey: 'eventId',
      as: 'outcomes',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    Outcome.belongsTo(Event, {
      foreignKey: 'eventId',
      as: 'event',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Outcome -> Bet (One-to-Many)
    Outcome.hasMany(Bet, {
      foreignKey: 'outcomeId',
      as: 'bets',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    Bet.belongsTo(Outcome, {
      foreignKey: 'outcomeId',
      as: 'outcome',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // User -> Bet (One-to-Many)
    User.hasMany(Bet, {
      foreignKey: 'userId',
      as: 'bets',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    Bet.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Event -> Bet (One-to-Many)
    Event.hasMany(Bet, {
      foreignKey: 'eventId',
      as: 'bets',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    Bet.belongsTo(Event, {
      foreignKey: 'eventId',
      as: 'event',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // User -> WalletHistory (One-to-Many)
    User.hasMany(WalletHistory, {
      foreignKey: 'userId',
      as: 'walletHistories',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    WalletHistory.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // User -> Transaction (One-to-Many)
    User.hasMany(Transaction, {
      foreignKey: 'userId',
      as: 'transactions',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    Transaction.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // PendingCommission -> User/Event/Bet (Many-to-One)
    User.hasMany(PendingCommission, {
      foreignKey: 'userId',
      as: 'pendingCommissions',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    PendingCommission.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    Event.hasMany(PendingCommission, {
      foreignKey: 'eventId',
      as: 'pendingCommissions',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    PendingCommission.belongsTo(Event, {
      foreignKey: 'eventId',
      as: 'event',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    Bet.hasMany(PendingCommission, {
      foreignKey: 'betId',
      as: 'pendingCommissions',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    PendingCommission.belongsTo(Bet, {
      foreignKey: 'betId',
      as: 'bet',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // EventReferral (referrer, referred) + Event
    User.hasMany(EventReferral, {
      foreignKey: 'referrerId',
      as: 'referralsMade',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    User.hasMany(EventReferral, {
      foreignKey: 'referredId',
      as: 'referralsReceived',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    EventReferral.belongsTo(User, {
      foreignKey: 'referrerId',
      as: 'referrer',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    EventReferral.belongsTo(User, {
      foreignKey: 'referredId',
      as: 'referred',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    EventReferral.belongsTo(Event, {
      foreignKey: 'eventId',
      as: 'event',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    Event.hasMany(EventReferral, {
      foreignKey: 'eventId',
      as: 'referrals',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Event <-> Tag (Many-to-Many via EventTag)
    Event.belongsToMany(Tag, {
      through: EventTag,
      foreignKey: 'eventId',
      otherKey: 'tagId',
      as: 'tags',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    Tag.belongsToMany(Event, {
      through: EventTag,
      foreignKey: 'tagId',
      otherKey: 'eventId',
      as: 'events',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // EventTag (Many-to-Many helpers)
    Event.hasMany(EventTag, {
      foreignKey: 'eventId',
      as: 'eventTags',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    EventTag.belongsTo(Event, {
      foreignKey: 'eventId',
      as: 'event',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    Tag.hasMany(EventTag, {
      foreignKey: 'tagId',
      as: 'eventTags',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    EventTag.belongsTo(Tag, {
      foreignKey: 'tagId',
      as: 'tag',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Tag hierarchical (self-relation)
    Tag.belongsTo(Tag, {
      foreignKey: 'parentId',
      as: 'parent',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    Tag.hasMany(Tag, {
      foreignKey: 'parentId',
      as: 'children',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // EventTemplate -> Event (One-to-Many)
    EventTemplate.hasMany(Event, {
      foreignKey: 'templateId',
      as: 'events',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    Event.belongsTo(EventTemplate, {
      foreignKey: 'templateId',
      as: 'template',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // User <-> Task (Many-to-Many via UserTask)
    User.belongsToMany(Task, {
      through: UserTask,
      foreignKey: 'userId',
      otherKey: 'taskId',
      as: 'tasks',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    Task.belongsToMany(User, {
      through: UserTask,
      foreignKey: 'taskId',
      otherKey: 'userId',
      as: 'users',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // UserTask (One-to-Many helpers)
    User.hasMany(UserTask, {
      foreignKey: 'userId',
      as: 'userTasks',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    UserTask.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    Task.hasMany(UserTask, {
      foreignKey: 'taskId',
      as: 'userTasks',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    UserTask.belongsTo(Task, {
      foreignKey: 'taskId',
      as: 'task',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // User -> Comment (One-to-Many)
    User.hasMany(Comment, { 
      foreignKey: 'userId', 
      as: 'comments', 
      onDelete: 'CASCADE', 
      onUpdate: 'CASCADE' 
    });
    Comment.belongsTo(User, { 
      foreignKey: 'userId', 
      as: 'user', 
      onDelete: 'CASCADE', 
      onUpdate: 'CASCADE' 
    });

    // Event -> Comment (One-to-Many)
    Event.hasMany(Comment, { 
      foreignKey: 'eventId', 
      as: 'comments', 
      onDelete: 'CASCADE', 
      onUpdate: 'CASCADE' 
    });
    Comment.belongsTo(Event, { 
      foreignKey: 'eventId', 
      as: 'event', 
      onDelete: 'CASCADE', 
      onUpdate: 'CASCADE' 
    });

    // User -> Report (One-to-Many)
    User.hasMany(Report, { 
      foreignKey: 'userId', 
      as: 'reports', 
      onDelete: 'CASCADE', 
      onUpdate: 'CASCADE' 
    });
    Report.belongsTo(User, { 
      foreignKey: 'userId', 
      as: 'user', 
      onDelete: 'CASCADE', 
      onUpdate: 'CASCADE' 
    });

    // Event -> Report (One-to-Many)
    Event.hasMany(Report, { 
      foreignKey: 'eventId', 
      as: 'reports', 
      onDelete: 'CASCADE', 
      onUpdate: 'CASCADE' 
    });
    Report.belongsTo(Event, { 
      foreignKey: 'eventId', 
      as: 'event', 
      onDelete: 'CASCADE', 
      onUpdate: 'CASCADE' 
    });

    // User -> Notification (One-to-Many)
    User.hasMany(Notification, { 
      foreignKey: 'userId', 
      as: 'notifications', 
      onDelete: 'CASCADE', 
      onUpdate: 'CASCADE' 
    });
    Notification.belongsTo(User, { 
      foreignKey: 'userId', 
      as: 'user', 
      onDelete: 'CASCADE', 
      onUpdate: 'CASCADE' 
    });

    // User -> UserPreference (One-to-Many)
    User.hasMany(UserPreference, { 
      foreignKey: 'userId', 
      as: 'preferences', 
      onDelete: 'CASCADE', 
      onUpdate: 'CASCADE' 
    });
    UserPreference.belongsTo(User, { 
      foreignKey: 'userId', 
      as: 'user', 
      onDelete: 'CASCADE', 
      onUpdate: 'CASCADE' 
    });
    
    console.log('✅ Model associations set up successfully.');
    
    // همگام‌سازی مدل‌ها با دیتابیس
    console.log('🔄 Syncing models with database...');
    try {
      await sequelizeInstance.sync({ force: false }); // فقط sync عادی
      console.log('✅ Database tables synced successfully.');
    } catch (syncError) {
      console.error('⚠️ Sync error (continuing anyway):', syncError);
    }
    
    nitroApp.hooks.hook('request', (event) => {
      event.context.sequelize = sequelizeInstance;
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
});

export { sequelizeInstance as sequelize };