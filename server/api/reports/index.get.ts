import { defineEventHandler, getQuery, createError } from 'h3';
import { Report } from '../../models/Report';
import { User } from '../../models/User';

export default defineEventHandler(async (event) => {
  try {
    // بررسی احراز هویت
    if (!event.context.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    const userId = event.context.user.id;

    // دریافت پارامترهای صفحه‌بندی و فیلتر
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const status = query.status as string;
    const entityType = query.entityType as string;

    // اعتبارسنجی پارامترها
    if (page < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Page must be greater than 0'
      });
    }

    if (limit < 1 || limit > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Limit must be between 1 and 100'
      });
    }

    // اعتبارسنجی status
    const allowedStatuses = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'];
    if (status && !allowedStatuses.includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid status filter'
      });
    }

    // اعتبارسنجی entityType
    const allowedEntityTypes = ['EVENT', 'COMMENT'];
    if (entityType && !allowedEntityTypes.includes(entityType)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid entityType filter'
      });
    }

    // محاسبه offset
    const offset = (page - 1) * limit;

    // ساخت where clause
    const whereClause: any = {
      reporterId: userId
    };

    if (status) {
      whereClause.status = status;
    }

    if (entityType) {
      whereClause.entityType = entityType;
    }

    // دریافت گزارش‌ها با صفحه‌بندی
    const { count, rows: reports } = await Report.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'username', 'wallet_address']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset
    });

    // محاسبه اطلاعات صفحه‌بندی
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // تبدیل داده‌ها به فرمت مناسب
    const reportsData = reports.map((report: any) => ({
      id: report.id,
      entityType: report.entityType,
      entityId: report.entityId,
      reason: report.reason,
      status: report.status,
      adminNote: report.adminNote,
      resolvedBy: report.resolvedBy,
      resolvedAt: report.resolvedAt,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      reporter: {
        id: report.reporter.id,
        username: report.reporter.username,
        wallet_address: report.reporter.wallet_address
      }
    }));

    return {
      success: true,
      message: 'Reports retrieved successfully',
      data: {
        reports: reportsData,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null
        },
        filters: {
          status: status || null,
          entityType: entityType || null
        }
      }
    };

  } catch (error: any) {
    console.error('Error retrieving reports:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while retrieving reports'
    });
  }
}); 