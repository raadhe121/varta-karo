import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const ContactRequest = sequelize.define(
  'ContactRequest',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    requesterId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    addresseeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'blocked'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    tableName: 'contact_requests',
    timestamps: true,
    indexes: [{ unique: true, fields: ['requesterId', 'addresseeId'] }],
  }
);
