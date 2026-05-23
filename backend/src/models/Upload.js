// Sequelize model: Upload (Phase 4)
//   Records one row per file uploaded to local-disk storage.
//
//   id           - generated upload id (primary key)
//   userId       - owning user id (indexed, FK -> users, CASCADE on delete)
//   category     - logical bucket (profile_photo, resume, firm_logo, other, ...)
//   originalName - client-supplied filename (display only, never used on disk)
//   storedName   - server-generated UUID filename actually written to disk
//   mimeType     - validated MIME type of the stored file
//   size         - file size in bytes
//   url          - relative public path, e.g. /uploads/<storedName>
//   + timestamps

const { DataTypes } = require('sequelize');
const crypto = require('crypto');
const sequelize = require('../config/database');

const genUploadId = () =>
  `upl-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

const Upload = sequelize.define(
  'Upload',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genUploadId,
    },
    userId: { type: DataTypes.STRING(64), allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    originalName: { type: DataTypes.STRING, allowNull: false },
    storedName: { type: DataTypes.STRING, allowNull: false },
    mimeType: { type: DataTypes.STRING, allowNull: false },
    size: { type: DataTypes.INTEGER, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: 'uploads',
    timestamps: true,
    indexes: [{ fields: ['userId'] }],
  }
);

module.exports = Upload;
