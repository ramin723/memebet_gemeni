import { defineEventHandler, readBody, getRouterParam, createError } from 'h3';
import { Comment } from '../../../../models/Comment';
import { Event } from '../../../../models/Event';
import { User } from '../../../../models/User';

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
    const eventId = getRouterParam(event, 'eventId');

    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      });
    }

    // دریافت محتوای نظر از body
    const body = await readBody(event);
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Comment content is required and cannot be empty'
      });
    }

    // بررسی طول نظر
    if (content.length > 1000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Comment content cannot exceed 1000 characters'
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

    // بررسی اینکه رویداد فعال است
    if ((eventRecord as any).status !== 'ACTIVE') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot comment on inactive event'
      });
    }

    // بررسی اینکه مهلت شرط‌بندی نگذشته باشد
    const now = new Date();
    const bettingDeadline = new Date((eventRecord as any).bettingDeadline);
    if (now > bettingDeadline) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot comment on closed event'
      });
    }

    // ایجاد نظر جدید
    const comment = await Comment.create({
      userId: userId,
      eventId: eventId,
      content: content.trim(),
      isEdited: false,
      isDeleted: false
    } as any);

    // دریافت اطلاعات کامل نظر با کاربر
    const commentWithUser = await Comment.findByPk((comment as any).id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatarUrl', 'wallet_address']
        }
      ]
    });

    return {
      success: true,
      message: 'Comment created successfully',
      data: {
        id: (commentWithUser as any).id,
        content: (commentWithUser as any).content,
        isEdited: (commentWithUser as any).isEdited,
        editedAt: (commentWithUser as any).editedAt,
        isDeleted: (commentWithUser as any).isDeleted,
        deletedAt: (commentWithUser as any).deletedAt,
        createdAt: (commentWithUser as any).createdAt,
        updatedAt: (commentWithUser as any).updatedAt,
        user: {
          id: (commentWithUser as any).user.id,
          username: (commentWithUser as any).user.username,
          avatarUrl: (commentWithUser as any).user.avatarUrl,
          wallet_address: (commentWithUser as any).user.wallet_address
        }
      }
    };

  } catch (error: any) {
    console.error('Error creating comment:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while creating comment'
    });
  }
}); 