import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { jsonColumnGetSet } from '../utils/jsonColumn.js';

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
    // Single-media legacy columns -- kept so old rows (and any code reading
    // them directly) still work. New carousel posts set `media` instead;
    // the controller keeps these two in sync with media[0] for compat.
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mediaType: {
      type: DataTypes.ENUM('image', 'video'),
      allowNull: true,
    },
    // Ordered list of { url, mediaType } for carousel posts (1+ items).
    // Single-media posts still populate this with a one-item array.
    media: {
      type: DataTypes.JSON,
      allowNull: true,
      ...jsonColumnGetSet('media', []),
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
