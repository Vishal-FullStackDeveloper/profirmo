// Migration 004: create the `tech_consultant_specific_details` table.
// Tech-consultant-specific profile, one row per professional_details (unique).
// Idempotent (CREATE TABLE IF NOT EXISTS).
// Column names/types mirror src/models/TechConsultantDetail.js exactly.

async function up(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS tech_consultant_specific_details (
      id                 VARCHAR(64)    NOT NULL,
      professionalId     VARCHAR(64)    NOT NULL,
      technologies       LONGTEXT       NULL,
      specialization     VARCHAR(255)   NULL,
      githubProfile      VARCHAR(255)   NULL,
      portfolioUrl       VARCHAR(255)   NULL,
      certifications     LONGTEXT       NULL,
      experienceProjects LONGTEXT       NULL,
      consultationFee    DECIMAL(10,2)  NULL,
      createdAt          DATETIME       NOT NULL,
      updatedAt          DATETIME       NOT NULL,
      PRIMARY KEY (id),
      UNIQUE INDEX idx_tech_details_professionalId (professionalId),
      CONSTRAINT fk_tech_details_professionalId
        FOREIGN KEY (professionalId) REFERENCES professional_details (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function down(sequelize) {
  await sequelize.query(
    'DROP TABLE IF EXISTS tech_consultant_specific_details'
  );
}

module.exports = { up, down };
