import { defineEventHandler, getQuery, createError } from '#imports';
import { Tag } from '../../models/Tag';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { 
      search = '', 
      parentId = null,
      limit = 100 
    } = query;

    // ساخت شرطهای جستجو
    const whereClause: any = {};
    
    if (search) {
      whereClause.name = {
        [event.context.sequelize.Sequelize.Op.iLike]: `%${search}%`
      };
    }

    if (parentId !== null && parentId !== undefined) {
      if (parentId === 'null' || parentId === '') {
        whereClause.parentId = null; // تگ‌های اصلی (بدون والد)
      } else {
        whereClause.parentId = parentId;
      }
    }

    // دریافت تگ‌ها
    const tags = await Tag.findAll({
      where: whereClause,
      order: [['name', 'ASC']],
      limit: Number(limit),
      attributes: ['id', 'name', 'description', 'parentId']
    });

    return {
      success: true,
      data: {
        tags,
        total: tags.length
      }
    };

  } catch (error: any) {
    console.error('❌ [Public Tags GET] Error:', error);
    throw createError({
      statusCode: 500,
      message: 'خطا در دریافت لیست تگ‌ها'
    });
  }
});
