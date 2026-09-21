import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Save = sequelize.define(
  'Save',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: 'saves',
    timestamps: true,
    indexes: [{ unique: true, fields: ['postId', 'userId'] }],
  }
);
