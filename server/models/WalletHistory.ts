import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from './User';
import { WalletHistoryAttributes } from '../types/WalletHistoryInterface';

export class WalletHistory extends Model<WalletHistoryAttributes> {}

export const initWalletHistoryModel = (sequelize: Sequelize): void => {
  WalletHistory.init(
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
        type: DataTypes.ENUM('DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN', 'REFUND', 'COMMISSION'),
        allowNull: false,
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: BigInt(0),
      },
      balanceBefore: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: BigInt(0),
      },
      balanceAfter: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: BigInt(0),
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      referenceId: {
        type: DataTypes.BIGINT,
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
      tableName: 'wallet_histories',
      timestamps: true,
      indexes: [
        {
          name: 'wallet_histories_user_id_idx',
          fields: ['userId']
        },
        {
          name: 'wallet_histories_type_idx',
          fields: ['type']
        },
        {
          name: 'wallet_histories_created_at_idx',
          fields: ['createdAt']
        }
      ]
    }
  );
};

export default WalletHistory; 