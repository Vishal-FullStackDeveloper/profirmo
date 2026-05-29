// Sequelize model: PayoutRequest
// A professional asks to withdraw N paise from their available-for-payout
// balance. The request goes into a `pending` admin queue. The admin
// approves (funds become "released" from escrow) and later marks it paid
// once they've actually wired the money via NEFT/UPI/PayPal.
//
// Status machine:
//   pending   — submitted by the pro, awaiting admin review
//   approved  — admin OK'd it; matching escrow entries flipped to released
//   rejected  — admin declined; funds stay in "ready_to_release"
//   paid      — admin confirmed external transfer; wallet debit recorded

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `payout-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const PayoutRequest = sequelize.define(
  'PayoutRequest',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    professionalUserId: { type: DataTypes.STRING(64), allowNull: false },
    // Amount the pro is requesting, in paise.
    amount: { type: DataTypes.INTEGER, allowNull: false },
    currency: {
      type: DataTypes.STRING(8),
      allowNull: false,
      defaultValue: 'INR',
    },
    method: { type: DataTypes.STRING(16), allowNull: false }, // bank | upi
    // Captured at request time so the admin sees what the pro wants paid to.
    bankAccountName: { type: DataTypes.STRING(255), allowNull: true },
    bankAccountNumber: { type: DataTypes.STRING(64), allowNull: true },
    bankIfsc: { type: DataTypes.STRING(32), allowNull: true },
    upiId: { type: DataTypes.STRING(128), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },

    status: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: 'pending',
    },
    decidedByAdminId: { type: DataTypes.STRING(64), allowNull: true },
    decidedAt: { type: DataTypes.DATE, allowNull: true },
    decisionReason: { type: DataTypes.STRING(500), allowNull: true },
    // External transfer reference (NEFT UTR, UPI txn ref, etc.) recorded by
    // the admin when marking the payout paid.
    transferRef: { type: DataTypes.STRING(128), allowNull: true },
    paidAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'payout_requests',
    timestamps: true,
    indexes: [
      { fields: ['professionalUserId'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = PayoutRequest;
