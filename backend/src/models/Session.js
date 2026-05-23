// Sequelize model: Session
//   Persists one row per issued refresh token so sessions survive restarts
//   and can be individually revoked. The raw refresh token is NEVER stored;
//   only its SHA-256 hash (tokenHash) is persisted.
//
//   id        - generated session id (primary key)
//   userId    - owning user id (indexed, FK -> users, CASCADE on delete)
//   tokenHash - SHA-256 hex of the opaque refresh token
//   userAgent - client User-Agent at session creation
//   ipAddress - client IP at session creation
//   expiresAt - absolute expiry timestamp
//   revokedAt - set when the session is invalidated (logout/rotation)

const { DataTypes } = require('sequelize');
const crypto = require('crypto');
const sequelize = require('../config/database');

const genSessionId = () =>
  `sess-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

const Session = sequelize.define(
  'Session',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genSessionId,
    },
    userId: { type: DataTypes.STRING(64), allowNull: false },
    tokenHash: { type: DataTypes.STRING(255), allowNull: false },
    userAgent: { type: DataTypes.STRING, allowNull: true },
    ipAddress: { type: DataTypes.STRING, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    revokedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'sessions',
    timestamps: true,
    indexes: [{ fields: ['userId'] }, { fields: ['tokenHash'] }],
  }
);

module.exports = Session;
