// Sequelize model: File
//   id, caseId, name, size, type, uploadedAt + timestamps
// Represents an attachment belonging to a Case.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `file-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const File = sequelize.define(
  'File',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    caseId: { type: DataTypes.STRING(64), allowNull: true },
    // Optional link to a CaseUpdate row when this file is attached to a
    // case update (rather than directly to the case).
    caseUpdateId: { type: DataTypes.STRING(64), allowNull: true },
    // Original storage URL the upload service returned (PhotoUpload /
    // FileUpload). Lets the UI render a download link without resolving
    // through the upload registry.
    url: { type: DataTypes.STRING(512), allowNull: true },
    name: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    size: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'application/octet-stream',
    },
    uploadedAt: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
  },
  {
    tableName: 'files',
    timestamps: true,
    indexes: [{ fields: ['caseId'] }, { fields: ['caseUpdateId'] }],
  }
);

module.exports = File;
