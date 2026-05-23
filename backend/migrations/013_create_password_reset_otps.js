// Migration 013: create the `password_reset_otps` table.
// One row per password-reset OTP issued to a user.
// Idempotent (CREATE TABLE IF NOT EXISTS).
// Column names/types mirror src/models/PasswordResetOtp.js exactly.
// userId / email are plain indexed columns — no FOREIGN KEY constraint.

async function up(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS password_reset_otps (
      id           VARCHAR(64)  NOT NULL,
      userId       VARCHAR(64)  NOT NULL,
      email        VARCHAR(255) NOT NULL,
      otpHash      VARCHAR(255) NOT NULL,
      expiresAt    DATETIME     NOT NULL,
      used         TINYINT(1)   NOT NULL DEFAULT 0,
      verified     TINYINT(1)   NOT NULL DEFAULT 0,
      attemptCount INT          NOT NULL DEFAULT 0,
      resendCount  INT          NOT NULL DEFAULT 0,
      lastSentAt   DATETIME     NULL,
      createdAt    DATETIME     NOT NULL,
      updatedAt    DATETIME     NOT NULL,
      PRIMARY KEY (id),
      INDEX idx_password_reset_otps_userId (userId),
      INDEX idx_password_reset_otps_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function down(sequelize) {
  await sequelize.query('DROP TABLE IF EXISTS password_reset_otps');
}

module.exports = { up, down };
