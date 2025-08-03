# Sequelize Quick Reference

## مدل‌های با `underscored: true`
```typescript
// در fn() و col() از created_at استفاده کنید
[fn('DATE', col('created_at')), 'date']
[fn('COUNT', col('id')), 'count']
group: [fn('DATE', col('created_at'))]
order: [[fn('DATE', col('created_at')), 'ASC']]
```

**مدل‌ها:**
- Report
- Tag  
- EventTemplate
- EventTag
- EventReferral

## مدل‌های بدون `underscored: true`
```typescript
// در fn() و col() از createdAt استفاده کنید
[fn('DATE', col('createdAt')), 'date']
[fn('COUNT', col('id')), 'count']
group: [fn('DATE', col('createdAt'))]
order: [[fn('DATE', col('createdAt')), 'ASC']]
```

**مدل‌ها:**
- User
- Event
- Bet
- Comment
- Notification
- Task
- UserTask
- UserPreference
- Transaction
- PendingCommission
- Outcome
- WalletHistory

## نکته مهم
در `where` clause همیشه از `createdAt` استفاده کنید (Sequelize خودش mapping می‌کند):

```typescript
where: {
  createdAt: {
    [Op.gte]: someDate
  }
}
``` 