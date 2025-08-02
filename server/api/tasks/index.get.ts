import { defineEventHandler, getQuery, createError } from 'h3';
import { Task } from '../../models/Task';
import { UserTask } from '../../models/UserTask';
import { User } from '../../models/User';
import { Op } from 'sequelize';

export default defineEventHandler(async (event) => {
  try {
    // بررسی وجود کاربر
    if (!event.context.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    const userId = event.context.user.id;
    const query = getQuery(event);
    const { type, page = '1', limit = '20' } = query;

    // دریافت اطلاعات کاربر
    const user = await User.findByPk(userId);
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      });
    }

    // ساخت شرایط جستجو برای تسک‌های فعال
    const where: any = {
      isActive: true
    };
    
    if (type && ['DAILY', 'LEVEL', 'SPECIAL'].includes(type as string)) {
      where.type = type;
    }

    // محاسبه offset
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    // دریافت تسک‌های فعال
    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset
    });

    // دریافت وضعیت تسک‌های کاربر
    const userTasks = await UserTask.findAll({
      where: {
        userId: userId
      },
      include: [{
        model: Task,
        as: 'task'
      }]
    });

    // تبدیل داده‌ها و اضافه کردن اطلاعات وضعیت
    const tasksData = await Promise.all(tasks.map(async (task: any) => {
      // پیدا کردن وضعیت این تسک برای کاربر
      const userTask = userTasks.find(ut => (ut as any).taskId === task.id);
      
      // بررسی اینکه آیا کاربر سطح مورد نیاز را دارد
      const hasLevelRequirement = !task.levelRequirement || 
        (user as any).level >= task.levelRequirement;

      // بررسی اینکه آیا کاربر قبلاً این تسک را تکمیل کرده
      const isCompleted = userTask && (userTask as any).status === 'COMPLETED';
      
      // بررسی اینکه آیا کاربر قبلاً پاداش را دریافت کرده
      const isRewardClaimed = userTask && (userTask as any).rewardClaimed;

      // بررسی اینکه آیا کاربر می‌تواند این تسک را انجام دهد
      const canComplete = hasLevelRequirement && !isCompleted;

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        rewardAmount: task.rewardAmount.toString(),
        rewardType: task.rewardType,
        conditions: task.conditions,
        levelRequirement: task.levelRequirement,
        maxCompletions: task.maxCompletions,
        createdAt: task.createdAt,
        userStatus: {
          isCompleted,
          isRewardClaimed,
          canComplete,
          hasLevelRequirement,
          progress: userTask ? (userTask as any).progress : null,
          completedAt: userTask ? (userTask as any).completedAt : null,
          rewardClaimedAt: userTask ? (userTask as any).rewardClaimedAt : null
        }
      };
    }));

    return {
      success: true,
      data: {
        tasks: tasksData,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages: Math.ceil(count / limitNum)
        },
        userInfo: {
          level: (user as any).level || 1,
          wallet_address: (user as any).wallet_address
        }
      }
    };

  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while fetching tasks'
    });
  }
}); 