// Sequelize model: Notification (Phase 6)
//   One row per in-app notification shown to a user.
//
//   id       - generated notification id (primary key)
//   userId   - recipient user id (indexed, FK -> users, CASCADE on delete)
//   type     - logical category, e.g. 'welcome', 'system'
//   title    - short headline
//   message  - notification body text
//   link     - optional in-app link the notification points to (nullable)
//   isRead   - whether the recipient has read it (indexed)
//   readAt   - time it was marked read (nullable)
//   metadata - free-form JSON context (nullable)
//   + timestamps

const { DataTypes } = require('sequelize');
const crypto = require('crypto');
const sequelize = require('../config/database');

const genNotificationId = () =>
  `ntf-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genNotificationId,
    },
    userId: { type: DataTypes.STRING(64), allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    link: { type: DataTypes.STRING, allowNull: true },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    readAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: 'notifications',
    timestamps: true,
    indexes: [{ fields: ['userId'] }, { fields: ['isRead'] }],
  }
);

module.exports = Notification;
