import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { jsonColumnGetSet } from '../utils/jsonColumn.js';

export const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avatarColor: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#C77D2E',
    },
    bio: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    coverPhotoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    work: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    education: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    links: {
      type: DataTypes.JSON,
      allowNull: true,
      ...jsonColumnGetSet('links', []),
    },
    profileVisibility: {
      type: DataTypes.ENUM('public', 'friends', 'only_me'),
      allowNull: false,
      defaultValue: 'public',
    },
    status: {
      type: DataTypes.ENUM('online', 'offline'),
      allowNull: false,
      defaultValue: 'offline',
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
  }
);
