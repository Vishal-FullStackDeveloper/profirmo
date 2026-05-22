// Configured Sequelize instance for the Profirmo backend.
// Built from the centralized `db` config in ./env. All models require this
// instance so they share a single connection pool.

const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: false,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  dialectOptions: env.db.ssl ? { ssl: { rejectUnauthorized: false } } : {},
});

module.exports = sequelize;
