// Sequelize model: Address
//   id, userId (FK -> users), country, state, city, addressLine, postalCode
//   + timestamps
// Phase-2: one postal address per user.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `addr-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const Address = sequelize.define(
  'Address',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    userId: { type: DataTypes.STRING(64), allowNull: false },
    country: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    addressLine: { type: DataTypes.STRING, allowNull: true },
    postalCode: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: 'addresses',
    timestamps: true,
    indexes: [{ fields: ['userId'] }],
  }
);

module.exports = Address;
