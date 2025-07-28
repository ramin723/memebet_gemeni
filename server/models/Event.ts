import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from './User';

export interface EventAttributes {
  id: bigint;
  creatorId: bigint;
  title: string;
  description: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'CLOSED' | 'RESOLVED' | 'CANCELLED';
  bettingDeadline: Date;
  resolutionSource: string | null;
  winningOutcomeId: bigint | null;
  isFeatured: boolean;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Event extends Model<EventAttributes> implements EventAttributes {
  public id!: bigint;
  public creatorId!: bigint;
  public title!: string;
  public description!: string;
  public status!: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'CLOSED' | 'RESOLVED' | 'CANCELLED';
  public bettingDeadline!: Date;
  public resolutionSource!: string | null;
  public winningOutcomeId!: bigint | null;
  public isFeatured!: boolean;
  public adminNote!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // روابط
  public readonly creator?: User;
  public readonly outcomes?: any[];
}

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
      winningOutcomeId: {
        type: DataTypes.BIGINT,
        allowNull: true,
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