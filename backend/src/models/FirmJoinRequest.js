// Sequelize model: FirmJoinRequest
//   A professional's request to join a law firm. The firm owner / co-owner
//   approves or rejects it; approval creates a FirmMember row.
//   id, firmId, userId, professionalId, message, status, decidedByUserId,
//   decidedAt + timestamps
//
// status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `joinreq-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const FirmJoinRequest = sequelize.define(
  'FirmJoinRequest',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    firmId: { type: DataTypes.STRING(64), allowNull: false },
    // The requesting professional's user account.
    userId: { type: DataTypes.STRING(64), allowNull: false },
    // The requesting professional's ProfessionalDetail id.
    professionalId: { type: DataTypes.STRING(64), allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    decidedByUserId: { type: DataTypes.STRING(64), allowNull: true },
    decidedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'firm_join_requests',
    timestamps: true,
    indexes: [
      { fields: ['firmId'] },
      { fields: ['userId'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = FirmJoinRequest;
