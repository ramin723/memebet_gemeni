import { defineEventHandler, readBody, getRouterParam, createError } from 'h3';
import { Report } from '../../../../models/Report';
import { User } from '../../../../models/User';
import { Event } from '../../../../models/Event';
import { Comment } from '../../../../models/Comment';

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

    const reportId = getRouterParam(event, 'id');
    if (!reportId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Report ID is required'
      });
    }

    // دریافت body
    const body = await readBody(event);
    const { status, adminNote, action } = body;

    // اعتبارسنجی status
    const allowedStatuses = ['RESOLVED', 'DISMISSED'];
    if (!status || !allowedStatuses.includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid status is required (RESOLVED or DISMISSED)'
      });
    }

    // پیدا کردن گزارش
    const report = await Report.findByPk(reportId, {
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'username', 'wallet_address', 'email']
        }
      ]
    });

    if (!report) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Report not found'
      });
    }

    // بررسی اینکه آیا گزارش قبلاً بررسی شده
    if ((report as any).status !== 'PENDING') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Report has already been reviewed'
      });
    }

    // انجام اقدامات خودکار بر اساس action
    let actionResult = null;
    if (action) {
      actionResult = await performAction(action, (report as any).entityType, (report as any).entityId, adminUser);
    }

    // به‌روزرسانی گزارش
    const updateData: any = {
      status: status,
      resolvedBy: (adminUser as any).id,
      resolvedAt: new Date()
    };

    if (adminNote) {
      updateData.adminNote = adminNote;
    }

    await report.update(updateData);

    // دریافت گزارش به‌روزرسانی شده با اطلاعات کامل
    const updatedReport = await Report.findByPk(reportId, {
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'username', 'wallet_address', 'email']
        },
        {
          model: User,
          as: 'resolver',
          attributes: ['id', 'username', 'wallet_address']
        }
      ]
    });

    return {
      success: true,
      message: `Report ${status.toLowerCase()} successfully`,
      data: {
        id: (updatedReport as any).id,
        entityType: (updatedReport as any).entityType,
        entityId: (updatedReport as any).entityId,
        reason: (updatedReport as any).reason,
        status: (updatedReport as any).status,
        adminNote: (updatedReport as any).adminNote,
        reporter: {
          id: (updatedReport as any).reporter.id,
          username: (updatedReport as any).reporter.username,
          wallet_address: (updatedReport as any).reporter.wallet_address,
          email: (updatedReport as any).reporter.email
        },
        resolver: {
          id: (updatedReport as any).resolver.id,
          username: (updatedReport as any).resolver.username,
          wallet_address: (updatedReport as any).resolver.wallet_address
        },
        resolvedAt: (updatedReport as any).resolvedAt,
        actionResult: actionResult
      }
    };

  } catch (error: any) {
    console.error('Error reviewing report:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while reviewing report'
    });
  }
});

// تابع انجام اقدامات خودکار
async function performAction(action: string, entityType: string, entityId: string, adminUser: any) {
  try {
    switch (action) {
      case 'DELETE_EVENT':
        if (entityType === 'EVENT') {
          const event = await Event.findByPk(entityId);
                  if (event) {
          await event.update({ status: 'DELETED' as any });
          return { action: 'DELETE_EVENT', success: true, message: 'Event marked as deleted' };
        }
        }
        break;

      case 'DELETE_COMMENT':
        if (entityType === 'COMMENT') {
          const comment = await Comment.findByPk(entityId);
          if (comment) {
            await comment.update({ isDeleted: true, deletedAt: new Date() });
            return { action: 'DELETE_COMMENT', success: true, message: 'Comment marked as deleted' };
          }
        }
        break;

      case 'SUSPEND_USER':
        // پیدا کردن کاربر از طریق reporter
        const report = await Report.findOne({
          where: { entityType, entityId },
          include: [{ model: User, as: 'reporter' }]
        });
        
        if (report && (report as any).reporter) {
          const user = await User.findByPk((report as any).reporter.id);
          if (user) {
            await user.update({ status: 'SUSPENDED' });
            return { action: 'SUSPEND_USER', success: true, message: 'User suspended' };
          }
        }
        break;

      default:
        return { action, success: false, message: 'Unknown action' };
    }
  } catch (error) {
    console.error('Error performing action:', error);
    return { action, success: false, message: 'Action failed' };
  }
} 