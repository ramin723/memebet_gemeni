import { Model, DataTypes } from 'sequelize';
import { PendingCommissionAttributes } from '../types/PendingCommissionInterface';

export class PendingCommission extends Model<PendingCommissionAttributes> {}

export function initPendingCommissionModel(sequelize: any) {
  PendingCommission.init(
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
      eventId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id',
        },
      },
      betId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'bets',
          key: 'id',
        },
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'PAID', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING',
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
      modelName: 'PendingCommission',
      tableName: 'pending_commissions',
      timestamps: true,
    }
  );
} 