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
    const { role, permissions } = body;

    // اعتبارسنجی داده‌های ورودی
    if (!role && !permissions) {
      throw createError({
        statusCode: 400,
        statusMessage: 'At least role or permissions must be provided'
      });
    }

    // بررسی اعتبار role
    if (role && !['USER', 'ADMIN'].includes(role)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid role. Must be USER or ADMIN'
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
        statusMessage: 'Cannot modify your own permissions'
      });
    }

    // به‌روزرسانی نقش و دسترسی‌ها
    const updateData: any = {};
    
    if (role) {
      updateData.role = role;
    }
    
    if (permissions) {
      updateData.permissions = permissions;
    }

    await user.update(updateData);

    // بازگرداندن کاربر به‌روزرسانی شده
    return {
      success: true,
      message: 'User permissions updated successfully',
      data: {
        id: (user as any).id,
        wallet_address: (user as any).wallet_address,
        username: (user as any).username,
        role: (user as any).role,
        permissions: (user as any).permissions,
        status: (user as any).status,
        updatedAt: (user as any).updatedAt
      }
    };

  } catch (error: any) {
    console.error('Error updating user permissions:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while updating user permissions'
    });
  }
}); 