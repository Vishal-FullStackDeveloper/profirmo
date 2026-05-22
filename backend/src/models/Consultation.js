// Sequelize model: Consultation
//   id, bookingId, clientId, professionalId, callStatus, recordingUrl,
//   transcript, notes, startedAt, endedAt, durationMinutes, cost + timestamps
// callStatus: 'scheduled' | 'ongoing' | 'ended'

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `con-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const Consultation = sequelize.define(
  'Consultation',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    bookingId: { type: DataTypes.STRING(64), allowNull: true },
    clientId: { type: DataTypes.STRING(64), allowNull: true },
    professionalId: { type: DataTypes.STRING(64), allowNull: true },
    callStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'scheduled',
    },
    recordingUrl: { type: DataTypes.STRING, allowNull: true },
    transcript: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true, defaultValue: '' },
    startedAt: { type: DataTypes.DATE, allowNull: true },
    endedAt: { type: DataTypes.DATE, allowNull: true },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    cost: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'consultations',
    timestamps: true,
    indexes: [
      { fields: ['bookingId'] },
      { fields: ['clientId'] },
      { fields: ['professionalId'] },
      { fields: ['callStatus'] },
    ],
  }
);

module.exports = Consultation;
