// Sequelize model: BlogTag
// Free-form tagging. A post carries an array of tag ids on its row (see
// BlogPost.tagIds) — no join table; simpler reads, no orphan-cleanup needed.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `blogtag-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const BlogTag = sequelize.define(
  'BlogTag',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    name: { type: DataTypes.STRING(80), allowNull: false },
    slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  },
  {
    tableName: 'blog_tags',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [{ unique: true, fields: ['slug'] }],
  }
);

module.exports = BlogTag;
