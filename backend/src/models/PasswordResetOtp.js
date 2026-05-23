// Sequelize model: PasswordResetOtp
//   One row per password-reset OTP issued to a user.
//
//   id           - generated row id (primary key)
//   userId       - the requesting user's id (indexed; plain column, no FK)
//   email        - the email the OTP was sent to (indexed; plain column)
//   otpHash      - bcrypt hash of the 6-digit OTP (never stored in clear)
//   expiresAt    - when the OTP stops being valid
//   used         - whether the row has been consumed / invalidated
//   verified     - whether the OTP has been successfully verified
//   attemptCount - number of incorrect verification attempts so far
//   resendCount  - number of times a fresh OTP was re-sent on this row
//   lastSentAt   - when the most recent OTP email was queued
//   + timestamps
//
// NOTE: userId / email are plain indexed columns — no association is declared
// (see src/models/index.js). This keeps the table fully additive.

const { DataTypes } = require('sequelize');
const crypto = require('crypto');
const sequelize = require('../config/database');

const genId = () =>
  `pro-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

const PasswordResetOtp = sequelize.define(
  'PasswordResetOtp',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    userId: { type: DataTypes.STRING(64), allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    otpHash: { type: DataTypes.STRING, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    attemptCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    resendCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lastSentAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'password_reset_otps',
    timestamps: true,
    indexes: [{ fields: ['userId'] }, { fields: ['email'] }],
  }
);

module.exports = PasswordResetOtp;
