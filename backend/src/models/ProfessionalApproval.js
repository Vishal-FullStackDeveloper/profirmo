// Sequelize model: ProfessionalApproval (Phase 7)
//   Tracks the admin approval lifecycle of a professional registration.
//   One row per professional user.
//
//   id                  - generated approval id (primary key)
//   userId              - the professional's user id (indexed, FK -> users)
//   professionalDetailId- the linked ProfessionalDetail id (nullable)
//   professionalType    - 'Legal Consultant' | 'Tax Consultant'
//   status              - PENDING_APPROVAL | APPROVED | REJECTED | INFO_REQUESTED
//   submittedAt         - when the application was submitted
//   reviewedAt          - when an admin acted on it (nullable)
//   reviewedBy          - admin user id who acted (nullable)
//   rejectionReason     - reason text when REJECTED (nullable)
//   requestedInfo       - message text when INFO_REQUESTED (nullable)
//   resubmissionCount   - number of times the professional has resubmitted
//   + timestamps

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `papp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const ProfessionalApproval = sequelize.define(
  'ProfessionalApproval',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    userId: { type: DataTypes.STRING(64), allowNull: false },
    professionalDetailId: { type: DataTypes.STRING(64), allowNull: true },
    professionalType: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'PENDING_APPROVAL',
    },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
    reviewedBy: { type: DataTypes.STRING(64), allowNull: true },
    rejectionReason: { type: DataTypes.TEXT, allowNull: true },
    requestedInfo: { type: DataTypes.TEXT, allowNull: true },
    resubmissionCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'professional_approvals',
    timestamps: true,
    indexes: [{ fields: ['userId'] }, { fields: ['status'] }],
  }
);

module.exports = ProfessionalApproval;
