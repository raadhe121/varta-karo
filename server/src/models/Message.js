import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { jsonColumnGetSet } from '../utils/jsonColumn.js';

export const Message = sequelize.define(
  'Message',
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
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('text', 'image', 'file'),
      allowNull: false,
      defaultValue: 'text',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mediaMeta: {
      type: DataTypes.JSON,
      allowNull: true,
      ...jsonColumnGetSet('mediaMeta', null),
    },
    replyToId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    // Set when the conversation has disappearing messages on at send time;
    // a background sweep (services/disappearingMessages.service.js)
    // soft-deletes messages once this passes.
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'messages',
    timestamps: true,
    paranoid: true,
  }
);
