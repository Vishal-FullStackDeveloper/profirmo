// Sequelize model: LeadActivity
//   Polymorphic activity feed shared by Lead and Opportunity. Stores the
//   actor (when known), an action string ('lead.created',
//   'lead.status_changed', 'lead.note_added', 'opportunity.created',
//   'opportunity.converted_to_client', ...) and a small JSON payload with
//   before / after values or a free-form comment.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `act-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const LeadActivity = sequelize.define(
  'LeadActivity',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    entityType: { type: DataTypes.STRING(20), allowNull: false },
    entityId: { type: DataTypes.STRING(64), allowNull: false },
    action: { type: DataTypes.STRING(64), allowNull: false },
    actorUserId: { type: DataTypes.STRING(64), allowNull: true },
    actorName: { type: DataTypes.STRING(255), allowNull: true },
    fromValue: { type: DataTypes.STRING(255), allowNull: true },
    toValue: { type: DataTypes.STRING(255), allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'lead_activities',
    timestamps: true,
    indexes: [
      { fields: ['entityType', 'entityId'] },
      { fields: ['createdAt'] },
    ],
  }
);

module.exports = LeadActivity;
