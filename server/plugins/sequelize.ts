// server/plugins/sequelize.ts

import { Sequelize } from 'sequelize';
import { User, initUserModel } from '../models/User';
import { Event, initEventModel } from '../models/Event';
import { Outcome, initOutcomeModel } from '../models/Outcome';

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