// Sequelize model: User
//   id, name, email, password, role, linkedId, firmId + timestamps
// Roles: 'client' | 'professional' | 'firm_admin' | 'firm_professional' | 'platform_admin'
// NOTE: password is stored as plain text here for mock/demo parity only.
//       A real implementation MUST hash it (bcrypt/argon2).

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const genId = () =>
  `user-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genId,
    },
    name: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'client' },
    linkedId: { type: DataTypes.STRING(64), allowNull: true },
    firmId: { type: DataTypes.STRING(64), allowNull: true },
  },
  {
    tableName: 'users',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['firmId'] },
    ],
  }
);

module.exports = User;
