// Sequelize model: Category
//   Top-level taxonomy entry managed via the admin "App Settings" panel.
//   Each Category has many SubCategory rows. A Professional picks one or
//   more SubCategory ids on their profile; the parent Category is inferred
//   from those sub-category rows.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () => `cat-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const Category = sequelize.define(
  'Category',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'categories',
    timestamps: true,
    indexes: [{ fields: ['slug'], unique: true }, { fields: ['active'] }],
  }
);

module.exports = Category;
