// Migration 012: create the `firm_invitations` table (Phase 8).
// An invitation for a professional to join a law firm.
// Idempotent (CREATE TABLE IF NOT EXISTS).
// Column names/types mirror src/models/FirmInvitation.js exactly.

async function up(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS firm_invitations (
      id              VARCHAR(64)  NOT NULL,
      firmId          VARCHAR(64)  NOT NULL,
      invitedByUserId VARCHAR(64)  NULL,
      email           VARCHAR(255) NOT NULL,
      invitedUserId   VARCHAR(64)  NULL,
      role            VARCHAR(255) NOT NULL DEFAULT 'member',
      status          VARCHAR(255) NOT NULL DEFAULT 'PENDING',
      tokenHash       VARCHAR(255) NULL,
      expiresAt       DATETIME     NULL,
      respondedAt     DATETIME     NULL,
      createdAt       DATETIME     NOT NULL,
      updatedAt       DATETIME     NOT NULL,
      PRIMARY KEY (id),
      INDEX idx_firm_invitations_firmId (firmId),
      INDEX idx_firm_invitations_email (email),
      INDEX idx_firm_invitations_invitedUserId (invitedUserId),
      INDEX idx_firm_invitations_status (status),
      CONSTRAINT fk_firm_invitations_firmId
        FOREIGN KEY (firmId) REFERENCES law_firms (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function down(sequelize) {
  await sequelize.query('DROP TABLE IF EXISTS firm_invitations');
}

module.exports = { up, down };
