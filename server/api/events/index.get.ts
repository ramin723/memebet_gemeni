import { Op } from 'sequelize';
import { Event } from '../../models/Event';
import { Outcome } from '../../models/Outcome';
import { User } from '../../models/User';
import { defineEventHandler, createError, getQuery } from '#imports';

interface EventQuery {
  sort?: 'newest' | 'deadline' | 'popular';
  all?: boolean;
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'CLOSED' | 'RESOLVED' | 'CANCELLED';
  creatorId?: number;
  search?: string;
  from_date?: string;
  to_date?: string;
  featured_only?: string;
  include_expired?: string;
  page?: string;
  pageSize?: string;
}

export default defineEventHandler(async (event) => {
  console.log('🔵 [/api/events] Fetching events...');
  const query = getQuery(event) as EventQuery;
  const { 
    sort, 
    all, 
    status,
    creatorId,
    search,
    from_date,
    to_date,
    featured_only,
    include_expired,
    page = '1',
    pageSize = '10'
  } = query;

  try {
    // تنظیم صفحه‌بندی
    const currentPage = parseInt(page) || 1;
    const limit = parseInt(pageSize) || 10;
    const offset = (currentPage - 1) * limit;

    // تنظیم شرط where
    const whereClause: any = {};

    // فیلتر وضعیت - پیش‌فرض ACTIVE
    if (status) {
      whereClause.status = status;
    } else if (!all) {
      // اگر all=true نیامده باشد و status هم مشخص نشده، فقط رویدادهای ACTIVE را نمایش بده
      whereClause.status = 'ACTIVE';
    }

    // فیلتر سازنده
    if (creatorId) {
      whereClause.creatorId = creatorId;
    }

    // فیلتر رویدادهای ویژه
    if (featured_only === 'true') {
      whereClause.isFeatured = true;
    }

    // جستجو در عنوان و توضیحات
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // فیلتر تاریخ
    if (from_date || to_date) {
      whereClause[Op.and] = [];
      
      if (from_date) {
        whereClause[Op.and].push({ bettingDeadline: { [Op.gte]: new Date(from_date) } });
      }
      
      if (to_date) {
        whereClause[Op.and].push({ bettingDeadline: { [Op.lte]: new Date(to_date) } });
      }
    }

    // فیلتر رویدادهای منقضی نشده
    if (include_expired !== 'true') {
      if (!whereClause[Op.and]) {
        whereClause[Op.and] = [];
      }
      whereClause[Op.and].push({ bettingDeadline: { [Op.gt]: new Date() } });
    }

    // تنظیم مرتب‌سازی
    let order: [string, string][] = [['bettingDeadline', 'ASC']];

    if (sort === 'newest') {
      order = [['createdAt', 'DESC']];
    } else if (sort === 'deadline') {
      order = [['bettingDeadline', 'ASC']];
    } else if (sort === 'popular') {
      // برای popular، می‌توانیم بر اساس تعداد outcomes مرتب کنیم
      order = [['createdAt', 'DESC']]; // فعلاً بر اساس تاریخ ایجاد
    }

    // تنظیم query نهایی
    const eventQuery = {
      where: whereClause,
      order,
      limit,
      offset,
      include: [
        {
          model: Outcome,
          as: 'outcomes',
          attributes: ['id', 'title', 'totalAmount', 'totalBets', 'isWinner'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'wallet_address', 'username'],
        }
      ],
    };

    console.log('🟡 [/api/events] Executing query with:', {
      whereClause,
      order,
      limit,
      offset
    });

    // دریافت تعداد کل رکوردها برای محاسبه صفحه‌بندی
    const totalCount = await Event.count({ where: whereClause });
    
    // دریافت رویدادها
    const events = await Event.findAll(eventQuery);
    
    console.log('🟢 [/api/events] Found', events.length, 'events out of', totalCount, 'total');

    // تبدیل به آبجکت‌های ساده
    const plainEvents = events.map(event => event.get({ plain: true }));

    // محاسبه اطلاعات صفحه‌بندی
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    return { 
      success: true, 
      events: plainEvents,
      pagination: {
        currentPage,
        pageSize: limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        status,
        creatorId,
        search,
        from_date,
        to_date,
        featured_only,
        include_expired,
        sort
      }
    };
  } catch (error) {
    console.error('🔴 [/api/events] Error fetching events:', error);
    throw createError({
      statusCode: 500,
      message: 'خطا در دریافت لیست رویدادها.',
    });
  }
}); 