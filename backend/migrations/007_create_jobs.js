// Migration 007: create the `jobs` table (Phase 6).
// One row per queued background job; polled by the worker.
// Idempotent (CREATE TABLE IF NOT EXISTS).
// Column names/types mirror src/models/Job.js exactly.

async function up(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id          VARCHAR(64)  NOT NULL,
      type        VARCHAR(255) NOT NULL,
      payload     LONGTEXT     NULL,
      status      VARCHAR(255) NOT NULL DEFAULT 'pending',
      attempts    INT          NOT NULL DEFAULT 0,
      maxAttempts INT          NOT NULL DEFAULT 3,
      runAt       DATETIME     NOT NULL,
      lastError   TEXT         NULL,
      completedAt DATETIME     NULL,
      createdAt   DATETIME     NOT NULL,
      updatedAt   DATETIME     NOT NULL,
      PRIMARY KEY (id),
      INDEX idx_jobs_type (type),
      INDEX idx_jobs_status (status),
      INDEX idx_jobs_runAt (runAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function down(sequelize) {
  await sequelize.query('DROP TABLE IF EXISTS jobs');
}

module.exports = { up, down };
