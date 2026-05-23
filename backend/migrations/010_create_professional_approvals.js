// Migration 010: create the `professional_approvals` table (Phase 7).
// Tracks the admin approval lifecycle of a professional registration.
// One row per professional user.
// Idempotent (CREATE TABLE IF NOT EXISTS).
// Column names/types mirror src/models/ProfessionalApproval.js exactly.

async function up(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS professional_approvals (
      id                   VARCHAR(64)  NOT NULL,
      userId               VARCHAR(64)  NOT NULL,
      professionalDetailId VARCHAR(64)  NULL,
      professionalType     VARCHAR(255) NULL,
      status               VARCHAR(255) NOT NULL DEFAULT 'PENDING_APPROVAL',
      submittedAt          DATETIME     NULL,
      reviewedAt           DATETIME     NULL,
      reviewedBy           VARCHAR(64)  NULL,
      rejectionReason      TEXT         NULL,
      requestedInfo        TEXT         NULL,
      resubmissionCount    INT          NOT NULL DEFAULT 0,
      createdAt            DATETIME     NOT NULL,
      updatedAt            DATETIME     NOT NULL,
      PRIMARY KEY (id),
      INDEX idx_professional_approvals_userId (userId),
      INDEX idx_professional_approvals_status (status),
      CONSTRAINT fk_professional_approvals_userId
        FOREIGN KEY (userId) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function down(sequelize) {
  await sequelize.query('DROP TABLE IF EXISTS professional_approvals');
}

module.exports = { up, down };
