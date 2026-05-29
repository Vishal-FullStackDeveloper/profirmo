// Sequelize model: WalletTransaction
// Immutable ledger entries for each professional's wallet. Wallet balances
// (totalEarnings, escrowedBalance, readyToRelease, withdrawnAmount,
// availableForPayout) are derived on-demand by summing the relevant rows —
// no snapshot table to drift out of sync.
//
// `entryType` is the accounting direction (credit / debit) and `category`
// classifies WHY the entry exists. Examples:
//   credit / escrow_in        — payment captured, money parked in escrow
//   credit / escrow_release   — review submitted, money moved to "ready"
//   debit  / payout           — admin marked payout paid
//   credit / refund_reversal  — payment refunded, escrow undone
//   credit/debit / adjustment — manual admin correction

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `wtx-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const WalletTransaction = sequelize.define(
  'WalletTransaction',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    // The professional whose wallet this entry belongs to.
    walletUserId: { type: DataTypes.STRING(64), allowNull: false },
    entryType: { type: DataTypes.STRING(8), allowNull: false }, // credit | debit
    category: { type: DataTypes.STRING(32), allowNull: false },
    // Amount in paise. Always positive — direction comes from entryType.
    amount: { type: DataTypes.INTEGER, allowNull: false },
    // Pointers back to the originating records, for traceability.
    bookingId: { type: DataTypes.STRING(64), allowNull: true },
    paymentId: { type: DataTypes.STRING(64), allowNull: true },
    escrowId: { type: DataTypes.STRING(64), allowNull: true },
    payoutRequestId: { type: DataTypes.STRING(64), allowNull: true },
    // Mirrors the escrow status at the time of write so listings can render
    // a status badge without re-joining EscrowEntry.
    escrowStatus: { type: DataTypes.STRING(32), allowNull: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: 'wallet_transactions',
    timestamps: true,
    indexes: [
      { fields: ['walletUserId'] },
      { fields: ['paymentId'] },
      { fields: ['escrowId'] },
      { fields: ['payoutRequestId'] },
      { fields: ['category'] },
    ],
  }
);

module.exports = WalletTransaction;
