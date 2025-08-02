import { defineEventHandler, getQuery, getRouterParam, createError } from 'h3';
import { Comment } from '../../../../models/Comment';
import { Event } from '../../../../models/Event';
import { User } from '../../../../models/User';

export default defineEventHandler(async (event) => {
  try {
    const eventId = getRouterParam(event, 'eventId');

    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      });
    }

    // بررسی وجود رویداد
    const eventRecord = await Event.findByPk(eventId);
    if (!eventRecord) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      });
    }

    // دریافت پارامترهای صفحه‌بندی
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const sort = (query.sort as string) || 'createdAt';
    const order = (query.order as string) || 'DESC';

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

    // بررسی مجاز بودن فیلدهای مرتب‌سازی
    const allowedSortFields = ['createdAt', 'updatedAt'];
    if (!allowedSortFields.includes(sort)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid sort field'
      });
    }

    // بررسی مجاز بودن جهت مرتب‌سازی
    const allowedOrders = ['ASC', 'DESC'];
    if (!allowedOrders.includes(order.toUpperCase())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid order direction'
      });
    }

    // محاسبه offset
    const offset = (page - 1) * limit;

    // دریافت نظرات با صفحه‌بندی
    const { count, rows: comments } = await Comment.findAndCountAll({
      where: {
        eventId: eventId,
        isDeleted: false
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatarUrl', 'wallet_address']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: limit,
      offset: offset
    });

    // محاسبه اطلاعات صفحه‌بندی
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // تبدیل داده‌ها به فرمت مناسب
    const commentsData = comments.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      isEdited: comment.isEdited,
      editedAt: comment.editedAt,
      isDeleted: comment.isDeleted,
      deletedAt: comment.deletedAt,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: {
        id: comment.user.id,
        username: comment.user.username,
        avatarUrl: comment.user.avatarUrl,
        wallet_address: comment.user.wallet_address
      }
    }));

    return {
      success: true,
      message: 'Comments retrieved successfully',
      data: {
        comments: commentsData,
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
        event: {
          id: (eventRecord as any).id,
          title: (eventRecord as any).title,
          status: (eventRecord as any).status
        }
      }
    };

  } catch (error: any) {
    console.error('Error retrieving comments:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while retrieving comments'
    });
  }
}); 