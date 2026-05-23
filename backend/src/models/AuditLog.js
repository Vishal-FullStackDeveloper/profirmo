// Sequelize model: AuditLog (Phase 5)
//   Append-only record of security-relevant events (logins, logouts,
//   signups, ...). Used by the admin audit-log endpoint.
//
//   id        - generated audit-log id (primary key)
//   userId    - acting user id, nullable + indexed. Deliberately has NO
//               foreign-key constraint so failed logins (unknown user) and
//               events for since-deleted users still log cleanly.
//   action    - event name, e.g. auth.login, auth.login_failed,
//               auth.logout, auth.signup
//   entity    - affected entity type (nullable)
//   entityId  - affected entity id (nullable)
//   status    - 'success' | 'failure'
//   ipAddress - client IP at the time of the event
//   userAgent - client User-Agent at the time of the event
//   metadata  - free-form JSON context (nullable)
//   + timestamps

const { DataTypes } = require('sequelize');
const crypto = require('crypto');
const sequelize = require('../config/database');

const genAuditId = () =>
  `aud-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genAuditId,
    },
    // No FK constraint on purpose — see header comment.
    userId: { type: DataTypes.STRING(64), allowNull: true },
    action: { type: DataTypes.STRING, allowNull: false },
    entity: { type: DataTypes.STRING, allowNull: true },
    entityId: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'success' },
    ipAddress: { type: DataTypes.STRING, allowNull: true },
    userAgent: { type: DataTypes.STRING, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: 'audit_logs',
    timestamps: true,
    indexes: [{ fields: ['userId'] }, { fields: ['action'] }],
  }
);

module.exports = AuditLog;
