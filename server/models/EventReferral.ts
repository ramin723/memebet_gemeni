import { Model, DataTypes, Sequelize } from 'sequelize';
import { EventReferralAttributes } from '../types/EventReferralInterface';

export class EventReferral extends Model<EventReferralAttributes> {
  public id!: string;
  public eventId!: string;
  public referrerId!: string;
  public referredId!: string;
  public commission!: number;
  public status!: 'pending' | 'approved' | 'rejected';
  public createdAt!: Date;
  public updatedAt!: Date;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const initEventReferralModel = (sequelize: Sequelize): void => {
  EventReferral.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
      },
      eventId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'event_id',
        references: {
          model: 'events',
          key: 'id'
        }
      },
      referrerId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'referrer_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      referredId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'referred_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      commission: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'commission'
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
        field: 'status'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at'
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at'
      }
    },
    {
      sequelize,
      tableName: 'event_referrals',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'event_referrals_event_id_idx',
          fields: ['event_id']
        },
        {
          name: 'event_referrals_referrer_id_idx',
          fields: ['referrer_id']
        },
        {
          name: 'event_referrals_referred_id_idx',
          fields: ['referred_id']
        },
        {
          name: 'event_referrals_status_idx',
          fields: ['status']
        }
      ]
    }
  );
}; 