import { defineEventHandler, getQuery } from '#imports';
import { Tag } from '../../../models/Tag';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      sortBy = 'createdAt', 
      sortOrder = 'DESC' 
    } = query;

    // ساخت شرطهای جستجو
    const whereClause: any = {};
    if (search) {
      whereClause.name = {
        [event.context.sequelize.Sequelize.Op.iLike]: `%${search}%`
      };
    }

    // محاسبه offset
    const offset = (Number(page) - 1) * Number(limit);

    // دریافت تگ‌ها با pagination
    const { rows: tags, count: total } = await Tag.findAndCountAll({
      where: whereClause,
      order: [[sortBy as string, sortOrder as string]],
      limit: Number(limit),
      offset: offset,
      attributes: ['id', 'name', 'description', 'parentId', 'createdAt', 'updatedAt']
    });

    // محاسبه اطلاعات pagination
    const totalPages = Math.ceil(total / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPrevPage = Number(page) > 1;

    return {
      success: true,
      data: {
        tags,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalItems: total,
          itemsPerPage: Number(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    };

  } catch (error) {
    console.error('❌ [Admin Tags GET] Error:', error);
    throw createError({
      statusCode: 500,
      message: 'خطا در دریافت لیست تگ‌ها'
    });
  }
});
