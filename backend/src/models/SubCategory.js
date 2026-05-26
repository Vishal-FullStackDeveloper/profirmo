// Sequelize model: SubCategory
//   Child taxonomy entry belonging to a Category. Professionals pick one or
//   more sub-category ids on their profile.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `subcat-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const SubCategory = sequelize.define(
  'SubCategory',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    categoryId: { type: DataTypes.STRING(64), allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // When true, the sub-category appears in the home page
    // "Browse by area of expertise" section. Admin curates the list.
    featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'sub_categories',
    timestamps: true,
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['categoryId'] },
      { fields: ['active'] },
    ],
  }
);

module.exports = SubCategory;
