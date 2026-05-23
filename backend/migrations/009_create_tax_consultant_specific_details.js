// Migration 009: create the `tax_consultant_specific_details` table (Phase 7).
// Tax-consultant-specific profile, one row per professional_details (unique).
// Idempotent (CREATE TABLE IF NOT EXISTS).
// Column names/types mirror src/models/TaxConsultantDetail.js exactly.
// JSON columns are stored as LONGTEXT (MariaDB JSON alias).

async function up(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS tax_consultant_specific_details (
      id                       VARCHAR(64)  NOT NULL,
      professionalId           VARCHAR(64)  NOT NULL,
      taxRegistrationNumber    VARCHAR(255) NULL,
      specializationAreas      LONGTEXT     NULL,
      gstExpertise             TINYINT(1)   NOT NULL DEFAULT 0,
      incomeTaxExpertise       TINYINT(1)   NOT NULL DEFAULT 0,
      corporateTaxExpertise    TINYINT(1)   NOT NULL DEFAULT 0,
      businessAdvisory         TINYINT(1)   NOT NULL DEFAULT 0,
      accountingServices       TINYINT(1)   NOT NULL DEFAULT 0,
      financialPlanning        TINYINT(1)   NOT NULL DEFAULT 0,
      consultationType         VARCHAR(255) NULL,
      taxConsultantCertificate VARCHAR(255) NULL,
      registrationCertificate  VARCHAR(255) NULL,
      professionalLicense      VARCHAR(255) NULL,
      supportingCertifications LONGTEXT     NULL,
      createdAt                DATETIME     NOT NULL,
      updatedAt                DATETIME     NOT NULL,
      PRIMARY KEY (id),
      UNIQUE INDEX idx_tax_consultant_details_professionalId (professionalId),
      CONSTRAINT fk_tax_consultant_details_professionalId
        FOREIGN KEY (professionalId) REFERENCES professional_details (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function down(sequelize) {
  await sequelize.query('DROP TABLE IF EXISTS tax_consultant_specific_details');
}

module.exports = { up, down };
