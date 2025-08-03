import { Model, DataTypes, Sequelize } from 'sequelize';
import { TagAttributes } from '../types/TagInterface';

export class Tag extends Model<TagAttributes> {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const initTagModel = (sequelize: Sequelize): void => {
  Tag.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'name'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'description'
      },
      parentId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'parent_id',
        references: {
          model: 'tags',
          key: 'id',
        },
        comment: 'شناسه تگ والد برای ساختار سلسله‌مراتبی',
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
      tableName: 'tags',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'tags_name_idx',
          fields: ['name']
        }
      ]
    }
  );
}; 