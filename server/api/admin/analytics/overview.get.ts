import { defineEventHandler, createError } from 'h3';
import { User } from '../../../models/User';
import { Event } from '../../../models/Event';
import { Bet } from '../../../models/Bet';
import { Comment } from '../../../models/Comment';
import { Report } from '../../../models/Report';
import { Notification } from '../../../models/Notification';
import { Task } from '../../../models/Task';
import { UserTask } from '../../../models/UserTask';

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

    // دریافت آمار کلی سیستم
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      bannedUsers,
      totalEvents,
      activeEvents,
      resolvedEvents,
      totalBets,
      pendingBets,
      confirmedBets,
      totalComments,
      activeComments,
      deletedComments,
      totalReports,
      pendingReports,
      resolvedReports,
      totalNotifications,
      unreadNotifications,
      totalTasks,
      activeTasks,
      completedTasks
    ] = await Promise.all([
      // آمار کاربران
      User.count(),
      User.count({ where: { status: 'ACTIVE' } }),
      User.count({ where: { status: 'SUSPENDED' } }),
      User.count({ where: { status: 'BANNED' } }),
      
      // آمار رویدادها
      Event.count(),
      Event.count({ where: { status: 'ACTIVE' } }),
      Event.count({ where: { status: 'RESOLVED' } }),
      
      // آمار شرط‌بندی‌ها
      Bet.count(),
      Bet.count({ where: { status: 'PENDING' } }),
      Bet.count({ where: { status: 'CONFIRMED' } }),
      
      // آمار نظرات
      Comment.count(),
      Comment.count({ where: { isDeleted: false } }),
      Comment.count({ where: { isDeleted: true } }),
      
      // آمار گزارش‌ها
      Report.count(),
      Report.count({ where: { status: 'PENDING' } }),
      Report.count({ where: { status: 'RESOLVED' } }),
      
      // آمار اعلان‌ها
      Notification.count(),
      Notification.count({ where: { isRead: false } }),
      
      // آمار وظایف
      Task.count(),
      Task.count({ where: { isActive: true } }),
      UserTask.count({ where: { status: 'COMPLETED' } })
    ]);

    // آمار روزانه (آخرین 7 روز)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      dailyUsers,
      dailyEvents,
      dailyBets,
      dailyComments,
      dailyReports
    ] = await Promise.all([
      // کاربران جدید روزانه
      User.findAll({
        where: {
          createdAt: {
            [require('sequelize').Op.gte]: sevenDaysAgo
          }
        },
        attributes: [
          [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
        order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']],
        raw: true
      }),

      // رویدادهای جدید روزانه
      Event.findAll({
        where: {
          createdAt: {
            [require('sequelize').Op.gte]: sevenDaysAgo
          }
        },
        attributes: [
          [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
        order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']],
        raw: true
      }),

      // شرط‌بندی‌های جدید روزانه
      Bet.findAll({
        where: {
          createdAt: {
            [require('sequelize').Op.gte]: sevenDaysAgo
          }
        },
        attributes: [
          [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
        order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']],
        raw: true
      }),

      // نظرات جدید روزانه
      Comment.findAll({
        where: {
          createdAt: {
            [require('sequelize').Op.gte]: sevenDaysAgo
          }
        },
        attributes: [
          [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
        order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']],
        raw: true
      }),

      // گزارش‌های جدید روزانه
      Report.findAll({
        where: {
          createdAt: {
            [require('sequelize').Op.gte]: sevenDaysAgo
          }
        },
        attributes: [
          [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
        order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']],
        raw: true
      })
    ]);

    // محاسبه درصدها
    const userActivePercentage = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : '0.00';
    const eventActivePercentage = totalEvents > 0 ? ((activeEvents / totalEvents) * 100).toFixed(2) : '0.00';
    const betConfirmedPercentage = totalBets > 0 ? ((confirmedBets / totalBets) * 100).toFixed(2) : '0.00';
    const commentActivePercentage = totalComments > 0 ? ((activeComments / totalComments) * 100).toFixed(2) : '0.00';
    const reportResolvedPercentage = totalReports > 0 ? ((resolvedReports / totalReports) * 100).toFixed(2) : '0.00';

    return {
      success: true,
      message: 'System overview statistics retrieved successfully',
      data: {
        overview: {
          users: {
            total: totalUsers,
            active: activeUsers,
            suspended: suspendedUsers,
            banned: bannedUsers
          },
          events: {
            total: totalEvents,
            active: activeEvents,
            resolved: resolvedEvents
          },
          bets: {
            total: totalBets,
            pending: pendingBets,
            confirmed: confirmedBets
          },
          comments: {
            total: totalComments,
            active: activeComments,
            deleted: deletedComments
          },
          reports: {
            total: totalReports,
            pending: pendingReports,
            resolved: resolvedReports
          },
          notifications: {
            total: totalNotifications,
            unread: unreadNotifications
          },
          tasks: {
            total: totalTasks,
            active: activeTasks,
            completed: completedTasks
          }
        },
        percentages: {
          userActive: userActivePercentage,
          eventActive: eventActivePercentage,
          betConfirmed: betConfirmedPercentage,
          commentActive: commentActivePercentage,
          reportResolved: reportResolvedPercentage
        },
        dailyStats: {
          users: dailyUsers.map((stat: any) => ({
            date: stat.date,
            count: parseInt(stat.count)
          })),
          events: dailyEvents.map((stat: any) => ({
            date: stat.date,
            count: parseInt(stat.count)
          })),
          bets: dailyBets.map((stat: any) => ({
            date: stat.date,
            count: parseInt(stat.count)
          })),
          comments: dailyComments.map((stat: any) => ({
            date: stat.date,
            count: parseInt(stat.count)
          })),
          reports: dailyReports.map((stat: any) => ({
            date: stat.date,
            count: parseInt(stat.count)
          }))
        }
      }
    };

  } catch (error: any) {
    console.error('Error retrieving system overview statistics:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while retrieving system overview statistics'
    });
  }
}); 