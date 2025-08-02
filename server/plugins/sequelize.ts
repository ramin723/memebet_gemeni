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

export default defineNitroPlugin(async (nitroApp) => {
  console.log('🔧 Initializing Sequelize plugin...');

  // --- START DEBUG CODE ---
  // این دو خط را برای تست اضافه کن
  console.log('Reading DB_PASS from .env:', process.env.DB_PASS);
  console.log('Reading DB_USER from .env:', process.env.DB_USER);
  // ---  END DEBUG CODE  ---

  const sequelize = new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USER!,
    process.env.DB_PASS!, // مطمئن شو که اینجا DB_PASS است
    {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      dialect: 'postgres',
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Connection has been established successfully.');
    
    // مقداردهی اولیه مدل‌ها
    console.log('🔧 Initializing models...');
    initUserModel(sequelize);
    initEventModel(sequelize);
    initOutcomeModel(sequelize);
    initBetModel(sequelize);
    initWalletHistoryModel(sequelize);
    initTransactionModel(sequelize);
    initPendingCommissionModel(sequelize);
    initEventReferralModel(sequelize);
    initTagModel(sequelize);
    initEventTagModel(sequelize);
    initEventTemplateModel(sequelize);
    initTaskModel(sequelize);
    initUserTaskModel(sequelize);
    initCommentModel(sequelize);
    initReportModel(sequelize);
    initUserPreferenceModel(sequelize);
    initNotificationModel(sequelize);
    console.log('✅ Models initialized successfully.');
    
    // تعریف روابط بین مدل‌ها
    console.log('🔗 Setting up model associations...');
    
    // User -> Event (یک به چند)
    User.hasMany(Event, {
      foreignKey: 'creatorId',
      as: 'events'
    });
    Event.belongsTo(User, {
      foreignKey: 'creatorId',
      as: 'creator'
    });
    
    // Event -> Outcome (یک به چند)
    Event.hasMany(Outcome, {
      foreignKey: 'eventId',
      as: 'outcomes'
    });
    Outcome.belongsTo(Event, {
      foreignKey: 'eventId',
      as: 'event'
    });
    
    // User -> Bet (یک به چند)
    User.hasMany(Bet, {
      foreignKey: 'userId',
      as: 'bets'
    });
    Bet.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    // Event -> Bet (یک به چند)
    Event.hasMany(Bet, {
      foreignKey: 'eventId',
      as: 'bets'
    });
    Bet.belongsTo(Event, {
      foreignKey: 'eventId',
      as: 'event'
    });
    
    // Outcome -> Bet (یک به چند)
    Outcome.hasMany(Bet, {
      foreignKey: 'outcomeId',
      as: 'bets'
    });
    Bet.belongsTo(Outcome, {
      foreignKey: 'outcomeId',
      as: 'outcome'
    });
    
    // User -> WalletHistory (یک به چند)
    User.hasMany(WalletHistory, {
      foreignKey: 'userId',
      as: 'walletHistories'
    });
    WalletHistory.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    // User -> Transaction (یک به چند)
    User.hasMany(Transaction, {
      foreignKey: 'userId',
      as: 'transactions'
    });
    Transaction.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    // User -> PendingCommission (یک به چند)
    User.hasMany(PendingCommission, {
      foreignKey: 'userId',
      as: 'pendingCommissions'
    });
    PendingCommission.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    // Event -> PendingCommission (یک به چند)
    Event.hasMany(PendingCommission, {
      foreignKey: 'eventId',
      as: 'pendingCommissions'
    });
    PendingCommission.belongsTo(Event, {
      foreignKey: 'eventId',
      as: 'event'
    });
    
    // Bet -> PendingCommission (یک به چند)
    Bet.hasMany(PendingCommission, {
      foreignKey: 'betId',
      as: 'pendingCommissions'
    });
    PendingCommission.belongsTo(Bet, {
      foreignKey: 'betId',
      as: 'bet'
    });
    
    // User -> EventReferral (as Referrer)
    User.hasMany(EventReferral, {
      foreignKey: 'referrerId',
      as: 'referralsMade'
    });
    EventReferral.belongsTo(User, {
      foreignKey: 'referrerId',
      as: 'referrer'
    });

    // User -> EventReferral (as Referred)
    User.hasMany(EventReferral, {
      foreignKey: 'referredId',
      as: 'referralsReceived'
    });
    EventReferral.belongsTo(User, {
      foreignKey: 'referredId',
      as: 'referred'
    });

    // Event -> EventReferral
    Event.hasMany(EventReferral, {
      foreignKey: 'eventId',
      as: 'referrals'
    });
    EventReferral.belongsTo(Event, {
      foreignKey: 'eventId',
      as: 'event'
    });

    // Event <-> Tag (Many-to-Many)
    Event.belongsToMany(Tag, {
      through: EventTag,
      foreignKey: 'eventId',
      otherKey: 'tagId',
      as: 'tags'
    });
    Tag.belongsToMany(Event, {
      through: EventTag,
      foreignKey: 'tagId',
      otherKey: 'eventId',
      as: 'events'
    });

    // Tag Self-Referential (Hierarchical)
    Tag.belongsTo(Tag, {
      foreignKey: 'parentId',
      as: 'parent'
    });
    Tag.hasMany(Tag, {
      foreignKey: 'parentId',
      as: 'children'
    });

    // EventTemplate -> Event (One-to-Many)
    EventTemplate.hasMany(Event, {
      foreignKey: 'templateId',
      as: 'events'
    });
    Event.belongsTo(EventTemplate, {
      foreignKey: 'templateId',
      as: 'template'
    });

    // User <-> Task (Many-to-Many through UserTask)
    User.belongsToMany(Task, {
      through: UserTask,
      foreignKey: 'userId',
      otherKey: 'taskId',
      as: 'tasks'
    });
    Task.belongsToMany(User, {
      through: UserTask,
      foreignKey: 'taskId',
      otherKey: 'userId',
      as: 'users'
    });

    // User -> UserTask (One-to-Many)
    User.hasMany(UserTask, {
      foreignKey: 'userId',
      as: 'userTasks'
    });
    UserTask.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Task -> UserTask (One-to-Many)
    Task.hasMany(UserTask, {
      foreignKey: 'taskId',
      as: 'userTasks'
    });
    UserTask.belongsTo(Task, {
      foreignKey: 'taskId',
      as: 'task'
    });

    // User -> Comment (One-to-Many)
    User.hasMany(Comment, {
      foreignKey: 'userId',
      as: 'comments'
    });
    Comment.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Event -> Comment (One-to-Many)
    Event.hasMany(Comment, {
      foreignKey: 'eventId',
      as: 'comments'
    });
    Comment.belongsTo(Event, {
      foreignKey: 'eventId',
      as: 'event'
    });

    // User -> Report (as Reporter)
    User.hasMany(Report, {
      foreignKey: 'reporterId',
      as: 'reportsMade'
    });
    Report.belongsTo(User, {
      foreignKey: 'reporterId',
      as: 'reporter'
    });

    // User -> Report (as Resolver)
    User.hasMany(Report, {
      foreignKey: 'resolvedBy',
      as: 'reportsResolved'
    });
    Report.belongsTo(User, {
      foreignKey: 'resolvedBy',
      as: 'resolver'
    });

    // Event -> Report (Polymorphic)
    Event.hasMany(Report, {
      foreignKey: 'entityId',
      scope: { entityType: 'EVENT' },
      as: 'reports'
    });

    // Comment -> Report (Polymorphic)
    Comment.hasMany(Report, {
      foreignKey: 'entityId',
      scope: { entityType: 'COMMENT' },
      as: 'reports'
    });

    // User <-> UserPreference (One-to-One)
    User.hasOne(UserPreference, {
      foreignKey: 'userId',
      as: 'preferences'
    });
    UserPreference.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // User -> Notification (One-to-Many)
    User.hasMany(Notification, {
      foreignKey: 'userId',
      as: 'notifications'
    });
    Notification.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    console.log('✅ Model associations set up successfully.');
    
    // همگام‌سازی مدل‌ها با دیتابیس
    console.log('🔄 Syncing models with database...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables synced successfully.');
    
    nitroApp.hooks.hook('request', (event) => {
      event.context.sequelize = sequelize;
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
});