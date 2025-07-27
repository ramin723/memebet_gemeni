// server/plugins/sequelize.ts

import { Sequelize } from 'sequelize';

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
    nitroApp.hooks.hook('request', (event) => {
      event.context.sequelize = sequelize;
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
});