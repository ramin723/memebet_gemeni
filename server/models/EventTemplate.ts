import { Model, DataTypes, Sequelize } from 'sequelize';
import { EventTemplateAttributes } from '../types/EventTemplateInterface';

export class EventTemplate extends Model<EventTemplateAttributes> {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public structure!: any; // JSONB field for template structure
  public creatorType!: 'ADMIN' | 'USER' | 'BOTH';
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const initEventTemplateModel = (sequelize: Sequelize): void => {
  EventTemplate.init(
    {
      id: {
        type: DataTypes.BIGINT, // Standard: Use BIGINT for all IDs
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // NEW: A structured JSONB field for our template engine
      structure: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      outcomesStructure: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'ساختار گزینه‌ها (FIXED یا DYNAMIC)',
      },
      creatorType: {
        type: DataTypes.ENUM('ADMIN', 'USER', 'BOTH'),
        defaultValue: 'BOTH',
        field: 'creator_type'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active'
      },
      // Timestamps are handled by sequelize, no need to define createdAt/updatedAt here
    },
    {
      sequelize,
      tableName: 'event_templates',
      timestamps: true, // This will automatically add createdAt and updatedAt
      underscored: true, // This will ensure field names are snake_case
      indexes: [
        {
          name: 'event_templates_name_idx',
          fields: ['name']
        },
        {
          name: 'event_templates_creator_type_idx',
          fields: ['creator_type']
        },
        {
          name: 'event_templates_is_active_idx',
          fields: ['is_active']
        }
      ]
    }
  );
};

export default EventTemplate; 