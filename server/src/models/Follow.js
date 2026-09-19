import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Follow = sequelize.define(
  'Follow',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    followerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    followingId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: 'follows',
    timestamps: true,
    indexes: [{ unique: true, fields: ['followerId', 'followingId'] }],
  }
);
