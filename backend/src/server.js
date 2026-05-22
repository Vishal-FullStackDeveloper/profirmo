const app = require('./app');
const env = require('./config/env');
const db = require('./models');
const { seedDatabase } = require('./data/seed');

// Tables are created parents-first so the foreign-key constraints resolve.
const SYNC_ORDER = [
  db.Firm,
  db.Client,
  db.Professional,
  db.User,
  db.Booking,
  db.Case,
  db.Consultation,
  db.Review,
  db.File,
];

// Boot the Profirmo HTTP server.
//
// Startup sequence:
//   1. Connect to MySQL (sequelize.authenticate).
//   2. Create any missing tables, parents-first (no force, no alter).
//   3. Seed demo data when the database is empty.
//   4. Start listening for HTTP requests.
// A database connection failure is fatal: log clearly and exit.
async function start() {
  try {
    await db.sequelize.authenticate();
    console.log('[DB] Connection established successfully.');

    for (const model of SYNC_ORDER) {
      await model.sync();
    }
    console.log('[DB] Tables synchronized.');

    await seedDatabase();
  } catch (err) {
    console.error('[DB] Failed to initialize database:');
    console.error(err.message || err);
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log('========================================');
    console.log('  Profirmo API');
    console.log(`  Mode:    ${env.nodeEnv}`);
    console.log(`  Port:    ${env.port}`);
    console.log(`  DB:      ${env.db.name}@${env.db.host}:${env.db.port}`);
    console.log(`  Health:  http://localhost:${env.port}/api/health`);
    console.log('========================================');
  });
}

start();
