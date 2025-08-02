import { Model, DataTypes, Sequelize } from 'sequelize';
import { UserTaskAttributes } from '../types/UserTaskInterface.js';

export class UserTask extends Model<UserTaskAttributes> {}

export const initUserTaskModel = (sequelize: Sequelize): void => {
  UserTask.init(
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
      },
      taskId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id',
        },
      },
      status: {
        type: DataTypes.ENUM('IN_PROGRESS', 'COMPLETED'),
        allowNull: false,
        defaultValue: 'IN_PROGRESS',
      },
      progress: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'پیشرفت فعلی تسک (مثل تعداد شرط‌بندی انجام شده)',
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'زمان تکمیل تسک',
      },
      rewardClaimed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'آیا پاداش دریافت شده است',
      },
      rewardClaimedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'زمان دریافت پاداش',
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
      tableName: 'user_tasks',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'taskId'],
          name: 'user_task_unique',
        },
        {
          fields: ['userId'],
          name: 'user_task_user_index',
        },
        {
          fields: ['taskId'],
          name: 'user_task_task_index',
        },
        {
          fields: ['status'],
          name: 'user_task_status_index',
        },
      ],
    }
  );
};

export default UserTask; 