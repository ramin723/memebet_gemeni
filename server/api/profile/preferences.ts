import { defineEventHandler, readBody, createError } from 'h3';
import { UserPreference } from '../../models/UserPreference';

export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({ statusCode: 401, message: 'احراز هویت مورد نیاز است' });
  }
  const userId = event.context.user.id;

  // GET: دریافت تنظیمات فعلی کاربر
  if (event.node.req.method === 'GET') {
    const preferences = await UserPreference.findOrCreate({
      where: { userId },
    });
    return { success: true, data: preferences[0].get({ plain: true }) };
  }

  // PUT: به‌روزرسانی تنظیمات کاربر
  if (event.node.req.method === 'PUT') {
    const body = await readBody(event);
    const [preferences] = await UserPreference.findOrCreate({
      where: { userId },
    });

    await preferences.update({
      favoriteTopics: body.favoriteTopics !== undefined ? body.favoriteTopics : preferences.get('favoriteTopics'),
      language: body.language || preferences.get('language'),
      currency: body.currency || preferences.get('currency'),
      theme: body.theme || preferences.get('theme'),
      emailNotifications: body.emailNotifications !== undefined ? body.emailNotifications : preferences.get('emailNotifications'),
      pushNotifications: body.pushNotifications !== undefined ? body.pushNotifications : preferences.get('pushNotifications'),
      betNotifications: body.betNotifications !== undefined ? body.betNotifications : preferences.get('betNotifications'),
      eventNotifications: body.eventNotifications !== undefined ? body.eventNotifications : preferences.get('eventNotifications'),
      taskNotifications: body.taskNotifications !== undefined ? body.taskNotifications : preferences.get('taskNotifications'),
      systemNotifications: body.systemNotifications !== undefined ? body.systemNotifications : preferences.get('systemNotifications'),
    });

    return { success: true, message: 'تنظیمات با موفقیت به‌روزرسانی شد', data: preferences.get({ plain: true }) };
  }

  // Handle other methods
  throw createError({ statusCode: 405, message: 'Method Not Allowed' });
}); 