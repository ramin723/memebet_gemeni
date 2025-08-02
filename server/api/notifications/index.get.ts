import { defineEventHandler, getQuery, createError } from 'h3';
import { Notification } from '../../models/Notification';
import { User } from '../../models/User';

export default defineEventHandler(async (event) => {
  try {
    // بررسی احراز هویت
    if (!event.context.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    const userId = event.context.user.id;

    // دریافت پارامترهای صفحه‌بندی و فیلتر
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const isRead = query.isRead !== undefined ? query.isRead === 'true' : undefined;
    const isArchived = query.isArchived !== undefined ? query.isArchived === 'true' : false;
    const type = query.type as string;
    const priority = query.priority as string;

    // اعتبارسنجی پارامترها
    if (page < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Page must be greater than 0'
      });
    }

    if (limit < 1 || limit > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Limit must be between 1 and 100'
      });
    }

    // اعتبارسنجی type
    const allowedTypes = ['EVENT_RESOLVED', 'LEVEL_UP', 'NEW_TASK', 'SYSTEM', 'BET_WON', 'BET_LOST', 'COMMENT_REPLY', 'REPORT_RESOLVED'];
    if (type && !allowedTypes.includes(type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid notification type'
      });
    }

    // اعتبارسنجی priority
    const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (priority && !allowedPriorities.includes(priority)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid priority filter'
      });
    }

    // محاسبه offset
    const offset = (page - 1) * limit;

    // ساخت where clause
    const whereClause: any = {
      userId: userId,
      isArchived: isArchived
    };

    if (isRead !== undefined) {
      whereClause.isRead = isRead;
    }

    if (type) {
      whereClause.type = type;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    // دریافت اعلان‌ها با صفحه‌بندی
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'wallet_address']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset
    });

    // محاسبه اطلاعات صفحه‌بندی
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // تبدیل داده‌ها به فرمت مناسب
    const notificationsData = notifications.map((notification: any) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      isArchived: notification.isArchived,
      relatedEntity: notification.relatedEntity,
      actionUrl: notification.actionUrl,
      priority: notification.priority,
      expiresAt: notification.expiresAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      user: {
        id: notification.user.id,
        username: notification.user.username,
        wallet_address: notification.user.wallet_address
      }
    }));

    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data: {
        notifications: notificationsData,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null
        },
        filters: {
          isRead: isRead,
          isArchived: isArchived,
          type: type || null,
          priority: priority || null
        }
      }
    };

  } catch (error: any) {
    console.error('Error retrieving notifications:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while retrieving notifications'
    });
  }
}); 