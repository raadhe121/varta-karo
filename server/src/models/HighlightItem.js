import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const HighlightItem = sequelize.define(
  'HighlightItem',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    highlightId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mediaType: {
      type: DataTypes.ENUM('image', 'video'),
      allowNull: false,
      defaultValue: 'image',
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'highlight_items',
    timestamps: true,
  }
);
