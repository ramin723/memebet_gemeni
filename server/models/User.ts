import { Model, DataTypes, Sequelize } from 'sequelize';
import { UserAttributes } from '../types/models';

export class User extends Model<UserAttributes> implements UserAttributes {
  public id!: bigint;
  public wallet_address!: string;
  public username!: string | null;
  public balance!: bigint;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initUserModel = (sequelize: Sequelize): void => {
  User.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      wallet_address: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      balance: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
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
      tableName: 'users',
      timestamps: true,
    }
  );
};

export default User; 