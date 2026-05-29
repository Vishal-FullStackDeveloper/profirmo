// Sequelize model: BookingNote
// Free-text notes attached to a booking. Either side of the booking (the
// client or the assigned professional) can post a note; the row records
// who wrote it so the UI can render speaker labels.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `bnote-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const BookingNote = sequelize.define(
  'BookingNote',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    bookingId: { type: DataTypes.STRING(64), allowNull: false },
    authorUserId: { type: DataTypes.STRING(64), allowNull: false },
    // 'client' | 'professional' — denormalised so listings don't need to
    // re-join Users to render the speaker label.
    authorRole: { type: DataTypes.STRING(32), allowNull: false },
    authorName: { type: DataTypes.STRING(255), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
    // Array of { url, name, mimeType, size } records describing files the
    // author attached. Stored as LONGTEXT (MariaDB JSON column).
    attachments: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: 'booking_notes',
    timestamps: true,
    indexes: [
      { fields: ['bookingId'] },
      { fields: ['authorUserId'] },
    ],
  }
);

module.exports = BookingNote;
