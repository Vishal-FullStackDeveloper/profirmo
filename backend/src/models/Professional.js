// Sequelize model: Professional
//   id, name, email, phone, professionType, specialization, city, experience,
//   languages[], rating, reviewsCount, perMinuteRate, availableNow,
//   profileImage, bio, registrationNumber, firmId, servicesOffered[],
//   availabilitySlots[], verified, status + timestamps
// status: 'approved' | 'pending'

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const jsonField = require('./jsonField');

const genId = () =>
  `prof-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const Professional = sequelize.define(
  'Professional',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    name: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    email: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    phone: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    professionType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    city: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    languages: jsonField('languages', []),
    rating: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    reviewsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    perMinuteRate: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    availableNow: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    profileImage: { type: DataTypes.STRING, allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    firmId: { type: DataTypes.STRING(64), allowNull: true },
    servicesOffered: jsonField('servicesOffered', []),
    availabilitySlots: jsonField('availabilitySlots', []),
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    tableName: 'professionals',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['city'] },
      { fields: ['professionType'] },
      { fields: ['firmId'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = Professional;
