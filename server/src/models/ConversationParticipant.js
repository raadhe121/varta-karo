import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const ConversationParticipant = sequelize.define(
  'ConversationParticipant',
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'member'),
      allowNull: false,
      defaultValue: 'member',
    },
    lastReadMessageId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: 'conversation_participants',
    timestamps: true,
    indexes: [{ unique: true, fields: ['conversationId', 'userId'] }],
  }
);
