import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    recipientId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        'friend_request',
        'friend_accepted',
        'follow',
        'contact_request',
        'contact_accepted',
        'like',
        'comment'
      ),
      allowNull: false,
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'notifications',
    timestamps: true,
  }
);
