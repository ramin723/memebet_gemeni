import { Model, DataTypes, Sequelize } from 'sequelize';
import { NotificationAttributes } from '../types/NotificationInterface.js';

export class Notification extends Model<NotificationAttributes> {}

export const initNotificationModel = (sequelize: Sequelize): void => {
  Notification.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        comment: 'شناسه کاربر دریافت‌کننده اعلان',
      },
      type: {
        type: DataTypes.ENUM('EVENT_RESOLVED', 'LEVEL_UP', 'NEW_TASK', 'SYSTEM', 'BET_WON', 'BET_LOST', 'COMMENT_REPLY', 'REPORT_RESOLVED'),
        allowNull: false,
        comment: 'نوع اعلان',
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'عنوان اعلان',
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'متن اعلان',
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'آیا اعلان خوانده شده است',
      },
      isArchived: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'آیا اعلان آرشیو شده است',
      },
      relatedEntity: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'اطلاعات موجودیت مرتبط (مثلاً {"type": "event", "id": 123})',
      },
      actionUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'لینک عملیات اعلان',
      },
      priority: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
        defaultValue: 'MEDIUM',
        comment: 'اولویت اعلان',
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'زمان انقضای اعلان',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'notifications',
      timestamps: true,
      indexes: [
        {
          name: 'notifications_user_id_idx',
          fields: ['userId']
        },
        {
          name: 'notifications_type_idx',
          fields: ['type']
        },
        {
          name: 'notifications_is_read_idx',
          fields: ['isRead']
        },
        {
          name: 'notifications_is_archived_idx',
          fields: ['isArchived']
        },
        {
          name: 'notifications_priority_idx',
          fields: ['priority']
        },
        {
          name: 'notifications_created_at_idx',
          fields: ['createdAt']
        },
        {
          name: 'notifications_user_read_idx',
          fields: ['userId', 'isRead']
        },
        {
          name: 'notifications_user_archived_idx',
          fields: ['userId', 'isArchived']
        }
      ]
    }
  );
};

export default Notification; 