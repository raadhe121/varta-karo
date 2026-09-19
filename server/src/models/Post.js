import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Post = sequelize.define(
  'Post',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mediaType: {
      type: DataTypes.ENUM('image', 'video'),
      allowNull: true,
    },
    visibility: {
      type: DataTypes.ENUM('public', 'friends', 'only_me'),
      allowNull: false,
      defaultValue: 'public',
    },
  },
  {
    tableName: 'posts',
    timestamps: true,
    paranoid: true,
  }
);
