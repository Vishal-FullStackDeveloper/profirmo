// Sequelize model: LawyerDetail
//   Lawyer-specific profile linked one-to-one to a ProfessionalDetail.
//   id, professionalId (unique FK -> professional_details),
//   barRegistrationNumber, enrollmentNumber, licenseNumber, practiceAreas[],
//   courtPractice[], jurisdiction, lawDegree, chamberAddress, consultationFee,
//   availability[], barCertificate, advocateLicense, practiceCertificate
//   + timestamps

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const jsonField = require('./jsonField');

const genId = () =>
  `lawyer-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const LawyerDetail = sequelize.define(
  'LawyerDetail',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    professionalId: { type: DataTypes.STRING(64), allowNull: false },
    barRegistrationNumber: { type: DataTypes.STRING, allowNull: true },
    enrollmentNumber: { type: DataTypes.STRING, allowNull: true },
    licenseNumber: { type: DataTypes.STRING, allowNull: true },
    practiceAreas: jsonField('practiceAreas', []),
    courtPractice: jsonField('courtPractice', []),
    jurisdiction: { type: DataTypes.STRING, allowNull: true },
    lawDegree: { type: DataTypes.STRING, allowNull: true },
    chamberAddress: { type: DataTypes.TEXT, allowNull: true },
    consultationFee: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    availability: jsonField('availability', []),
    barCertificate: { type: DataTypes.STRING, allowNull: true },
    advocateLicense: { type: DataTypes.STRING, allowNull: true },
    practiceCertificate: { type: DataTypes.STRING, allowNull: true },
    // --- Phase-7 additive columns ----------------------------------------
    consultationType: { type: DataTypes.STRING, allowNull: true },
    yearsOfPractice: { type: DataTypes.INTEGER, allowNull: true },
    advocateLicenseNumber: { type: DataTypes.STRING, allowNull: true },
    lawDegreeDocument: { type: DataTypes.STRING, allowNull: true },
    supportingCertificates: jsonField('supportingCertificates', []),
  },
  {
    tableName: 'lawyer_specific_details',
    timestamps: true,
    indexes: [{ fields: ['professionalId'], unique: true }],
  }
);

module.exports = LawyerDetail;
