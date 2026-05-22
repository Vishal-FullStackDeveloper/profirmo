// Model registry + association definitions for the Profirmo backend.
//
// Requiring this module loads the Sequelize instance and every model, and
// wires up the foreign-key relationships ("table connections"). Associations
// declare real database FOREIGN KEY constraints with referential actions.
// Tables must be created parents-first (see SYNC_ORDER in server.js).

const sequelize = require('../config/database');

const User = require('./User');
const Professional = require('./Professional');
const Firm = require('./Firm');
const Client = require('./Client');
const Case = require('./Case');
const Booking = require('./Booking');
const Consultation = require('./Consultation');
const Review = require('./Review');
const File = require('./File');

// Optional relationship — clearing the parent nulls the foreign key.
const fkSetNull = (foreignKey) => ({
  foreignKey,
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// Ownership relationship — removing the parent removes the children.
const fkCascade = (foreignKey) => ({
  foreignKey,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// --- Firm relationships ----------------------------------------------------
Firm.hasMany(Professional, fkSetNull('firmId'));
Professional.belongsTo(Firm, fkSetNull('firmId'));

Firm.hasMany(Case, fkSetNull('firmId'));
Case.belongsTo(Firm, fkSetNull('firmId'));

Firm.hasMany(Review, fkSetNull('firmId'));
Review.belongsTo(Firm, fkSetNull('firmId'));

// --- Client relationships --------------------------------------------------
Client.hasMany(Case, fkCascade('clientId'));
Case.belongsTo(Client, fkCascade('clientId'));

Client.hasMany(Booking, fkCascade('clientId'));
Booking.belongsTo(Client, fkCascade('clientId'));

Client.hasMany(Consultation, fkCascade('clientId'));
Consultation.belongsTo(Client, fkCascade('clientId'));

Client.hasMany(Review, fkCascade('clientId'));
Review.belongsTo(Client, fkCascade('clientId'));

// --- Professional relationships -------------------------------------------
Professional.hasMany(Case, fkCascade('professionalId'));
Case.belongsTo(Professional, fkCascade('professionalId'));

Professional.hasMany(Booking, fkCascade('professionalId'));
Booking.belongsTo(Professional, fkCascade('professionalId'));

Professional.hasMany(Consultation, fkCascade('professionalId'));
Consultation.belongsTo(Professional, fkCascade('professionalId'));

Professional.hasMany(Review, fkSetNull('professionalId'));
Review.belongsTo(Professional, fkSetNull('professionalId'));

// --- Booking <-> Consultation ---------------------------------------------
Booking.hasOne(Consultation, fkSetNull('bookingId'));
Consultation.belongsTo(Booking, fkSetNull('bookingId'));

// --- Case <-> File ---------------------------------------------------------
Case.hasMany(File, fkCascade('caseId'));
File.belongsTo(Case, fkCascade('caseId'));

// NOTE: User keeps linkedId / firmId as plain columns. linkedId is
// polymorphic (points to a client, professional or firm depending on role),
// so no association / constraint is declared for it.

module.exports = {
  sequelize,
  User,
  Professional,
  Firm,
  Client,
  Case,
  Booking,
  Consultation,
  Review,
  File,
};
