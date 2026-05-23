// Sequelize model: LawFirm
//   Phase-2 firm entity owned by a user.
//   id, ownerUserId (FK -> users), firmName, registrationNumber, logo,
//   website, establishedYear, about, headquarters, contactEmail,
//   contactNumber, totalEmployees, practiceAreas[], socialLinks{},
//   registrationCertificate, businessLicense, taxDocuments[] + timestamps

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const jsonField = require('./jsonField');

const genId = () =>
  `lawfirm-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const LawFirm = sequelize.define(
  'LawFirm',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    ownerUserId: { type: DataTypes.STRING(64), allowNull: false },
    firmName: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    registrationNumber: { type: DataTypes.STRING, allowNull: true },
    logo: { type: DataTypes.STRING, allowNull: true },
    website: { type: DataTypes.STRING, allowNull: true },
    establishedYear: { type: DataTypes.INTEGER, allowNull: true },
    about: { type: DataTypes.TEXT, allowNull: true },
    headquarters: { type: DataTypes.STRING, allowNull: true },
    contactEmail: { type: DataTypes.STRING, allowNull: true },
    contactNumber: { type: DataTypes.STRING, allowNull: true },
    totalEmployees: { type: DataTypes.INTEGER, allowNull: true },
    practiceAreas: jsonField('practiceAreas', []),
    socialLinks: jsonField('socialLinks', {}),
    registrationCertificate: { type: DataTypes.STRING, allowNull: true },
    businessLicense: { type: DataTypes.STRING, allowNull: true },
    taxDocuments: jsonField('taxDocuments', []),
    // --- Phase-8: firm approval workflow ---------------------------------
    // PENDING_APPROVAL | ACTIVE | REJECTED | MODIFICATIONS_REQUESTED
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'PENDING_APPROVAL',
    },
    // --- Listing additive columns ----------------------------------------
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: true, defaultValue: 0 },
    reviewsCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    tableName: 'law_firms',
    timestamps: true,
    indexes: [{ fields: ['ownerUserId'] }, { fields: ['status'] }],
  }
);

module.exports = LawFirm;
