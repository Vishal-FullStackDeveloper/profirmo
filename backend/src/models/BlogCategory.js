// Sequelize model: BlogCategory
// Admin-managed list. Each post belongs to exactly one category; the slug
// drives the public /blog?category=… filter.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `blogcat-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const BlogCategory = sequelize.define(
  'BlogCategory',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(140), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(500), allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'blog_categories',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [{ unique: true, fields: ['slug'] }],
  }
);

module.exports = BlogCategory;
