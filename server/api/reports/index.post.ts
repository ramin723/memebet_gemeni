import { defineEventHandler, readBody, createError } from 'h3';
import { Report } from '../../models/Report';
import { Event } from '../../models/Event';
import { Comment } from '../../models/Comment';
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

    // دریافت اطلاعات گزارش از body
    const body = await readBody(event);
    const { entityType, entityId, reason } = body;

    // اعتبارسنجی فیلدهای اجباری
    if (!entityType || !entityId || !reason) {
      throw createError({
        statusCode: 400,
        statusMessage: 'entityType, entityId, and reason are required'
      });
    }

    // بررسی مجاز بودن entityType
    const allowedEntityTypes = ['EVENT', 'COMMENT'];
    if (!allowedEntityTypes.includes(entityType)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'entityType must be either EVENT or COMMENT'
      });
    }

    // اعتبارسنجی reason
    if (typeof reason !== 'string' || reason.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Reason cannot be empty'
      });
    }

    if (reason.length > 1000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Reason cannot exceed 1000 characters'
      });
    }

    // بررسی وجود موجودیت گزارش‌شده
    let entityExists = false;
    
    if (entityType === 'EVENT') {
      const event = await Event.findByPk(entityId);
      entityExists = !!event;
    } else if (entityType === 'COMMENT') {
      const comment = await Comment.findByPk(entityId);
      entityExists = !!comment;
    }

    if (!entityExists) {
      throw createError({
        statusCode: 404,
        statusMessage: `${entityType} not found`
      });
    }

    // بررسی اینکه کاربر قبلاً این موجودیت را گزارش نکرده باشد
    const existingReport = await Report.findOne({
      where: {
        reporterId: userId,
        entityType: entityType,
        entityId: entityId,
        status: ['PENDING', 'REVIEWED'] // فقط گزارش‌های در انتظار یا در حال بررسی
      }
    });

    if (existingReport) {
      throw createError({
        statusCode: 400,
        statusMessage: 'You have already reported this content'
      });
    }

    // ایجاد گزارش جدید
    const report = await Report.create({
      reporterId: userId,
      entityType: entityType,
      entityId: entityId,
      reason: reason.trim(),
      status: 'PENDING'
    } as any);

    // دریافت اطلاعات کامل گزارش با کاربر گزارش‌دهنده
    const reportWithReporter = await Report.findByPk((report as any).id, {
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'username', 'wallet_address']
        }
      ]
    });

    return {
      success: true,
      message: 'Report submitted successfully',
      data: {
        id: (reportWithReporter as any).id,
        entityType: (reportWithReporter as any).entityType,
        entityId: (reportWithReporter as any).entityId,
        reason: (reportWithReporter as any).reason,
        status: (reportWithReporter as any).status,
        adminNote: (reportWithReporter as any).adminNote,
        resolvedBy: (reportWithReporter as any).resolvedBy,
        resolvedAt: (reportWithReporter as any).resolvedAt,
        createdAt: (reportWithReporter as any).createdAt,
        updatedAt: (reportWithReporter as any).updatedAt,
        reporter: {
          id: (reportWithReporter as any).reporter.id,
          username: (reportWithReporter as any).reporter.username,
          wallet_address: (reportWithReporter as any).reporter.wallet_address
        }
      }
    };

  } catch (error: any) {
    console.error('Error creating report:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while creating report'
    });
  }
}); 