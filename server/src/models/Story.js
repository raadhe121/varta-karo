import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Story = sequelize.define(
  'Story',
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
    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mediaType: {
      type: DataTypes.ENUM('image', 'video'),
      allowNull: false,
      defaultValue: 'image',
    },
    caption: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'stories',
    timestamps: true,
  }
);
