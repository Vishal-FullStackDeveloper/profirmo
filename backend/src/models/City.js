// Sequelize model: City
//   Admin-managed list that drives every "city" dropdown in the app.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () => `city-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const City = sequelize.define(
  'City',
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
    tableName: 'cities',
    timestamps: true,
    indexes: [{ fields: ['slug'], unique: true }, { fields: ['active'] }],
  }
);

module.exports = City;
