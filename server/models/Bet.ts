import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from './User';
import { Event } from './Event';
import { Outcome } from './Outcome';
import { BetAttributes } from '../types/BetInterface';

export class Bet extends Model<BetAttributes> {}

export const initBetModel = (sequelize: Sequelize): void => {
  Bet.init(
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
      eventId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      outcomeId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'outcomes',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: BigInt(0),
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'WON', 'LOST', 'CANCELLED'),
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
      tableName: 'bets',
      timestamps: true,
    }
  );
};

export default Bet; 