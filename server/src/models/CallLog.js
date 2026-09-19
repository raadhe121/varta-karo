import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const CallLog = sequelize.define(
  'CallLog',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    callerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    calleeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('audio', 'video'),
      allowNull: false,
      defaultValue: 'audio',
    },
    status: {
      type: DataTypes.ENUM('answered', 'missed', 'declined', 'no_answer'),
      allowNull: false,
      defaultValue: 'missed',
    },
    durationSec: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'call_logs',
    timestamps: true,
    updatedAt: false,
  }
);
