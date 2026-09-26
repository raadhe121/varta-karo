import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// A pending "follow me" ask against a private account. Accepting one just
// creates the normal Follow row and deletes this; rejecting (or the
// requester cancelling) deletes it with no Follow created. There's no
// `status` column -- existence of the row IS "pending".
export const FollowRequest = sequelize.define(
  'FollowRequest',
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
    targetId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: 'follow_requests',
    timestamps: true,
    indexes: [{ unique: true, fields: ['requesterId', 'targetId'] }],
  }
);
