// Sequelize model: TaxConsultantDetail (Phase 7)
//   Tax-consultant-specific profile linked one-to-one to a ProfessionalDetail.
//   id, professionalId (unique FK -> professional_details),
//   taxRegistrationNumber, specializationAreas[], gstExpertise,
//   incomeTaxExpertise, corporateTaxExpertise, businessAdvisory,
//   accountingServices, financialPlanning, consultationType,
//   taxConsultantCertificate, registrationCertificate, professionalLicense,
//   supportingCertifications[] + timestamps

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const jsonField = require('./jsonField');

const genId = () =>
  `taxc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const TaxConsultantDetail = sequelize.define(
  'TaxConsultantDetail',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    professionalId: { type: DataTypes.STRING(64), allowNull: false },
    taxRegistrationNumber: { type: DataTypes.STRING, allowNull: true },
    specializationAreas: jsonField('specializationAreas', []),
    gstExpertise: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    incomeTaxExpertise: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    corporateTaxExpertise: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    businessAdvisory: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    accountingServices: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    financialPlanning: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    consultationType: { type: DataTypes.STRING, allowNull: true },
    taxConsultantCertificate: { type: DataTypes.STRING, allowNull: true },
    registrationCertificate: { type: DataTypes.STRING, allowNull: true },
    professionalLicense: { type: DataTypes.STRING, allowNull: true },
    supportingCertifications: jsonField('supportingCertifications', []),
  },
  {
    tableName: 'tax_consultant_specific_details',
    timestamps: true,
    indexes: [{ fields: ['professionalId'], unique: true }],
  }
);

module.exports = TaxConsultantDetail;
