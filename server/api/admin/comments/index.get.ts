import { defineEventHandler, getQuery, createError } from 'h3';
import { Comment } from '../../../models/Comment';
import { User } from '../../../models/User';
import { Event } from '../../../models/Event';

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
    const eventId = query.eventId as string;
    const userId = query.userId as string;
    const isDeleted = query.isDeleted !== undefined ? query.isDeleted === 'true' : undefined;
    const isEdited = query.isEdited !== undefined ? query.isEdited === 'true' : undefined;
    const search = query.search as string;
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

    // اعتبارسنجی sortBy
    const allowedSortFields = ['createdAt', 'updatedAt', 'content', 'userId', 'eventId'];
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

    if (eventId) {
      whereClause.eventId = eventId;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (isDeleted !== undefined) {
      whereClause.isDeleted = isDeleted;
    }

    if (isEdited !== undefined) {
      whereClause.isEdited = isEdited;
    }

    if (search) {
      whereClause.content = {
        [require('sequelize').Op.iLike]: `%${search}%`
      };
    }

    // دریافت نظرات با صفحه‌بندی
    const { count, rows: comments } = await Comment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'wallet_address', 'email']
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'description', 'status']
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
    const commentsData = comments.map((comment: any) => ({
      id: (comment as any).id,
      content: (comment as any).content,
      isEdited: (comment as any).isEdited,
      editedAt: (comment as any).editedAt,
      isDeleted: (comment as any).isDeleted,
      deletedAt: (comment as any).deletedAt,
      createdAt: (comment as any).createdAt,
      updatedAt: (comment as any).updatedAt,
      user: {
        id: (comment as any).user.id,
        username: (comment as any).user.username,
        wallet_address: (comment as any).user.wallet_address,
        email: (comment as any).user.email
      },
      event: {
        id: (comment as any).event.id,
        title: (comment as any).event.title,
        description: (comment as any).event.description,
        status: (comment as any).event.status
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
        filters: {
          eventId: eventId || null,
          userId: userId || null,
          isDeleted: isDeleted,
          isEdited: isEdited,
          search: search || null
        },
        sort: {
          field: sortBy,
          order: sortOrder.toUpperCase()
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