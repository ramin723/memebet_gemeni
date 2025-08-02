import { Model, DataTypes, Sequelize } from 'sequelize';
import { UserPreferenceAttributes } from '../types/UserPreferenceInterface.js';

export class UserPreference extends Model<UserPreferenceAttributes> {}

export const initUserPreferenceModel = (sequelize: Sequelize): void => {
  UserPreference.init(
    {
      userId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        comment: 'شناسه کاربر (کلید اصلی)',
      },
      favoriteTopics: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'آرایه‌ای از شناسه‌های تگ‌های مورد علاقه کاربر',
      },
      language: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'en',
        comment: 'زبان ترجیحی کاربر',
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'USDT',
        comment: 'ارز ترجیحی کاربر',
      },
      theme: {
        type: DataTypes.ENUM('LIGHT', 'DARK', 'AUTO'),
        allowNull: false,
        defaultValue: 'AUTO',
        comment: 'تم ترجیحی کاربر',
      },
      emailNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'آیا اعلان‌های ایمیل فعال است',
      },
      pushNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'آیا اعلان‌های push فعال است',
      },
      betNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'آیا اعلان‌های مربوط به شرط‌بندی فعال است',
      },
      eventNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'آیا اعلان‌های مربوط به رویدادها فعال است',
      },
      taskNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'آیا اعلان‌های مربوط به وظایف فعال است',
      },
      systemNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'آیا اعلان‌های سیستمی فعال است',
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
      tableName: 'user_preferences',
      timestamps: true,
      indexes: [
        {
          fields: ['language']
        },
        {
          fields: ['currency']
        },
        {
          fields: ['theme']
        }
      ]
    }
  );
};

export default UserPreference; 