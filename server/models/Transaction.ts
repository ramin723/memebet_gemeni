import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from './User';
import { TransactionAttributes } from '../types/TransactionInterface';

export class Transaction extends Model<TransactionAttributes> {}

export const initTransactionModel = (sequelize: Sequelize): void => {
  Transaction.init(
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
        onDelete: 'CASCADE',
      },
      type: {
        type: DataTypes.ENUM('DEPOSIT', 'WITHDRAWAL'),
        allowNull: false,
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: BigInt(0),
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'REJECTED', 'FAILED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      txHash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      walletAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
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
      tableName: 'transactions',
      timestamps: true,
      indexes: [
        {
          name: 'transactions_user_id_idx',
          fields: ['userId']
        },
        {
          name: 'transactions_type_idx',
          fields: ['type']
        },
        {
          name: 'transactions_status_idx',
          fields: ['status']
        },
        {
          name: 'transactions_created_at_idx',
          fields: ['createdAt']
        }
      ]
    }
  );
};

export default Transaction; 