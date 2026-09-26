import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// A named, non-expiring shelf of story media pinned to a profile -- built by
// copying media out of the ephemeral Story rows at creation time (see
// HighlightItem), so a highlight survives long after its source stories
// expire and are swept away.
export const Highlight = sequelize.define(
  'Highlight',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    coverUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'highlights',
    timestamps: true,
  }
);
