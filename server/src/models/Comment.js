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
