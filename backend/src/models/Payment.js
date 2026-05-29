// Sequelize model: Payment
// One row per Razorpay payment attempt. Money is stored in PAISE (integer)
// to avoid floating-point rounding — Razorpay's API also operates in paise.
//
// Lifecycle:
//   created    — order placed with Razorpay, awaiting client payment
//   paid       — signature verified server-side, escrow credited
//   failed     — Razorpay reported payment.failed OR signature mismatch
//   refunded   — admin issued a refund (partial or full, see refundedAmount)

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `pay-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const Payment = sequelize.define(
  'Payment',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    bookingId: { type: DataTypes.STRING(64), allowNull: true },
    // payer (client)
    userId: { type: DataTypes.STRING(64), allowNull: false },
    // payee (the professional whose escrow gets credited on success)
    professionalUserId: { type: DataTypes.STRING(64), allowNull: false },

    razorpayOrderId: { type: DataTypes.STRING(128), allowNull: false },
    razorpayPaymentId: { type: DataTypes.STRING(128), allowNull: true },
    razorpaySignature: { type: DataTypes.STRING(256), allowNull: true },
    receipt: { type: DataTypes.STRING(128), allowNull: true },

    // All amounts in paise (integer). amount = gross charged to the client.
    amount: { type: DataTypes.INTEGER, allowNull: false },
    currency: {
      type: DataTypes.STRING(8),
      allowNull: false,
      defaultValue: 'INR',
    },
    // platformFee + netAmount = amount. Computed at verify time from
    // env.platformFeeBps so historical rates stick to historical rows.
    platformFee: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    netAmount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    status: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: 'created',
    },
    method: { type: DataTypes.STRING(32), allowNull: true },
    failureReason: { type: DataTypes.STRING(255), allowNull: true },
    refundedAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    capturedAt: { type: DataTypes.DATE, allowNull: true },
    // Raw Razorpay payload (order + payment objects) for audit / debugging.
    rawOrder: { type: DataTypes.JSON, allowNull: true },
    rawPayment: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: 'payments',
    timestamps: true,
    indexes: [
      { fields: ['bookingId'] },
      { fields: ['userId'] },
      { fields: ['professionalUserId'] },
      { fields: ['razorpayOrderId'] },
      { fields: ['razorpayPaymentId'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = Payment;
