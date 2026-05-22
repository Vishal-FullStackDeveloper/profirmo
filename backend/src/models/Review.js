// Sequelize model: Review
//   id, clientId, clientName, professionalId, firmId, rating, comment, date
//   + timestamps

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `review-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const Review = sequelize.define(
  'Review',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    clientId: { type: DataTypes.STRING(64), allowNull: true },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    professionalId: { type: DataTypes.STRING(64), allowNull: true },
    firmId: { type: DataTypes.STRING(64), allowNull: true },
    rating: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    comment: { type: DataTypes.TEXT, allowNull: true },
    date: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
  },
  {
    tableName: 'reviews',
    timestamps: true,
    indexes: [
      { fields: ['clientId'] },
      { fields: ['professionalId'] },
      { fields: ['firmId'] },
    ],
  }
);

module.exports = Review;
