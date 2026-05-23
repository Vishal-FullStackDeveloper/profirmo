// Migration 006: create the `firm_members` table.
// Join row linking a professional_details to a law_firms.
// Idempotent (CREATE TABLE IF NOT EXISTS).
// Column names/types mirror src/models/FirmMember.js exactly.

async function up(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS firm_members (
      id             VARCHAR(64)  NOT NULL,
      firmId         VARCHAR(64)  NOT NULL,
      professionalId VARCHAR(64)  NOT NULL,
      role           VARCHAR(255) NULL,
      joiningDate    DATETIME     NULL,
      status         VARCHAR(255) NOT NULL DEFAULT 'active',
      createdAt      DATETIME     NOT NULL,
      updatedAt      DATETIME     NOT NULL,
      PRIMARY KEY (id),
      INDEX idx_firm_members_firmId (firmId),
      INDEX idx_firm_members_professionalId (professionalId),
      INDEX idx_firm_members_status (status),
      CONSTRAINT fk_firm_members_firmId
        FOREIGN KEY (firmId) REFERENCES law_firms (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_firm_members_professionalId
        FOREIGN KEY (professionalId) REFERENCES professional_details (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function down(sequelize) {
  await sequelize.query('DROP TABLE IF EXISTS firm_members');
}

module.exports = { up, down };
