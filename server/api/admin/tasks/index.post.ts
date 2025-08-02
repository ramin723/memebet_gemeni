import { defineEventHandler, readBody, createError } from 'h3';
import { Task } from '../../../models/Task';

export default defineEventHandler(async (event) => {
  try {
    // دریافت داده‌ها از body
    const body = await readBody(event);
    const { 
      title, 
      description, 
      type, 
      rewardAmount, 
      rewardType, 
      conditions, 
      isActive, 
      maxCompletions, 
      levelRequirement 
    } = body;

    // اعتبارسنجی داده‌های ورودی
    if (!title || !type || !rewardAmount || !rewardType) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Title, type, rewardAmount, and rewardType are required'
      });
    }

    // بررسی اعتبار type
    if (!['DAILY', 'LEVEL', 'SPECIAL'].includes(type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid type. Must be DAILY, LEVEL, or SPECIAL'
      });
    }

    // بررسی اعتبار rewardType
    if (!['SPARKS', 'COINS', 'XP'].includes(rewardType)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid rewardType. Must be SPARKS, COINS, or XP'
      });
    }

    // ایجاد تسک جدید
    const task = await Task.create({
      title,
      description,
      type,
      rewardAmount: BigInt(rewardAmount),
      rewardType,
      conditions,
      isActive: isActive !== undefined ? isActive : true,
      maxCompletions,
      levelRequirement
    } as any);

    // بازگرداندن تسک ایجاد شده
    return {
      success: true,
      message: 'Task created successfully',
      data: {
        id: (task as any).id,
        title: (task as any).title,
        description: (task as any).description,
        type: (task as any).type,
        rewardAmount: (task as any).rewardAmount.toString(),
        rewardType: (task as any).rewardType,
        conditions: (task as any).conditions,
        isActive: (task as any).isActive,
        maxCompletions: (task as any).maxCompletions,
        levelRequirement: (task as any).levelRequirement,
        createdAt: (task as any).createdAt
      }
    };

  } catch (error: any) {
    console.error('Error creating task:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while creating task'
    });
  }
}); 