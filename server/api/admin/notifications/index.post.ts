import { defineEventHandler, readBody, createError } from 'h3';
import { Notification } from '../../../models/Notification';
import { User } from '../../../models/User';

export default defineEventHandler(async (event) => {
  try {
    // بررسی احراز هویت و دسترسی ادمین
    if (!event.context.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    const adminUser = event.context.user;
    if ((adminUser as any).role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      });
    }

    // دریافت body
    const body = await readBody(event);
    const {
      title,
      message,
      type,
      priority = 'MEDIUM',
      targetUsers = 'ALL', // ALL, SPECIFIC, GROUP
      userIds = [],
      userGroup = null, // مثلاً 'ACTIVE', 'NEW', 'PREMIUM'
      actionUrl = null,
      expiresAt = null,
      relatedEntity = null
    } = body;

    // اعتبارسنجی فیلدهای اجباری
    if (!title || !message || !type) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Title, message, and type are required'
      });
    }

    // اعتبارسنجی type
    const allowedTypes = ['EVENT_RESOLVED', 'LEVEL_UP', 'NEW_TASK', 'SYSTEM', 'BET_WON', 'BET_LOST', 'COMMENT_REPLY', 'REPORT_RESOLVED'];
    if (!allowedTypes.includes(type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid notification type'
      });
    }

    // اعتبارسنجی priority
    const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (!allowedPriorities.includes(priority)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid priority'
      });
    }

    // اعتبارسنجی targetUsers
    const allowedTargets = ['ALL', 'SPECIFIC', 'GROUP'];
    if (!allowedTargets.includes(targetUsers)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid target users'
      });
    }

    // تعیین کاربران هدف
    let targetUserIds: string[] = [];

    if (targetUsers === 'ALL') {
      // دریافت تمام کاربران فعال
      const allUsers = await User.findAll({
        where: { status: 'ACTIVE' },
        attributes: ['id']
      });
      targetUserIds = allUsers.map((user: any) => (user as any).id);
    } else if (targetUsers === 'SPECIFIC') {
      if (!userIds || userIds.length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'User IDs are required for specific targeting'
        });
      }
      targetUserIds = userIds;
    } else if (targetUsers === 'GROUP') {
      if (!userGroup) {
        throw createError({
          statusCode: 400,
          statusMessage: 'User group is required for group targeting'
        });
      }
      
      // فیلتر بر اساس گروه کاربران
      const whereClause: any = { status: 'ACTIVE' };
      
      switch (userGroup) {
        case 'NEW':
          // کاربران جدید (ثبت‌نام شده در 7 روز گذشته)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          whereClause.createdAt = {
            [require('sequelize').Op.gte]: sevenDaysAgo
          };
          break;
        case 'ACTIVE':
          // کاربران فعال (با شرط‌بندی در 30 روز گذشته)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          // اینجا می‌توانیم از مدل Bet استفاده کنیم
          break;
        case 'PREMIUM':
          // کاربران پریمیوم (با موجودی بالا)
          whereClause.balance = {
            [require('sequelize').Op.gte]: 1000000 // مثال: موجودی بالای 1 میلیون
          };
          break;
        default:
          throw createError({
            statusCode: 400,
            statusMessage: 'Invalid user group'
          });
      }
      
      const groupUsers = await User.findAll({
        where: whereClause,
        attributes: ['id']
      });
      targetUserIds = groupUsers.map((user: any) => (user as any).id);
    }

    if (targetUserIds.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No target users found'
      });
    }

    // ایجاد اعلان‌ها برای تمام کاربران هدف
    const notifications = await Promise.all(
      targetUserIds.map(userId =>
        Notification.create({
          userId: userId,
          type: type,
          title: title,
          message: message,
          priority: priority,
          actionUrl: actionUrl,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          relatedEntity: relatedEntity,
          isRead: false,
          isArchived: false
        } as any)
      )
    );

    return {
      success: true,
      message: `Notification created successfully for ${notifications.length} users`,
      data: {
        notificationCount: notifications.length,
        targetUsers: targetUserIds.length,
        notification: {
          type: type,
          title: title,
          message: message,
          priority: priority,
          actionUrl: actionUrl,
          expiresAt: expiresAt,
          relatedEntity: relatedEntity
        }
      }
    };

  } catch (error: any) {
    console.error('Error creating notification:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while creating notification'
    });
  }
}); 