# Sequelize Model Configuration Documentation

## خلاصه مشکل
در پروژه ما، مدل‌های Sequelize از تنظیمات متفاوت `underscored` استفاده می‌کنند که باعث ناسازگاری در نام ستون‌های timestamp می‌شود.

## مدل‌هایی که از `underscored: true` استفاده می‌کنند
این مدل‌ها ستون‌های timestamp را با نام `created_at` و `updated_at` در دیتابیس ذخیره می‌کنند:

- `Report` (`server/models/Report.ts`)
- `Tag` (`server/models/Tag.ts`)
- `EventTemplate` (`server/models/EventTemplate.ts`)
- `EventTag` (`server/models/EventTag.ts`)
- `EventReferral` (`server/models/EventReferral.ts`)

## مدل‌هایی که از `underscored: true` استفاده نمی‌کنند
این مدل‌ها ستون‌های timestamp را با نام `createdAt` و `updatedAt` در دیتابیس ذخیره می‌کنند:

- `User` (`server/models/User.ts`)
- `Event` (`server/models/Event.ts`)
- `Bet` (`server/models/Bet.ts`)
- `Comment` (`server/models/Comment.ts`)
- `Notification` (`server/models/Notification.ts`)
- `Task` (`server/models/Task.ts`)
- `UserTask` (`server/models/UserTask.ts`)
- `UserPreference` (`server/models/UserPreference.ts`)
- `Transaction` (`server/models/Transaction.ts`)
- `PendingCommission` (`server/models/PendingCommission.ts`)
- `Outcome` (`server/models/Outcome.ts`)
- `WalletHistory` (`server/models/WalletHistory.ts`)

## راهنمای استفاده در کوئری‌ها

### برای مدل‌های با `underscored: true`
```typescript
// در where clause
where: {
  createdAt: {
    [Op.gte]: someDate
  }
}

// در attributes با fn و col
attributes: [
  [fn('DATE', col('created_at')), 'date'],
  [fn('COUNT', col('id')), 'count']
],
group: [fn('DATE', col('created_at'))],
order: [[fn('DATE', col('created_at')), 'ASC']]
```

### برای مدل‌های بدون `underscored: true`
```typescript
// در where clause
where: {
  createdAt: {
    [Op.gte]: someDate
  }
}

// در attributes با fn و col
attributes: [
  [fn('DATE', col('createdAt')), 'date'],
  [fn('COUNT', col('id')), 'count']
],
group: [fn('DATE', col('createdAt'))],
order: [[fn('DATE', col('createdAt')), 'ASC']]
```

## نکات مهم

1. **در where clause**: همیشه از نام JavaScript property استفاده کنید (`createdAt`)
2. **در fn و col**: از نام واقعی ستون در دیتابیس استفاده کنید
   - برای مدل‌های با `underscored: true`: `created_at`
   - برای مدل‌های بدون `underscored: true`: `createdAt`

## مثال‌های عملی

### مثال ۱: آمار روزانه کاربران (User - بدون underscored)
```typescript
User.findAll({
  where: {
    createdAt: {
      [Op.gte]: sevenDaysAgo
    }
  },
  attributes: [
    [fn('DATE', col('createdAt')), 'date'],
    [fn('COUNT', col('id')), 'count']
  ],
  group: [fn('DATE', col('createdAt'))],
  order: [[fn('DATE', col('createdAt')), 'ASC']],
  raw: true
})
```

### مثال ۲: آمار روزانه گزارش‌ها (Report - با underscored)
```typescript
Report.findAll({
  where: {
    createdAt: {
      [Op.gte]: sevenDaysAgo
    }
  },
  attributes: [
    [fn('DATE', col('created_at')), 'date'],
    [fn('COUNT', col('id')), 'count']
  ],
  group: [fn('DATE', col('created_at'))],
  order: [[fn('DATE', col('created_at')), 'ASC']],
  raw: true
})
```

## توصیه‌های آینده

1. **یکسان‌سازی**: بهتر است تمام مدل‌ها از یک تنظیم استفاده کنند
2. **مستندسازی**: این فایل را در پروژه نگه دارید
3. **تست**: قبل از deploy، کوئری‌های جدید را تست کنید

## خطاهای رایج

- `column "createdAt" does not exist`: مدل از `underscored: true` استفاده می‌کند
- `column "created_at" does not exist`: مدل از `underscored: true` استفاده نمی‌کند

## آخرین بروزرسانی
این مستندات در تاریخ [تاریخ امروز] ایجاد شده و باید با هر تغییر در مدل‌ها بروزرسانی شود. 