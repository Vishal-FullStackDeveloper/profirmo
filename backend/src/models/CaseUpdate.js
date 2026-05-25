// Sequelize model: CaseUpdate
//   A timestamped, attachment-carrying update from a professional on a case.
//   Distinct from CaseNote (which is a plain text note): an update has a
//   `scheduledAt` (the date/time the update describes — defaults to "now"),
//   an optional `nextHearingDate`, and an array of `attachments` (file
//   URLs the user uploaded via PhotoUpload / FileUpload).
//
//   Every saved nextHearingDate is mirrored to a CaseLog row so the case's
//   audit trail surfaces the full hearing history.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const jsonField = require('./jsonField');

const genId = () =>
  `cupd-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const CaseUpdate = sequelize.define(
  'CaseUpdate',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    caseId: { type: DataTypes.STRING(64), allowNull: false },
    // The professional who wrote the update.
    authorUserId: { type: DataTypes.STRING(64), allowNull: true },
    authorName: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    // Optional short title — useful when scanning the timeline.
    title: { type: DataTypes.STRING, allowNull: true },
    // Date/time the update describes. Defaults to NOW() on the server but
    // the user can pick a past/future moment.
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    // Free-text body.
    body: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    // Optional next hearing date the update is recording.
    nextHearingDate: { type: DataTypes.DATEONLY, allowNull: true },
    // Array of { url, name, type, size } describing each attached file.
    attachments: jsonField('attachments', []),
  },
  {
    tableName: 'case_updates',
    timestamps: true,
    indexes: [
      { fields: ['caseId'] },
      { fields: ['authorUserId'] },
      { fields: ['scheduledAt'] },
    ],
  }
);

module.exports = CaseUpdate;
