import { defineEventHandler, getQuery, createError } from 'h3' // 1. createError را import کن
import { Event } from '~/server/models/Event'
import { User } from '~/server/models/User'

export default defineEventHandler(async (event) => {
  // TODO: Add admin middleware check later

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50  // افزایش limit
  const offset = (page - 1) * limit

  try {
    const { count, rows } = await Event.findAndCountAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'wallet_address'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    return {
      total: count,
      events: rows.map(e => e.get({ plain: true }))
    }
  } catch (error: any) {
    console.error("API Error fetching events:", error); // لاگ کردن خطای واقعی در سرور
    // 2. یک خطای واقعی HTTP با استفاده از createError برگردان
    throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch events',
        data: error.message // ارسال جزئیات خطا برای دیباگ در فرانت‌اند
    })
  }
})