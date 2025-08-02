import { defineEventHandler, getQuery, createError } from 'h3';
import { Task } from '../../../models/Task';
import { Op } from 'sequelize';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { 
      type, 
      isActive, 
      page = '1', 
      limit = '20',
      search 
    } = query;

    // ساخت شرایط جستجو
    const where: any = {};
    
    if (type && ['DAILY', 'LEVEL', 'SPECIAL'].includes(type as string)) {
      where.type = type;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    if (search) {
      where.title = {
        [Op.iLike]: `%${search}%`
      };
    }

    // محاسبه offset
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    // دریافت تسک‌ها
    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset
    });

    // تبدیل داده‌ها
    const tasksData = tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      rewardAmount: task.rewardAmount.toString(),
      rewardType: task.rewardType,
      conditions: task.conditions,
      isActive: task.isActive,
      maxCompletions: task.maxCompletions,
      levelRequirement: task.levelRequirement,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
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