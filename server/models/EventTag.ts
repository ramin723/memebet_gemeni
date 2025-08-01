import { Model, DataTypes, Sequelize } from 'sequelize';
import { EventTagAttributes } from '../types/EventTagInterface';

export class EventTag extends Model<EventTagAttributes> {
  public eventId!: string;
  public tagId!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const initEventTagModel = (sequelize: Sequelize): void => {
  EventTag.init(
    {
      eventId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        field: 'event_id',
        references: {
          model: 'events',
          key: 'id'
        }
      },
      tagId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        field: 'tag_id',
        references: {
          model: 'tags',
          key: 'id'
        }
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
      tableName: 'event_tags',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['event_id']
        },
        {
          fields: ['tag_id']
        },
        {
          fields: ['event_id', 'tag_id'],
          unique: true
        }
      ]
    }
  );
}; 