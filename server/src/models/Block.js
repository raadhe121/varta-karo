import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Block = sequelize.define(
  'Block',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    blockerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    blockedId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: 'blocks',
    timestamps: true,
    indexes: [{ unique: true, fields: ['blockerId', 'blockedId'] }],
  }
);
