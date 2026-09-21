import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// Unlike Save/Like, a share isn't a toggle -- a user can share the same post
// more than once (to different people/chats), so each share is its own row
// and the count is just how many rows exist for a post.
export const Share = sequelize.define(
  'Share',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: 'shares',
    timestamps: true,
  }
);
