// Sequelize model: FirmApproval (Phase 8)
//   Tracks the admin approval lifecycle of a law-firm registration.
//   One row per law firm (LawFirm.hasOne(FirmApproval)).
//
//   id                    - generated approval id (primary key)
//   firmId                - the law firm's id (indexed, FK -> law_firms)
//   submittedByUserId     - the owner user who submitted the firm
//   status                - PENDING_APPROVAL | APPROVED | REJECTED |
//                           MODIFICATIONS_REQUESTED
//   submittedAt           - when the firm was submitted for review
//   reviewedAt            - when an admin acted on it (nullable)
//   reviewedBy            - admin user id who acted (nullable)
//   rejectionReason       - reason text when REJECTED (nullable)
//   requestedModifications- message text when MODIFICATIONS_REQUESTED (nullable)
//   resubmissionCount     - number of times the owner has resubmitted
//   + timestamps

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `fapp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const FirmApproval = sequelize.define(
  'FirmApproval',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    firmId: { type: DataTypes.STRING(64), allowNull: false },
    submittedByUserId: { type: DataTypes.STRING(64), allowNull: true },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'PENDING_APPROVAL',
    },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
    reviewedBy: { type: DataTypes.STRING(64), allowNull: true },
    rejectionReason: { type: DataTypes.TEXT, allowNull: true },
    requestedModifications: { type: DataTypes.TEXT, allowNull: true },
    resubmissionCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'firm_approvals',
    timestamps: true,
    indexes: [{ fields: ['firmId'] }, { fields: ['status'] }],
  }
);

module.exports = FirmApproval;
