import { defineEventHandler, getRouterParam, createError } from 'h3';
import { Task } from '../../../models/Task';
import { UserTask } from '../../../models/UserTask';
import { User } from '../../../models/User';
import { Bet } from '../../../models/Bet';
import { Event } from '../../../models/Event';
import { Transaction } from '../../../models/Transaction';
import { WalletHistory } from '../../../models/WalletHistory';
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
    const taskId = getRouterParam(event, 'id');

    if (!taskId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Task ID is required'
      });
    }

    // دریافت اطلاعات کاربر
    const user = await User.findByPk(userId);
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      });
    }

    // دریافت اطلاعات تسک
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Task not found'
      });
    }

    // بررسی اینکه تسک فعال است
    if (!(task as any).isActive) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Task is not active'
      });
    }

    // بررسی سطح مورد نیاز
    if ((task as any).levelRequirement && (user as any).level < (task as any).levelRequirement) {
      throw createError({
        statusCode: 403,
        statusMessage: `Level ${(task as any).levelRequirement} required to complete this task`
      });
    }

    // پیدا کردن یا ایجاد UserTask
    let userTask = await UserTask.findOne({
      where: {
        userId: userId,
        taskId: taskId
      }
    });

    if (!userTask) {
      userTask = await UserTask.create({
        userId: userId,
        taskId: taskId,
        status: 'IN_PROGRESS',
        progress: {}
      });
    }

    // بررسی اینکه آیا قبلاً پاداش دریافت شده
    if ((userTask as any).rewardClaimed) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Reward already claimed for this task'
      });
    }

    // بررسی اینکه آیا تسک قبلاً تکمیل شده
    if ((userTask as any).status === 'COMPLETED') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Task already completed'
      });
    }

    // بررسی شرایط تسک
    const conditions = (task as any).conditions;
    let conditionsMet = true;
    let progress = (userTask as any).progress || {};

    if (conditions) {
      // بررسی شرایط مختلف بر اساس نوع تسک
      if (conditions.minBets) {
        const betCount = await Bet.count({
          where: {
            userId: userId,
            status: 'PENDING'
          }
        });
        
        progress.betCount = betCount;
        conditionsMet = conditionsMet && betCount >= conditions.minBets;
      }

      if (conditions.minBetAmount) {
        const totalBetAmount = await Bet.sum('amount', {
          where: {
            userId: userId,
            status: 'PENDING'
          }
        });
        
        progress.totalBetAmount = totalBetAmount || 0;
        conditionsMet = conditionsMet && (totalBetAmount || 0) >= conditions.minBetAmount;
      }

      if (conditions.minEvents) {
        const eventCount = await Event.count({
          where: {
            creatorId: userId,
            status: 'ACTIVE'
          }
        });
        
        progress.eventCount = eventCount;
        conditionsMet = conditionsMet && eventCount >= conditions.minEvents;
      }

      if (conditions.dailyBets) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dailyBetCount = await Bet.count({
          where: {
            userId: userId,
            status: 'PENDING',
            createdAt: {
              [Op.gte]: today
            }
          }
        });
        
        progress.dailyBetCount = dailyBetCount;
        conditionsMet = conditionsMet && dailyBetCount >= conditions.dailyBets;
      }
    }

    // اگر شرایط برآورده نشده
    if (!conditionsMet) {
      // به‌روزرسانی پیشرفت
      await userTask.update({
        progress: progress
      });

      throw createError({
        statusCode: 400,
        statusMessage: 'Task conditions not met',
        data: {
          progress: progress,
          conditions: conditions
        }
      });
    }

    // تکمیل تسک و اعطای پاداش
    const rewardAmount = BigInt((task as any).rewardAmount);
    const rewardType = (task as any).rewardType;

    // به‌روزرسانی موجودی کاربر
    let newBalance = BigInt((user as any).balance);
    
    if (rewardType === 'SPARKS') {
      newBalance += rewardAmount;
    } else if (rewardType === 'COINS') {
      // اگر سیستم کوین جداگانه داریم
      newBalance += rewardAmount;
    }
    // XP نیازی به تغییر موجودی ندارد

    await user.update({
      balance: newBalance.toString()
    });

    // ایجاد تراکنش
    await Transaction.create({
      userId: userId,
      type: 'DEPOSIT' as any, // TASK_REWARD
      amount: rewardAmount.toString(),
      description: `Task reward: ${(task as any).title}`,
      status: 'CONFIRMED' as any, // COMPLETED
      walletAddress: (user as any).wallet_address
    });

    // ایجاد رکورد wallet history
    await WalletHistory.create({
      userId: userId,
      type: 'DEPOSIT' as any, // TASK_REWARD
      amount: rewardAmount.toString(),
      description: `Task reward: ${(task as any).title}`,
      balanceBefore: BigInt((user as any).balance).toString(),
      balanceAfter: newBalance.toString()
    });

    // به‌روزرسانی وضعیت UserTask
    await userTask.update({
      status: 'COMPLETED',
      completedAt: new Date(),
      rewardClaimed: true,
      rewardClaimedAt: new Date(),
      progress: progress
    });

    return {
      success: true,
      message: 'Task completed and reward claimed successfully',
      data: {
        taskId: taskId,
        taskTitle: (task as any).title,
        rewardAmount: rewardAmount.toString(),
        rewardType: rewardType,
        newBalance: newBalance.toString(),
        completedAt: new Date()
      }
    };

  } catch (error: any) {
    console.error('Error claiming task reward:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while claiming task reward'
    });
  }
}); 