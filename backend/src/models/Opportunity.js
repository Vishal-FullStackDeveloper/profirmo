// Sequelize model: Opportunity
//   A qualified lead promoted to an opportunity. When the opportunity is
//   itself converted, a User row (role=client) is created and the
//   `clientId` column is set so the full
//   Lead -> Opportunity -> User chain stays linked.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () => `opp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const Opportunity = sequelize.define(
  'Opportunity',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    leadId: { type: DataTypes.STRING(64), allowNull: false },
    fullName: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(40), allowNull: false },
    source: { type: DataTypes.STRING(64), allowNull: true },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'Open',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    assignedToUserId: { type: DataTypes.STRING(64), allowNull: true },
    clientId: { type: DataTypes.STRING(64), allowNull: true },
    convertedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'opportunities',
    timestamps: true,
    indexes: [
      { fields: ['leadId'] },
      { fields: ['status'] },
      { fields: ['assignedToUserId'] },
    ],
  }
);

module.exports = Opportunity;
