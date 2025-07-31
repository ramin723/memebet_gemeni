import { defineEventHandler, createError, getQuery } from '#imports';
import { Bet } from '../../../../models/Bet';
import { User } from '../../../../models/User';
import { Event } from '../../../../models/Event';
import { Outcome } from '../../../../models/Outcome';

interface UserBetQuery {
  page?: string;
  pageSize?: string;
  status?: string;
}

export default defineEventHandler(async (event) => {
  console.log('🎯 [/api/bets/user/[id]] Fetching user bets...');
  
  const userId = event.context.params?.id;

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'شناسه کاربر نامعتبر است.',
    });
  }

  try {
    const query = getQuery(event) as UserBetQuery;
    const { 
      page = '1',
      pageSize = '10',
      status
    } = query;

    // تنظیم صفحه‌بندی
    const currentPage = parseInt(page) || 1;
    const limit = parseInt(pageSize) || 10;
    const offset = (currentPage - 1) * limit;

    // تنظیم شرط where
    const whereClause: any = {
      userId: userId
    };

    if (status) {
      whereClause.status = status;
    }

    // تنظیم query نهایی
    const betQuery = {
      where: whereClause,
      order: [['createdAt', 'DESC']] as any,
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'wallet_address', 'username'],
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'status', 'bettingDeadline'],
        },
        {
          model: Outcome,
          as: 'outcome',
          attributes: ['id', 'title', 'totalAmount', 'totalBets'],
        }
      ],
    };

    console.log('🟡 [/api/bets/user/[id]] Executing query with:', {
      userId,
      whereClause,
      limit,
      offset
    });

    // دریافت تعداد کل رکوردها برای محاسبه صفحه‌بندی
    const totalCount = await Bet.count({ where: whereClause });
    
    // دریافت شرط‌های کاربر
    const userBets = await Bet.findAll(betQuery);
    
    console.log('🟢 [/api/bets/user/[id]] Found', userBets.length, 'bets out of', totalCount, 'total');

    // محاسبه اطلاعات صفحه‌بندی
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    return { 
      success: true, 
      bets: userBets,
      pagination: {
        currentPage,
        pageSize: limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        userId,
        status
      }
    };
  } catch (error) {
    console.error('🔴 [/api/bets/user/[id]] Error fetching user bets:', error);
    throw createError({
      statusCode: 500,
      message: 'خطا در دریافت شرط‌بندی‌های کاربر.',
    });
  }
}); 