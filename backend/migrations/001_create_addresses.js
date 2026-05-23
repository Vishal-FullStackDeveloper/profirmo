// Migration 001: create the `addresses` table.
// One postal address per user. Idempotent (CREATE TABLE IF NOT EXISTS).
// Column names/types mirror src/models/Address.js exactly.

async function up(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS addresses (
      id          VARCHAR(64)  NOT NULL,
      userId      VARCHAR(64)  NOT NULL,
      country     VARCHAR(255) NULL,
      state       VARCHAR(255) NULL,
      city        VARCHAR(255) NULL,
      addressLine VARCHAR(255) NULL,
      postalCode  VARCHAR(255) NULL,
      createdAt   DATETIME     NOT NULL,
      updatedAt   DATETIME     NOT NULL,
      PRIMARY KEY (id),
      INDEX idx_addresses_userId (userId),
      CONSTRAINT fk_addresses_userId
        FOREIGN KEY (userId) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function down(sequelize) {
  await sequelize.query('DROP TABLE IF EXISTS addresses');
}

module.exports = { up, down };
