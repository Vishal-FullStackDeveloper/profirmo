// Sequelize model: AdminSetting — simple key/value store for platform
// configuration the admin can edit from the dashboard (no redeploy needed).
// Values are stored as strings; the service layer coerces them per-key.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminSetting = sequelize.define(
  'AdminSetting',
  {
    key: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
    },
    value: { type: DataTypes.TEXT, allowNull: true },
    label: { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    updatedByUserId: { type: DataTypes.STRING(64), allowNull: true },
  },
  {
    tableName: 'admin_settings',
    timestamps: true,
  }
);

module.exports = AdminSetting;
