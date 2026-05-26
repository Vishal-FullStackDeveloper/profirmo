// Sequelize model: ProfessionalDetail
//   Extended professional profile linked one-to-one to a user.
//   id, userId (unique FK -> users), professionalType, designation,
//   organization, yearsOfExperience, bio, about, skills[], expertise[],
//   languages[], website, linkedin, certifications[], education[],
//   achievements[], profileResume, licenseDocument, identityDocument,
//   certificationsDocuments[], verificationStatus, verifiedBy,
//   verificationDate + timestamps
// professionalType: 'Lawyer' | 'Tech Consultant' | 'Tax Consultant'
//   | 'Business Consultant' | 'CA' | 'Other'

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const jsonField = require('./jsonField');

const genId = () =>
  `pdetail-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const ProfessionalDetail = sequelize.define(
  'ProfessionalDetail',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    userId: { type: DataTypes.STRING(64), allowNull: false },
    professionalType: { type: DataTypes.STRING, allowNull: true },
    designation: { type: DataTypes.STRING, allowNull: true },
    organization: { type: DataTypes.STRING, allowNull: true },
    yearsOfExperience: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    bio: { type: DataTypes.TEXT, allowNull: true },
    about: { type: DataTypes.TEXT, allowNull: true },
    skills: jsonField('skills', []),
    expertise: jsonField('expertise', []),
    languages: jsonField('languages', []),
    // Admin-managed taxonomy: ids referencing rows in `sub_categories`.
    // The parent category is inferred via sub_categories.categoryId.
    subCategoryIds: jsonField('subCategoryIds', []),
    // Array of city names (matching `cities.name`) where the professional
    // actually practises. Separate from the address city — they may live in
    // Mumbai but practise across Mumbai, Pune and Delhi.
    practiceCities: jsonField('practiceCities', []),
    website: { type: DataTypes.STRING, allowNull: true },
    linkedin: { type: DataTypes.STRING, allowNull: true },
    certifications: jsonField('certifications', []),
    education: jsonField('education', []),
    achievements: jsonField('achievements', []),
    profileResume: { type: DataTypes.STRING, allowNull: true },
    licenseDocument: { type: DataTypes.STRING, allowNull: true },
    identityDocument: { type: DataTypes.STRING, allowNull: true },
    certificationsDocuments: jsonField('certificationsDocuments', []),
    verificationStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },
    verifiedBy: { type: DataTypes.STRING, allowNull: true },
    verificationDate: { type: DataTypes.DATE, allowNull: true },
    // --- Phase-7 additive columns ----------------------------------------
    consultationFee: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    availability: jsonField('availability', []),
    // Live "available now" toggle the booking page uses to enable instant
    // consultations. NULL is treated as "available" so legacy rows remain
    // bookable until the professional explicitly toggles off.
    availableNow: { type: DataTypes.BOOLEAN, allowNull: true },
    degreeCertificate: { type: DataTypes.STRING, allowNull: true },
    // --- Listing additive columns ----------------------------------------
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: true, defaultValue: 0 },
    reviewsCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    tableName: 'professional_details',
    timestamps: true,
    indexes: [
      { fields: ['userId'], unique: true },
      { fields: ['professionalType'] },
      { fields: ['verificationStatus'] },
    ],
  }
);

module.exports = ProfessionalDetail;
