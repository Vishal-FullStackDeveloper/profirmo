// Migration 011: create the `firm_approvals` table (Phase 8).
// Tracks the admin approval lifecycle of a law-firm registration.
// One row per law firm.
// Idempotent (CREATE TABLE IF NOT EXISTS).
// Column names/types mirror src/models/FirmApproval.js exactly.

async function up(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS firm_approvals (
      id                     VARCHAR(64)  NOT NULL,
      firmId                 VARCHAR(64)  NOT NULL,
      submittedByUserId      VARCHAR(64)  NULL,
      status                 VARCHAR(255) NOT NULL DEFAULT 'PENDING_APPROVAL',
      submittedAt            DATETIME     NULL,
      reviewedAt             DATETIME     NULL,
      reviewedBy             VARCHAR(64)  NULL,
      rejectionReason        TEXT         NULL,
      requestedModifications TEXT         NULL,
      resubmissionCount      INT          NOT NULL DEFAULT 0,
      createdAt              DATETIME     NOT NULL,
      updatedAt              DATETIME     NOT NULL,
      PRIMARY KEY (id),
      INDEX idx_firm_approvals_firmId (firmId),
      INDEX idx_firm_approvals_status (status),
      CONSTRAINT fk_firm_approvals_firmId
        FOREIGN KEY (firmId) REFERENCES law_firms (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function down(sequelize) {
  await sequelize.query('DROP TABLE IF EXISTS firm_approvals');
}

module.exports = { up, down };
