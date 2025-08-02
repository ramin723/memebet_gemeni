import { Model, DataTypes, Sequelize } from 'sequelize';
import { UserAttributes } from '../types/UserInterface';

export class User extends Model<UserAttributes> {}

export const initUserModel = (sequelize: Sequelize): void => {
  User.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      wallet_address: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      balance: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      role: {
        type: DataTypes.ENUM('USER', 'ADMIN'),
        allowNull: false,
        defaultValue: 'USER',
      },
      referralCode: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
        field: 'referral_code',
      },
      permissions: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'BANNED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'سطح کاربر',
      },
      xp: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'تجربه کاربر',
      },
      avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL آواتار کاربر',
      },
      headerUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL هدر پروفایل کاربر',
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
      tableName: 'users',
      timestamps: true,
    }
  );
};

export default User; 