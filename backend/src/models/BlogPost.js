// Sequelize model: BlogPost
//
// Content is stored as raw HTML (the admin editor inserts <p>, <h2>, etc.)
// so the public detail page can render it directly via dangerouslySetInnerHTML
// — the editor lives in admin-only territory so the trust boundary is fine.
//
// SEO surface: seoTitle / seoDescription fall back to title / excerpt.
// OG surface: ogTitle / ogDescription / ogImage are explicit overrides
// (twitter:* tags share the OG values in generateMetadata).

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () => `blog-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const BlogPost = sequelize.define(
  'BlogPost',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(280), allowNull: false, unique: true },
    excerpt: { type: DataTypes.STRING(500), allowNull: true },
    content: { type: DataTypes.TEXT('long'), allowNull: false },
    featuredImage: { type: DataTypes.STRING(500), allowNull: true },

    categoryId: { type: DataTypes.STRING(64), allowNull: true },
    // JSON list of BlogTag.id. Avoids a join table for what is essentially
    // a small set per post; admin UI fans them out to chips on read.
    tagIds: { type: DataTypes.JSON, allowNull: true },

    authorUserId: { type: DataTypes.STRING(64), allowNull: true },
    authorName: { type: DataTypes.STRING(255), allowNull: true },

    status: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: 'draft',
    },
    publishedAt: { type: DataTypes.DATE, allowNull: true },

    // SEO + OG (Open Graph) metadata. Falling back to title / excerpt /
    // featuredImage when null is the public page's responsibility.
    seoTitle: { type: DataTypes.STRING(255), allowNull: true },
    seoDescription: { type: DataTypes.STRING(500), allowNull: true },
    ogTitle: { type: DataTypes.STRING(255), allowNull: true },
    ogDescription: { type: DataTypes.STRING(500), allowNull: true },
    ogImage: { type: DataTypes.STRING(500), allowNull: true },
    readingMinutes: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'blog_posts',
    timestamps: true,
    // The DB default is latin1 in this environment, but blog content needs
    // the ₹ sign, em-dashes, and Devanagari for Hindi posts. Pin the table
    // explicitly so a sync() never silently downgrades the charset again.
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      { unique: true, fields: ['slug'] },
      { fields: ['status'] },
      { fields: ['categoryId'] },
      { fields: ['publishedAt'] },
    ],
  }
);

module.exports = BlogPost;
