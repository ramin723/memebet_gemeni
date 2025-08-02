import { defineEventHandler, getRouterParam, createError } from 'h3';
import { Notification } from '../../../models/Notification';

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
    const notificationId = getRouterParam(event, 'id');

    if (!notificationId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Notification ID is required'
      });
    }

    // پیدا کردن اعلان
    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId: userId
      }
    });

    if (!notification) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Notification not found'
      });
    }

    // بررسی اینکه آیا اعلان قبلاً آرشیو شده
    if ((notification as any).isArchived) {
      return {
        success: true,
        message: 'Notification is already archived',
        data: {
          id: (notification as any).id,
          isArchived: (notification as any).isArchived,
          updatedAt: (notification as any).updatedAt
        }
      };
    }

    // آرشیو اعلان
    await notification.update({
      isArchived: true
    });

    return {
      success: true,
      message: 'Notification archived successfully',
      data: {
        id: (notification as any).id,
        isArchived: (notification as any).isArchived,
        updatedAt: (notification as any).updatedAt
      }
    };

  } catch (error: any) {
    console.error('Error archiving notification:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while archiving notification'
    });
  }
}); 