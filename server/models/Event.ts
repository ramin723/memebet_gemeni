import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from './User';
import { EventAttributes } from '../types/EventInterface';

export class Event extends Model<EventAttributes> {}

export const initEventModel = (sequelize: Sequelize): void => {
  Event.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      creatorId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'CLOSED', 'RESOLVED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING_APPROVAL',
      },
      bettingDeadline: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      resolutionSource: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      resolutionSourceUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'لینک منبع داوری',
      },
      winningOutcomeId: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      isCustom: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'آیا رویداد سفارشی است یا از قالب',
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      adminNote: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL تصویر رویداد',
      },
      minBetAmount: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: 'حداقل مبلغ شرط‌بندی',
      },
      maxBetAmount: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: 'حداکثر مبلغ شرط‌بندی',
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
      tableName: 'events',
      timestamps: true,
    }
  );
};

export default Event; 