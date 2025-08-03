import { defineEventHandler, createError, getQuery } from 'h3';
import { Notification } from '../../../models/Notification';
import { User } from '../../../models/User';
import { Op } from 'sequelize';

export default defineEventHandler(async (event) => {
  try {
    // بررسی احراز هویت و دسترسی ادمین
    if (!event.context.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    const user = event.context.user;
    if ((user as any).role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      });
    }

    // دریافت پارامترهای صفحه‌بندی و فیلتر
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const type = query.type as string;
    const priority = query.priority as string;
    const isRead = query.isRead !== undefined ? query.isRead === 'true' : undefined;
    const search = query.search as string;
    const userId = query.userId as string;
    const sortBy = query.sortBy as string || 'createdAt';
    const sortOrder = query.sortOrder as string || 'DESC';

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

    // اعتبارسنجی sortBy
    const allowedSortFields = ['createdAt', 'updatedAt', 'type', 'priority', 'title'];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid sort field'
      });
    }

    // اعتبارسنجی sortOrder
    if (sortOrder && !['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Sort order must be ASC or DESC'
      });
    }

    // محاسبه offset
    const offset = (page - 1) * limit;

    // ساخت where clause
    const whereClause: any = {};

    if (type) {
      whereClause.type = type;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (isRead !== undefined) {
      whereClause.isRead = isRead;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { message: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // دریافت اعلان‌ها با صفحه‌بندی
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'wallet_address', 'email']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: limit,
      offset: offset
    });

    // محاسبه اطلاعات صفحه‌بندی
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // تبدیل داده‌ها به فرمت مناسب
    const notificationsData = notifications.map((notification: any) => ({
      id: (notification as any).id,
      type: (notification as any).type,
      title: (notification as any).title,
      message: (notification as any).message,
      isRead: (notification as any).isRead,
      isArchived: (notification as any).isArchived,
      relatedEntity: (notification as any).relatedEntity,
      actionUrl: (notification as any).actionUrl,
      priority: (notification as any).priority,
      expiresAt: (notification as any).expiresAt,
      createdAt: (notification as any).createdAt,
      updatedAt: (notification as any).updatedAt,
      user: {
        id: (notification as any).user.id,
        username: (notification as any).user.username,
        wallet_address: (notification as any).user.wallet_address,
        email: (notification as any).user.email
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
          type: type || null,
          priority: priority || null,
          isRead: isRead,
          search: search || null,
          userId: userId || null
        },
        sort: {
          field: sortBy,
          order: sortOrder.toUpperCase()
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