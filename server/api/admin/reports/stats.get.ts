import { defineEventHandler, createError } from 'h3';
import { Report } from '../../../models/Report';
import { Op, fn, col } from 'sequelize';

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

    // دریافت آمار کلی گزارش‌ها
    const [
      totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
      eventReports,
      commentReports
    ] = await Promise.all([
      // کل گزارش‌ها
      Report.count(),
      // گزارش‌های در انتظار
      Report.count({
        where: { status: 'PENDING' }
      }),
      // گزارش‌های حل شده
      Report.count({
        where: { status: 'RESOLVED' }
      }),
      // گزارش‌های رد شده
      Report.count({
        where: { status: 'DISMISSED' }
      }),
      // گزارش‌های رویدادها
      Report.count({
        where: { entityType: 'EVENT' }
      }),
      // گزارش‌های نظرات
      Report.count({
        where: { entityType: 'COMMENT' }
      })
    ]);

    // آمار بر اساس دلیل گزارش
    const reasonStats = await Report.findAll({
      attributes: [
        'reason',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['reason'],
      raw: true
    });

    // آمار بر اساس وضعیت
    const statusStats = await Report.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // آمار بر اساس نوع موجودیت
    const entityTypeStats = await Report.findAll({
      attributes: [
        'entityType',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['entityType'],
      raw: true
    });

    // آمار روزانه (آخرین 30 روز)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await Report.findAll({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true
    });

    // محاسبه درصدها
    const total = totalReports;
    const pendingPercentage = total > 0 ? ((pendingReports / total) * 100).toFixed(2) : '0.00';
    const resolvedPercentage = total > 0 ? ((resolvedReports / total) * 100).toFixed(2) : '0.00';
    const dismissedPercentage = total > 0 ? ((dismissedReports / total) * 100).toFixed(2) : '0.00';

    return {
      success: true,
      message: 'Report statistics retrieved successfully',
      data: {
        overview: {
          total: totalReports,
          pending: pendingReports,
          resolved: resolvedReports,
          dismissed: dismissedReports,
          eventReports: eventReports,
          commentReports: commentReports
        },
        percentages: {
          pending: pendingPercentage,
          resolved: resolvedPercentage,
          dismissed: dismissedPercentage
        },
        byReason: reasonStats.reduce((acc: any, stat: any) => {
          acc[stat.reason] = parseInt(stat.count);
          return acc;
        }, {}),
        byStatus: statusStats.reduce((acc: any, stat: any) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {}),
        byEntityType: entityTypeStats.reduce((acc: any, stat: any) => {
          acc[stat.entityType] = parseInt(stat.count);
          return acc;
        }, {}),
        dailyStats: dailyStats.map((stat: any) => ({
          date: stat.date,
          count: parseInt(stat.count)
        }))
      }
    };

  } catch (error: any) {
    console.error('Error retrieving report statistics:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while retrieving report statistics'
    });
  }
}); 