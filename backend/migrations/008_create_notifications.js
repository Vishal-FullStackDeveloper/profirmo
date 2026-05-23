// Migration 008: create the `notifications` table (Phase 6).
// One row per in-app notification shown to a user.
// Idempotent (CREATE TABLE IF NOT EXISTS).
// Column names/types mirror src/models/Notification.js exactly.

async function up(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id        VARCHAR(64)  NOT NULL,
      userId    VARCHAR(64)  NOT NULL,
      type      VARCHAR(255) NOT NULL,
      title     VARCHAR(255) NOT NULL,
      message   TEXT         NOT NULL,
      link      VARCHAR(255) NULL,
      isRead    TINYINT(1)   NOT NULL DEFAULT 0,
      readAt    DATETIME     NULL,
      metadata  LONGTEXT     NULL,
      createdAt DATETIME     NOT NULL,
      updatedAt DATETIME     NOT NULL,
      PRIMARY KEY (id),
      INDEX idx_notifications_userId (userId),
      INDEX idx_notifications_isRead (isRead),
      CONSTRAINT fk_notifications_userId
        FOREIGN KEY (userId) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function down(sequelize) {
  await sequelize.query('DROP TABLE IF EXISTS notifications');
}

module.exports = { up, down };
