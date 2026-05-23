// Migration 002: create the `professional_details` table.
// Extended professional profile, one row per user (unique userId).
// Idempotent (CREATE TABLE IF NOT EXISTS).
// Column names/types mirror src/models/ProfessionalDetail.js exactly.
// JSON columns are stored as LONGTEXT (MariaDB JSON alias).

async function up(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS professional_details (
      id                      VARCHAR(64)  NOT NULL,
      userId                  VARCHAR(64)  NOT NULL,
      professionalType        VARCHAR(255) NULL,
      designation             VARCHAR(255) NULL,
      organization            VARCHAR(255) NULL,
      yearsOfExperience       INT          NOT NULL DEFAULT 0,
      bio                     TEXT         NULL,
      about                   TEXT         NULL,
      skills                  LONGTEXT     NULL,
      expertise               LONGTEXT     NULL,
      languages               LONGTEXT     NULL,
      website                 VARCHAR(255) NULL,
      linkedin                VARCHAR(255) NULL,
      certifications          LONGTEXT     NULL,
      education               LONGTEXT     NULL,
      achievements            LONGTEXT     NULL,
      profileResume           VARCHAR(255) NULL,
      licenseDocument         VARCHAR(255) NULL,
      identityDocument        VARCHAR(255) NULL,
      certificationsDocuments LONGTEXT     NULL,
      verificationStatus      VARCHAR(255) NOT NULL DEFAULT 'pending',
      verifiedBy              VARCHAR(255) NULL,
      verificationDate        DATETIME     NULL,
      createdAt               DATETIME     NOT NULL,
      updatedAt               DATETIME     NOT NULL,
      PRIMARY KEY (id),
      UNIQUE INDEX idx_professional_details_userId (userId),
      INDEX idx_professional_details_type (professionalType),
      INDEX idx_professional_details_verification (verificationStatus),
      CONSTRAINT fk_professional_details_userId
        FOREIGN KEY (userId) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function down(sequelize) {
  await sequelize.query('DROP TABLE IF EXISTS professional_details');
}

module.exports = { up, down };
