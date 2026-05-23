// Migration 003: create the `lawyer_specific_details` table.
// Lawyer-specific profile, one row per professional_details (unique).
// Idempotent (CREATE TABLE IF NOT EXISTS).
// Column names/types mirror src/models/LawyerDetail.js exactly.

async function up(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS lawyer_specific_details (
      id                    VARCHAR(64)    NOT NULL,
      professionalId        VARCHAR(64)    NOT NULL,
      barRegistrationNumber VARCHAR(255)   NULL,
      enrollmentNumber      VARCHAR(255)   NULL,
      licenseNumber         VARCHAR(255)   NULL,
      practiceAreas         LONGTEXT       NULL,
      courtPractice         LONGTEXT       NULL,
      jurisdiction          VARCHAR(255)   NULL,
      lawDegree             VARCHAR(255)   NULL,
      chamberAddress        TEXT           NULL,
      consultationFee       DECIMAL(10,2)  NULL,
      availability          LONGTEXT       NULL,
      barCertificate        VARCHAR(255)   NULL,
      advocateLicense       VARCHAR(255)   NULL,
      practiceCertificate   VARCHAR(255)   NULL,
      createdAt             DATETIME       NOT NULL,
      updatedAt             DATETIME       NOT NULL,
      PRIMARY KEY (id),
      UNIQUE INDEX idx_lawyer_details_professionalId (professionalId),
      CONSTRAINT fk_lawyer_details_professionalId
        FOREIGN KEY (professionalId) REFERENCES professional_details (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function down(sequelize) {
  await sequelize.query('DROP TABLE IF EXISTS lawyer_specific_details');
}

module.exports = { up, down };
