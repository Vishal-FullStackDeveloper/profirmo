// Sequelize model: TechConsultantDetail
//   Tech-consultant-specific profile linked one-to-one to a ProfessionalDetail.
//   id, professionalId (unique FK -> professional_details), technologies[],
//   specialization, githubProfile, portfolioUrl, certifications[],
//   experienceProjects[], consultationFee + timestamps

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const jsonField = require('./jsonField');

const genId = () =>
  `tech-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const TechConsultantDetail = sequelize.define(
  'TechConsultantDetail',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    professionalId: { type: DataTypes.STRING(64), allowNull: false },
    technologies: jsonField('technologies', []),
    specialization: { type: DataTypes.STRING, allowNull: true },
    githubProfile: { type: DataTypes.STRING, allowNull: true },
    portfolioUrl: { type: DataTypes.STRING, allowNull: true },
    certifications: jsonField('certifications', []),
    experienceProjects: jsonField('experienceProjects', []),
    consultationFee: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  },
  {
    tableName: 'tech_consultant_specific_details',
    timestamps: true,
    indexes: [{ fields: ['professionalId'], unique: true }],
  }
);

module.exports = TechConsultantDetail;
