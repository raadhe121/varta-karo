import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Comment = sequelize.define(
  'Comment',
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
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    // One level of threading -- a reply's parentId points at a top-level
    // comment. A reply to a reply still points at the original top-level
    // comment (flattened), matching Instagram's single-level reply UI.
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: 'comments',
    timestamps: true,
  }
);
