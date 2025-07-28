import { User } from '../models/User';

export default defineEventHandler(async (event) => {
  // فقط در محیط توسعه فعال باشد
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    // بررسی وجود هدر x-dev-user-wallet
    const walletAddress = getHeader(event, 'x-dev-user-wallet');
    
    if (!walletAddress) {
      console.log('📝 No x-dev-user-wallet header found, skipping auth');
      return;
    }

    console.log(`🔍 Looking for user with wallet: ${walletAddress}`);

    // اطمینان از اینکه sequelize در context موجود است
    if (!event.context.sequelize) {
      console.error('❌ Sequelize not found in context');
      return;
    }

    // جستجوی کاربر در دیتابیس
    let user = await User.findOne({
      where: {
        wallet_address: walletAddress
      }
    });

    if (!user) {
      console.log(`👤 User not found, creating new user with wallet: ${walletAddress}`);
      
      // ایجاد کاربر جدید
      user = await User.create({
        wallet_address: walletAddress,
        balance: BigInt(0)
      } as any);
      
      console.log(`✅ New user created with ID: ${user.id}`);
    } else {
      console.log(`✅ User found with ID: ${user.id}`);
    }

    // قرار دادن اطلاعات کاربر در context
    event.context.user = user;
    console.log(`🔐 User authenticated: ${user.wallet_address} with ID: ${user.dataValues.id}`);

  } catch (error) {
    console.error('❌ Auth middleware error:', error);
  }
}); 