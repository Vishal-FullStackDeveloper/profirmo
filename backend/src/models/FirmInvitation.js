// Sequelize model: FirmInvitation (Phase 8)
//   An invitation for a professional to join a law firm.
//
//   id               - generated invitation id (primary key)
//   firmId           - the inviting law firm's id (indexed, FK -> law_firms)
//   invitedByUserId  - the owner / co-owner who sent the invitation
//   email            - the invitee's email address (indexed)
//   invitedUserId    - the matched registered user's id, when known (nullable,
//                      indexed). Backfilled when a not-yet-registered invitee
//                      later registers and is approved.
//   role             - the firm role to grant on accept: 'member' | 'co-owner'
//   status           - PENDING | ACCEPTED | REJECTED | CANCELLED | EXPIRED
//   tokenHash        - SHA-256 hash of the raw invitation token (raw token is
//                      only ever sent in the invitation email)
//   expiresAt        - when the invitation expires
//   respondedAt      - when the invitee accepted / rejected (nullable)
//   + timestamps

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `finv-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const FirmInvitation = sequelize.define(
  'FirmInvitation',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    firmId: { type: DataTypes.STRING(64), allowNull: false },
    invitedByUserId: { type: DataTypes.STRING(64), allowNull: true },
    email: { type: DataTypes.STRING, allowNull: false },
    invitedUserId: { type: DataTypes.STRING(64), allowNull: true },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'member',
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'PENDING',
    },
    tokenHash: { type: DataTypes.STRING, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    respondedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'firm_invitations',
    timestamps: true,
    indexes: [
      { fields: ['firmId'] },
      { fields: ['email'] },
      { fields: ['invitedUserId'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = FirmInvitation;
