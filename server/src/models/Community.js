import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Community = sequelize.define(
  'Community',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    coverImageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    creatorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: 'communities',
    timestamps: true,
  }
);
