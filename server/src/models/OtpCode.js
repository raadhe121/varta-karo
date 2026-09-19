import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const OtpCode = sequelize.define(
  'OtpCode',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    consumed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'otp_codes',
    timestamps: true,
  }
);
