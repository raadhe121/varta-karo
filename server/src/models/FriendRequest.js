import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const FriendRequest = sequelize.define(
  'FriendRequest',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    requesterId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    addresseeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    tableName: 'friend_requests',
    timestamps: true,
    indexes: [{ unique: true, fields: ['requesterId', 'addresseeId'] }],
  }
);
