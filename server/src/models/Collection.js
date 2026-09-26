import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// A named folder of saved posts, e.g. "Recipes" or "Wishlist" -- mirrors
// Instagram's saved-collections feature. A Save with a null collectionId
// sits in the implicit "All posts" bucket rather than any named one.
export const Collection = sequelize.define(
  'Collection',
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
  },
  {
    tableName: 'collections',
    timestamps: true,
  }
);
