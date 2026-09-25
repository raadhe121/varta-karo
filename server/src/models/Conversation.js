import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Conversation = sequelize.define(
  'Conversation',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('direct', 'group'),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    // Seconds a new message in this conversation lives before auto-deleting;
    // null means disappearing messages are off. Applies conversation-wide
    // (any participant can toggle it, like WhatsApp), not per-sender.
    disappearingSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'conversations',
    timestamps: true,
  }
);
