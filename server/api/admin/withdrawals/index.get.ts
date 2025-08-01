import { defineEventHandler, createError, getQuery } from 'h3';
import { Op } from 'sequelize';
import adminMiddleware from '../../../middleware/02.admin';
import { Transaction } from '../../../models/Transaction';
import { User } from '../../../models/User';

export default defineEventHandler(async (event) => {
  await adminMiddleware(event);

  try {
    const query = getQuery(event);

    // --- پارامترهای پیشرفته ---
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const status = query.status as string || 'PENDING';
    const searchQuery = query.search as string;
    const sortBy = query.sortBy as string || 'createdAt';
    const sortOrder = query.sortOrder as string || 'DESC';

    const whereClause: any = {
      type: 'WITHDRAWAL', // <<-- تنها تفاوت اینجاست
      status: status
    };

    // فیلتر جستجو (نام کاربری یا آدرس کیف پول)
    if (searchQuery) {
      whereClause[Op.or] = [
        { '$user.username$': { [Op.iLike]: `%${searchQuery}%` } },
        { '$user.wallet_address$': { [Op.iLike]: `%${searchQuery}%` } }
      ];
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'wallet_address'],
        required: true // از INNER JOIN استفاده می‌کند تا فقط تراکنش‌های با کاربر معتبر را برگرداند
      }],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit,
      offset
    });

    const plainTransactions = rows.map(t => t.get({ plain: true }));

    return {
      success: true,
      message: 'لیست درخواست‌های برداشت با موفقیت دریافت شد',
      data: {
        transactions: plainTransactions,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        }
      }
    };

  } catch (error: any) {
    console.error('Error fetching withdrawals:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'خطا در دریافت لیست درخواست‌های برداشت'
    });
  }
});