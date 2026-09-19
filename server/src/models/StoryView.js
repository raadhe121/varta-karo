import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const StoryView = sequelize.define(
  'StoryView',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    storyId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    viewerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: 'story_views',
    timestamps: true,
    updatedAt: false,
  }
);
