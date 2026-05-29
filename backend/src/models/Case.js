// Sequelize model: Case
//   id, clientId, professionalId, firmId, title, category, status,
//   description + timestamps
// status: 'open' | 'in-progress' | 'closed'
// Attached files live in the separate `files` table (see File model).

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const jsonField = require('./jsonField');

const genId = () =>
  `case-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const Case = sequelize.define(
  'Case',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    // Primary client for this case — kept for back-compat with surfaces
    // that expect a single client. New code should read `clientIds` (and
    // the decorated `clients` array on API responses) instead.
    clientId: { type: DataTypes.STRING(64), allowNull: true },
    // Multi-client support — a case may have any number of clients (e.g.
    // joint litigation). Stored as a JSON array of users.id values. The
    // afterFind hook in models/index.js parses it for raw queries.
    clientIds: jsonField('clientIds', []),
    // Primary assignee — back-compat for single-assignee surfaces.
    professionalId: { type: DataTypes.STRING(64), allowNull: true },
    // Multi-assignee support: a case can be assigned to any number of
    // professionals. Stored as a JSON array of public professional ids
    // (legacy `prof-N` OR new `pdetail-...`). The afterFind hook parses
    // this for raw queries; the primary `professionalId` column stays in
    // sync (= professionalIds[0]).
    professionalIds: jsonField('professionalIds', []),
    firmId: { type: DataTypes.STRING(64), allowNull: true },
    title: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    category: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'open',
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    // Descriptive fields added for the firm case-management module.
    priority: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'medium',
    },
    caseNumber: { type: DataTypes.STRING, allowNull: true },
    courtName: { type: DataTypes.STRING, allowNull: true },
    opposingParty: { type: DataTypes.STRING, allowNull: true },
    nextHearingDate: { type: DataTypes.DATEONLY, allowNull: true },
    // Optional: when a firm creates the case it may not yet have a
    // professional assigned. assignedByUserId records who made the assignment.
    assignedByUserId: { type: DataTypes.STRING(64), allowNull: true },
    assignedAt: { type: DataTypes.DATE, allowNull: true },
    // Anchors a case back to the booking that produced it. NULL for cases
    // created manually (firm or admin). Enforced as "one live case per
    // booking" by the convertBookingToCase controller — deleting the case
    // clears the row, so the next conversion is free to create another.
    bookingId: { type: DataTypes.STRING(64), allowNull: true },
  },
  {
    tableName: 'cases',
    timestamps: true,
    indexes: [
      { fields: ['clientId'] },
      { fields: ['professionalId'] },
      { fields: ['firmId'] },
      { fields: ['status'] },
      { fields: ['category'] },
      // One live case per booking — see convertBookingToCase. Not unique at
      // the DB level (NULL is allowed for cases created without a booking).
      { fields: ['bookingId'] },
    ],
  }
);

module.exports = Case;
