// Sequelize model: FirmMember
//   Join row linking a ProfessionalDetail to a LawFirm.
//   id, firmId (FK -> law_firms), professionalId (FK -> professional_details),
//   role, joiningDate, status + timestamps
// status: 'active' | 'inactive'

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `fmember-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const FirmMember = sequelize.define(
  'FirmMember',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    firmId: { type: DataTypes.STRING(64), allowNull: false },
    professionalId: { type: DataTypes.STRING(64), allowNull: false },
    role: { type: DataTypes.STRING, allowNull: true },
    joiningDate: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    tableName: 'firm_members',
    timestamps: true,
    indexes: [
      { fields: ['firmId'] },
      { fields: ['professionalId'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = FirmMember;
