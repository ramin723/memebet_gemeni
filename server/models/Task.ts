import { Model, DataTypes, Sequelize } from 'sequelize';
import { TaskAttributes } from '../types/TaskInterface.js';

export class Task extends Model<TaskAttributes> {}

export const initTaskModel = (sequelize: Sequelize): void => {
  Task.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('DAILY', 'LEVEL', 'SPECIAL'),
        allowNull: false,
        defaultValue: 'DAILY',
      },
      rewardAmount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      rewardType: {
        type: DataTypes.ENUM('SPARKS', 'COINS', 'XP'),
        allowNull: false,
        defaultValue: 'SPARKS',
      },
      conditions: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'شرایط انجام تسک (مثل تعداد شرط‌بندی، مبلغ حداقل و...)',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      maxCompletions: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'حداکثر تعداد تکمیل (null = نامحدود)',
      },
      levelRequirement: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'سطح مورد نیاز برای انجام تسک',
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
      tableName: 'tasks',
      timestamps: true,
    }
  );
};

export default Task; 