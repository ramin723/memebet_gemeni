import { defineEventHandler, readBody, getRouterParam, createError } from 'h3';
import { User } from '../../../../models/User';

export default defineEventHandler(async (event) => {
  try {
    // دریافت userId از پارامترها
    const userId = getRouterParam(event, 'id');
    
    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      });
    }

    // دریافت داده‌ها از body
    const body = await readBody(event);
    const { status, reason } = body;

    // اعتبارسنجی status
    if (!status || !['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid status is required (ACTIVE, SUSPENDED, BANNED)'
      });
    }

    // پیدا کردن کاربر
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      });
    }

    // بررسی اینکه کاربر خودش را تغییر ندهد
    const currentUser = event.context.user;
    if (currentUser.id === userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Cannot modify your own status'
      });
    }

    // بررسی اینکه ادمین کل را نتوان SUSPENDED یا BANNED کرد
    if ((user as any).role === 'ADMIN' && status !== 'ACTIVE') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Cannot suspend or ban admin users'
      });
    }

    // به‌روزرسانی وضعیت
    const updateData: any = { status };
    
    // اگر reason ارائه شده، آن را در permissions ذخیره کنیم
    if (reason) {
      const currentPermissions = (user as any).permissions || {};
      updateData.permissions = {
        ...currentPermissions,
        statusChange: {
          previousStatus: (user as any).status,
          newStatus: status,
          reason: reason,
          changedBy: currentUser.id,
          changedAt: new Date()
        }
      };
    }

    await user.update(updateData);

    // بازگرداندن کاربر به‌روزرسانی شده
    return {
      success: true,
      message: `User status updated to ${status}`,
      data: {
        id: (user as any).id,
        wallet_address: (user as any).wallet_address,
        username: (user as any).username,
        role: (user as any).role,
        status: (user as any).status,
        updatedAt: (user as any).updatedAt
      }
    };

  } catch (error: any) {
    console.error('Error updating user status:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while updating user status'
    });
  }
}); 