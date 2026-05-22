// Sequelize model: Client
//   id, name, email, phone, city, userType + timestamps
// userType: 'individual' | 'business'

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const Client = sequelize.define(
  'Client',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    name: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    email: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    phone: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    city: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    userType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'individual',
    },
  },
  {
    tableName: 'clients',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['city'] },
      { fields: ['userType'] },
    ],
  }
);

module.exports = Client;
