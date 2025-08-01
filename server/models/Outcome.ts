import { Model, DataTypes, Sequelize } from 'sequelize';
import { Event } from './Event';
import { OutcomeAttributes } from '../types/OutcomeInterface';

export class Outcome extends Model<OutcomeAttributes> {}

export const initOutcomeModel = (sequelize: Sequelize): void => {
  Outcome.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: BigInt(0),
      },
      totalBets: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isWinner: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      tableName: 'outcomes',
      timestamps: true,
    }
  );
};

export default Outcome; 