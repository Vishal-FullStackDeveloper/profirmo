// Sequelize model: ReviewAppeal
//   A professional's appeal against a review they believe is wrong/unfair.
//   id, reviewId, professionalId, appealedByUserId, reason, status,
//   adminNote, resolvedByUserId, resolvedAt + timestamps
//
// status: 'PENDING'  — awaiting an admin decision (review is hidden meanwhile)
//         'ACCEPTED' — admin agreed; the offending review was removed
//         'REJECTED' — admin disagreed; the review was restored to public

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `appeal-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const ReviewAppeal = sequelize.define(
  'ReviewAppeal',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    reviewId: { type: DataTypes.STRING(64), allowNull: false },
    // The professional listing id the review belongs to.
    professionalId: { type: DataTypes.STRING(64), allowNull: true },
    // The user (professional account) who filed the appeal.
    appealedByUserId: { type: DataTypes.STRING(64), allowNull: true },
    reason: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    adminNote: { type: DataTypes.TEXT, allowNull: true },
    resolvedByUserId: { type: DataTypes.STRING(64), allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'review_appeals',
    timestamps: true,
    indexes: [
      { fields: ['reviewId'] },
      { fields: ['professionalId'] },
      { fields: ['appealedByUserId'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = ReviewAppeal;
