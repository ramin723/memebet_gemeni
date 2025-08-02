import { defineEventHandler, createError } from 'h3';
import { Notification } from '../../../models/Notification';

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

    // دریافت آمار کلی اعلان‌ها
    const [
      totalNotifications,
      readNotifications,
      unreadNotifications,
      archivedNotifications,
      urgentNotifications,
      highPriorityNotifications
    ] = await Promise.all([
      // کل اعلان‌ها
      Notification.count(),
      // اعلان‌های خوانده شده
      Notification.count({
        where: { isRead: true }
      }),
      // اعلان‌های نخوانده
      Notification.count({
        where: { isRead: false }
      }),
      // اعلان‌های آرشیو شده
      Notification.count({
        where: { isArchived: true }
      }),
      // اعلان‌های فوری
      Notification.count({
        where: { priority: 'URGENT' }
      }),
      // اعلان‌های با اولویت بالا
      Notification.count({
        where: { priority: 'HIGH' }
      })
    ]);

    // آمار بر اساس نوع اعلان
    const typeStats = await Notification.findAll({
      attributes: [
        'type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    });

    // آمار بر اساس اولویت
    const priorityStats = await Notification.findAll({
      attributes: [
        'priority',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['priority'],
      raw: true
    });

    // آمار بر اساس کاربران (کاربرانی که بیشترین اعلان را دارند)
    const userStats = await Notification.findAll({
      attributes: [
        'userId',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['userId'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // آمار روزانه (آخرین 30 روز)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await Notification.findAll({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: thirtyDaysAgo
        }
      },
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
      order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']],
      raw: true
    });

    // محاسبه درصدها
    const total = totalNotifications;
    const readPercentage = total > 0 ? ((readNotifications / total) * 100).toFixed(2) : '0.00';
    const unreadPercentage = total > 0 ? ((unreadNotifications / total) * 100).toFixed(2) : '0.00';
    const archivedPercentage = total > 0 ? ((archivedNotifications / total) * 100).toFixed(2) : '0.00';

    return {
      success: true,
      message: 'Notification statistics retrieved successfully',
      data: {
        overview: {
          total: totalNotifications,
          read: readNotifications,
          unread: unreadNotifications,
          archived: archivedNotifications,
          urgent: urgentNotifications,
          highPriority: highPriorityNotifications
        },
        percentages: {
          read: readPercentage,
          unread: unreadPercentage,
          archived: archivedPercentage
        },
        byType: typeStats.reduce((acc: any, stat: any) => {
          acc[stat.type] = parseInt(stat.count);
          return acc;
        }, {}),
        byPriority: priorityStats.reduce((acc: any, stat: any) => {
          acc[stat.priority] = parseInt(stat.count);
          return acc;
        }, {}),
        topUsers: userStats.map((stat: any) => ({
          userId: stat.userId,
          count: parseInt(stat.count)
        })),
        dailyStats: dailyStats.map((stat: any) => ({
          date: stat.date,
          count: parseInt(stat.count)
        }))
      }
    };

  } catch (error: any) {
    console.error('Error retrieving notification statistics:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while retrieving notification statistics'
    });
  }
}); 