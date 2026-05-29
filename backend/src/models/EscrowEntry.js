// Sequelize model: EscrowEntry
// One row per paid Payment, tracking the escrow state machine independently
// of the wallet ledger. The wallet ledger answers "how much does this pro
// have?"; this table answers "where is THIS particular consultation's
// money in its lifecycle?" — which the admin reconciles against bookings
// and reviews.
//
// Status machine (linear unless a refund happens):
//   escrowed          — payment captured, awaiting consultation
//   awaiting_review   — booking completed, awaiting client review
//   ready_to_release  — review submitted, withdrawable by the pro
//   payout_requested  — pro filed a payout, admin approval pending
//   released          — admin approved + funds debited from escrow
//   withdrawn         — payout marked paid by admin
//   refunded          — payment refunded; escrow reversed

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `escrow-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const EscrowEntry = sequelize.define(
  'EscrowEntry',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    paymentId: { type: DataTypes.STRING(64), allowNull: false },
    bookingId: { type: DataTypes.STRING(64), allowNull: true },
    professionalUserId: { type: DataTypes.STRING(64), allowNull: false },
    // All amounts in paise.
    grossAmount: { type: DataTypes.INTEGER, allowNull: false },
    platformFee: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    netAmount: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'escrowed',
    },
    reviewId: { type: DataTypes.STRING(64), allowNull: true },
    payoutRequestId: { type: DataTypes.STRING(64), allowNull: true },
    releasedAt: { type: DataTypes.DATE, allowNull: true },
    withdrawnAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'escrow_entries',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['paymentId'] },
      { fields: ['professionalUserId'] },
      { fields: ['status'] },
      { fields: ['payoutRequestId'] },
    ],
  }
);

module.exports = EscrowEntry;
