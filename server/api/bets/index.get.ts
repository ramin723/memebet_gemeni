import { defineEventHandler, createError, getQuery } from '#imports';
import { Bet } from '../../models/Bet';
import { User } from '../../models/User';
import { Event } from '../../models/Event';
import { Outcome } from '../../models/Outcome';

interface BetQuery {
  page?: string;
  pageSize?: string;
  userId?: string;
  eventId?: string;
  status?: string;
}

export default defineEventHandler(async (event) => {
  console.log('🎯 [/api/bets] Fetching bets...');
  
  try {
    const query = getQuery(event) as BetQuery;
    const { 
      page = '1',
      pageSize = '10',
      userId,
      eventId,
      status
    } = query;

    // تنظیم صفحه‌بندی
    const currentPage = parseInt(page) || 1;
    const limit = parseInt(pageSize) || 10;
    const offset = (currentPage - 1) * limit;

    // تنظیم شرط where
    const whereClause: any = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (eventId) {
      whereClause.eventId = eventId;
    }

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

    console.log('🟡 [/api/bets] Executing query with:', {
      whereClause,
      limit,
      offset
    });

    // دریافت تعداد کل رکوردها برای محاسبه صفحه‌بندی
    const totalCount = await Bet.count({ where: whereClause });
    
    // دریافت شرط‌ها
    const bets = await Bet.findAll(betQuery);
    
    console.log('🟢 [/api/bets] Found', bets.length, 'bets out of', totalCount, 'total');

    // محاسبه اطلاعات صفحه‌بندی
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    return { 
      success: true, 
      bets,
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
        eventId,
        status
      }
    };
  } catch (error) {
    console.error('🔴 [/api/bets] Error fetching bets:', error);
    throw createError({
      statusCode: 500,
      message: 'خطا در دریافت لیست شرط‌بندی‌ها.',
    });
  }
}); 