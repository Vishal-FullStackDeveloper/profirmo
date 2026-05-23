// Migration 005: create the `law_firms` table.
// Phase-2 firm entity owned by a user.
// Idempotent (CREATE TABLE IF NOT EXISTS).
// Column names/types mirror src/models/LawFirm.js exactly.

async function up(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS law_firms (
      id                      VARCHAR(64)  NOT NULL,
      ownerUserId             VARCHAR(64)  NOT NULL,
      firmName                VARCHAR(255) NOT NULL DEFAULT '',
      registrationNumber      VARCHAR(255) NULL,
      logo                    VARCHAR(255) NULL,
      website                 VARCHAR(255) NULL,
      establishedYear         INT          NULL,
      about                   TEXT         NULL,
      headquarters            VARCHAR(255) NULL,
      contactEmail            VARCHAR(255) NULL,
      contactNumber           VARCHAR(255) NULL,
      totalEmployees          INT          NULL,
      practiceAreas           LONGTEXT     NULL,
      socialLinks             LONGTEXT     NULL,
      registrationCertificate VARCHAR(255) NULL,
      businessLicense         VARCHAR(255) NULL,
      taxDocuments            LONGTEXT     NULL,
      createdAt               DATETIME     NOT NULL,
      updatedAt               DATETIME     NOT NULL,
      PRIMARY KEY (id),
      INDEX idx_law_firms_ownerUserId (ownerUserId),
      CONSTRAINT fk_law_firms_ownerUserId
        FOREIGN KEY (ownerUserId) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function down(sequelize) {
  await sequelize.query('DROP TABLE IF EXISTS law_firms');
}

module.exports = { up, down };
