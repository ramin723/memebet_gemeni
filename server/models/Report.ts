import { Model, DataTypes, Sequelize } from 'sequelize';
import { ReportAttributes } from '../types/ReportInterface';

export class Report extends Model<ReportAttributes> {}

export const initReportModel = (sequelize: Sequelize): void => {
  Report.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      reporterId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        field: 'reporter_id'
      },
      entityType: {
        type: DataTypes.ENUM('EVENT', 'COMMENT'),
        allowNull: false,
        field: 'entity_type'
      },
      entityId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'entity_id'
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      adminNote: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'admin_note'
      },
      resolvedBy: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        field: 'resolved_by_id'
      }
    },
    {
      sequelize,
      tableName: 'reports',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'reports_reporter_id_idx',
          fields: ['reporter_id']
        },
        {
          name: 'reports_entity_type_entity_id_idx',
          fields: ['entity_type', 'entity_id']
        },
        {
          name: 'reports_status_idx',
          fields: ['status']
        },
        {
          name: 'reports_resolved_by_idx',
          fields: ['resolved_by_id']
        }
      ]
    }
  );
};