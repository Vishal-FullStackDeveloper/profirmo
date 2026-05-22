// Sequelize model: Firm
//   id, name, firmType, city, address, email, phone, rating, reviewsCount,
//   professionalCount, services[], description, professionalIds[], adminName
//   + timestamps
// firmType: 'Legal Firm' | 'Tax Firm'

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `firm-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const Firm = sequelize.define(
  'Firm',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    name: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    firmType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Legal Firm',
    },
    city: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    address: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    email: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    phone: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    rating: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    reviewsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    professionalCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    services: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    description: { type: DataTypes.TEXT, allowNull: true },
    professionalIds: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    adminName: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
  },
  {
    tableName: 'firms',
    timestamps: true,
    indexes: [{ fields: ['city'] }, { fields: ['firmType'] }],
  }
);

module.exports = Firm;
