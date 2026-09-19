import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const MessageStatus = sequelize.define(
  'MessageStatus',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    messageId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('delivered', 'read'),
      allowNull: false,
      defaultValue: 'delivered',
    },
  },
  {
    tableName: 'message_statuses',
    timestamps: true,
    indexes: [{ unique: true, fields: ['messageId', 'userId'] }],
  }
);
