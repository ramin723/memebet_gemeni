import { defineEventHandler, readBody, getRouterParam, createError } from 'h3';
import { Comment } from '../../../../models/Comment';
import { User } from '../../../../models/User';
import { Event } from '../../../../models/Event';

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

    const commentId = getRouterParam(event, 'id');
    if (!commentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Comment ID is required'
      });
    }

    // دریافت body
    const body = await readBody(event);
    const { action, content, adminNote } = body;

    // اعتبارسنجی action
    const allowedActions = ['EDIT', 'DELETE', 'RESTORE'];
    if (!action || !allowedActions.includes(action)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid action is required (EDIT, DELETE, RESTORE)'
      });
    }

    // پیدا کردن نظر
    const comment = await Comment.findByPk(commentId, {
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
      ]
    });

    if (!comment) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Comment not found'
      });
    }

    // بررسی اینکه آیا نظر قبلاً حذف شده
    if ((comment as any).isDeleted && action !== 'RESTORE') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Comment is already deleted'
      });
    }

    // انجام عملیات بر اساس action
    let updateData: any = {};

    switch (action) {
      case 'EDIT':
        if (!content) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Content is required for editing'
          });
        }
        updateData = {
          content: content.trim(),
          isEdited: true,
          editedAt: new Date()
        };
        break;

      case 'DELETE':
        updateData = {
          isDeleted: true,
          deletedAt: new Date()
        };
        break;

      case 'RESTORE':
        updateData = {
          isDeleted: false,
          deletedAt: null
        };
        break;
    }

    // اضافه کردن یادداشت ادمین اگر وجود داشته باشد
    if (adminNote) {
      updateData.adminNote = adminNote;
    }

    // به‌روزرسانی نظر
    await comment.update(updateData);

    // دریافت نظر به‌روزرسانی شده
    const updatedComment = await Comment.findByPk(commentId, {
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
      ]
    });

    return {
      success: true,
      message: `Comment ${action.toLowerCase()}d successfully`,
      data: {
        id: (updatedComment as any).id,
        content: (updatedComment as any).content,
        isEdited: (updatedComment as any).isEdited,
        editedAt: (updatedComment as any).editedAt,
        isDeleted: (updatedComment as any).isDeleted,
        deletedAt: (updatedComment as any).deletedAt,
        adminNote: (updatedComment as any).adminNote,
        createdAt: (updatedComment as any).createdAt,
        updatedAt: (updatedComment as any).updatedAt,
        user: {
          id: (updatedComment as any).user.id,
          username: (updatedComment as any).user.username,
          wallet_address: (updatedComment as any).user.wallet_address,
          email: (updatedComment as any).user.email
        },
        event: {
          id: (updatedComment as any).event.id,
          title: (updatedComment as any).event.title,
          description: (updatedComment as any).event.description,
          status: (updatedComment as any).event.status
        },
        action: action
      }
    };

  } catch (error: any) {
    console.error('Error moderating comment:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while moderating comment'
    });
  }
}); 