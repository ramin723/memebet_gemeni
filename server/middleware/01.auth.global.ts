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

    // تبدیل به آبجکت ساده
    const plainUser = user.get({ plain: true });
    console.log('🔍 Plain user object:', plainUser);
    console.log('🔍 Plain user ID:', plainUser.id);
    console.log('🔍 Plain user ID type:', typeof plainUser.id);

    // قرار دادن اطلاعات کاربر در context
    event.context.user = plainUser;
    console.log(`🔐 User authenticated: ${plainUser.wallet_address} with ID: ${plainUser.id}`);

  } catch (error) {
    console.error('❌ Auth middleware error:', error);
  }
}); 