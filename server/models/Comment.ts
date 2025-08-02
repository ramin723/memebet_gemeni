import { Model, DataTypes, Sequelize } from 'sequelize';
import { CommentAttributes } from '../types/CommentInterface.js';

export class Comment extends Model<CommentAttributes> {}

export const initCommentModel = (sequelize: Sequelize): void => {
  Comment.init(
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
        comment: 'شناسه کاربر نویسنده نظر',
      },
      eventId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id',
        },
        comment: 'شناسه رویداد مربوطه',
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'متن نظر',
      },
      isEdited: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'آیا نظر ویرایش شده است',
      },
      editedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'زمان ویرایش نظر',
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'آیا نظر حذف شده است',
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'زمان حذف نظر',
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
      tableName: 'comments',
      timestamps: true,
      indexes: [
        {
          fields: ['userId']
        },
        {
          fields: ['eventId']
        },
        {
          fields: ['createdAt']
        }
      ]
    }
  );
};

export default Comment; 