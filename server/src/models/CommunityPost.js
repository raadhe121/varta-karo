import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const CommunityPost = sequelize.define(
  'CommunityPost',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    communityId: {
      type: DataTypes.UUID,
      allowNull: false,
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
  },
  {
    tableName: 'community_posts',
    timestamps: true,
    paranoid: true,
  }
);
