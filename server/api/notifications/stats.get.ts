import { defineEventHandler, createError } from 'h3';
import { Notification } from '../../models/Notification';

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

    // دریافت آمار اعلان‌ها
    const [
      totalNotifications,
      unreadNotifications,
      archivedNotifications,
      highPriorityNotifications,
      urgentNotifications
    ] = await Promise.all([
      // کل اعلان‌ها
      Notification.count({
        where: { userId: userId }
      }),
      // اعلان‌های نخوانده
      Notification.count({
        where: { 
          userId: userId, 
          isRead: false, 
          isArchived: false 
        }
      }),
      // اعلان‌های آرشیو شده
      Notification.count({
        where: { 
          userId: userId, 
          isArchived: true 
        }
      }),
      // اعلان‌های با اولویت بالا
      Notification.count({
        where: { 
          userId: userId, 
          priority: 'HIGH',
          isArchived: false 
        }
      }),
      // اعلان‌های فوری
      Notification.count({
        where: { 
          userId: userId, 
          priority: 'URGENT',
          isArchived: false 
        }
      })
    ]);

    // آمار بر اساس نوع اعلان
    const typeStats = await Notification.findAll({
      where: { 
        userId: userId, 
        isArchived: false 
      },
      attributes: [
        'type',
        [Notification.sequelize.fn('COUNT', Notification.sequelize.col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    });

    // آمار بر اساس اولویت
    const priorityStats = await Notification.findAll({
      where: { 
        userId: userId, 
        isArchived: false 
      },
      attributes: [
        'priority',
        [Notification.sequelize.fn('COUNT', Notification.sequelize.col('id')), 'count']
      ],
      group: ['priority'],
      raw: true
    });

    return {
      success: true,
      message: 'Notification statistics retrieved successfully',
      data: {
        total: totalNotifications,
        unread: unreadNotifications,
        archived: archivedNotifications,
        highPriority: highPriorityNotifications,
        urgent: urgentNotifications,
        byType: typeStats.reduce((acc: any, stat: any) => {
          acc[stat.type] = parseInt(stat.count);
          return acc;
        }, {}),
        byPriority: priorityStats.reduce((acc: any, stat: any) => {
          acc[stat.priority] = parseInt(stat.count);
          return acc;
        }, {})
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