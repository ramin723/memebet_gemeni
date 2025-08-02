import { defineEventHandler, getQuery, createError } from 'h3';
import { Report } from '../../../models/Report';
import { User } from '../../../models/User';
import { Event } from '../../../models/Event';
import { Comment } from '../../../models/Comment';

export default defineEventHandler(async (event) => {
  try {
    // بررسی احراز هویت و دسترسی ادمین
    if (!event.context.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    const user = event.context.user;
    if ((user as any).role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      });
    }

    // دریافت پارامترهای صفحه‌بندی و فیلتر
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const status = query.status as string;
    const entityType = query.entityType as string;
    const reason = query.reason as string;
    const search = query.search as string;
    const sortBy = query.sortBy as string || 'createdAt';
    const sortOrder = query.sortOrder as string || 'DESC';

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
    const allowedStatuses = ['PENDING', 'RESOLVED', 'DISMISSED'];
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
        statusMessage: 'Invalid entity type filter'
      });
    }

    // اعتبارسنجی sortBy
    const allowedSortFields = ['createdAt', 'updatedAt', 'status', 'entityType', 'reason'];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid sort field'
      });
    }

    // اعتبارسنجی sortOrder
    if (sortOrder && !['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Sort order must be ASC or DESC'
      });
    }

    // محاسبه offset
    const offset = (page - 1) * limit;

    // ساخت where clause
    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (entityType) {
      whereClause.entityType = entityType;
    }

    if (reason) {
      whereClause.reason = reason;
    }

    if (search) {
      whereClause.reason = {
        [require('sequelize').Op.iLike]: `%${search}%`
      };
    }

    // دریافت گزارش‌ها با صفحه‌بندی
    const { count, rows: reports } = await Report.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'username', 'wallet_address', 'email']
        },
        {
          model: User,
          as: 'resolver',
          attributes: ['id', 'username', 'wallet_address'],
          required: false
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: limit,
      offset: offset
    });

    // محاسبه اطلاعات صفحه‌بندی
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // تبدیل داده‌ها به فرمت مناسب
    const reportsData = await Promise.all(reports.map(async (report: any) => {
      let entityInfo = null;

      // دریافت اطلاعات موجودیت گزارش شده
      if ((report as any).entityType === 'EVENT') {
        const event = await Event.findByPk((report as any).entityId);
        if (event) {
          entityInfo = {
            id: (event as any).id,
            title: (event as any).title,
            description: (event as any).description,
            status: (event as any).status
          };
        }
      } else if ((report as any).entityType === 'COMMENT') {
        const comment = await Comment.findByPk((report as any).entityId);
        if (comment) {
          entityInfo = {
            id: (comment as any).id,
            content: (comment as any).content,
            eventId: (comment as any).eventId
          };
        }
      }

      return {
        id: (report as any).id,
        entityType: (report as any).entityType,
        entityId: (report as any).entityId,
        reason: (report as any).reason,
        status: (report as any).status,
        adminNote: (report as any).adminNote,
        entityInfo: entityInfo,
        reporter: {
          id: (report as any).reporter.id,
          username: (report as any).reporter.username,
          wallet_address: (report as any).reporter.wallet_address,
          email: (report as any).reporter.email
        },
        resolver: (report as any).resolver ? {
          id: (report as any).resolver.id,
          username: (report as any).resolver.username,
          wallet_address: (report as any).resolver.wallet_address
        } : null,
        resolvedAt: (report as any).resolvedAt,
        createdAt: (report as any).createdAt,
        updatedAt: (report as any).updatedAt
      };
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
          entityType: entityType || null,
          reason: reason || null,
          search: search || null
        },
        sort: {
          field: sortBy,
          order: sortOrder.toUpperCase()
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