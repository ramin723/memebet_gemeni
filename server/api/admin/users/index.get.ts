import { defineEventHandler, createError, getQuery } from 'h3';
import { Op } from 'sequelize';
import adminMiddleware from '../../../middleware/02.admin';
import { User } from '../../../models/User';

export default defineEventHandler(async (event) => {
  await adminMiddleware(event);

  try {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const searchQuery = query.search as string;
    const roleFilter = query.role as string;
    const statusFilter = query.status as string;
    const sortBy = query.sortBy as string || 'createdAt';
    const sortOrder = query.sortOrder as string || 'DESC';

    const whereClause: any = {};
    if (searchQuery) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${searchQuery}%` } },
        { wallet_address: { [Op.iLike]: `%${searchQuery}%` } }
      ];
    }
    if (roleFilter && ['USER', 'ADMIN'].includes(roleFilter)) {
      whereClause.role = roleFilter;
    }
    if (statusFilter && ['ACTIVE', 'SUSPENDED', 'BANNED'].includes(statusFilter)) {
      whereClause.status = statusFilter;
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit,
      offset
    });

    const plainUsers = rows.map(user => user.get({ plain: true }));

    return {
      success: true,
      message: 'لیست کاربران با موفقیت دریافت شد',
      data: {
        users: plainUsers,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        }
      }
    };

  } catch (error: any) {
    console.error('Error fetching users:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'خطا در دریافت لیست کاربران'
    });
  }
});