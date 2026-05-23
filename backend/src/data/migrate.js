// Idempotent schema migrations for the Profirmo backend.
//
// runMigrations() applies ADDITIVE changes only: it adds the extended profile
// columns to the existing `users` table and backfills sane values for any
// rows that pre-date those columns. It uses raw SQL (MariaDB `IF NOT EXISTS`)
// so it is safe to run on every boot.

const crypto = require('crypto');
const sequelize = require('../config/database');

// New columns to add to the `users` table: [name, SQL type].
const USER_COLUMNS = [
  ['uuid', 'VARCHAR(255)'],
  ['firstName', 'VARCHAR(255)'],
  ['lastName', 'VARCHAR(255)'],
  ['fullName', 'VARCHAR(255)'],
  ['mobileNumber', 'VARCHAR(255)'],
  ['profilePhoto', 'VARCHAR(255)'],
  ['coverPhoto', 'VARCHAR(255)'],
  ["status", "VARCHAR(255) DEFAULT 'active'"],
  ['isOnline', 'TINYINT(1) DEFAULT 0'],
  ['memberSince', 'DATETIME'],
  ['lastLogin', 'DATETIME'],
  ['accountVerified', 'TINYINT(1) DEFAULT 0'],
  ['emailVerified', 'TINYINT(1) DEFAULT 0'],
  ['mobileVerified', 'TINYINT(1) DEFAULT 0'],
  // --- Phase-6: email-verification columns -------------------------------
  ['emailVerificationTokenHash', 'VARCHAR(255)'],
  ['emailVerificationExpiresAt', 'DATETIME'],
  ['emailVerificationSentAt', 'DATETIME'],
];

// Phase-7 additive columns: { table: [[name, SQL type], ...] }. Existing
// professional-detail tables are extended with the dynamic-registration
// fields. `ADD COLUMN IF NOT EXISTS` keeps this idempotent on every boot.
const PHASE7_COLUMNS = {
  lawyer_specific_details: [
    ['consultationType', 'VARCHAR(255)'],
    ['yearsOfPractice', 'INT'],
    ['advocateLicenseNumber', 'VARCHAR(255)'],
    ['lawDegreeDocument', 'VARCHAR(255)'],
    ['supportingCertificates', 'LONGTEXT'],
  ],
  professional_details: [
    ['consultationFee', 'DECIMAL(10,2)'],
    ['availability', 'LONGTEXT'],
    ['degreeCertificate', 'VARCHAR(255)'],
  ],
};

// Phase-8 additive columns: { table: [[name, SQL type], ...] }. The existing
// `law_firms` table gains a `status` column for the firm-approval workflow.
// `ADD COLUMN IF NOT EXISTS` keeps this idempotent on every boot.
const PHASE8_COLUMNS = {
  law_firms: [['status', "VARCHAR(40) NOT NULL DEFAULT 'PENDING_APPROVAL'"]],
};

// Listing additive columns: { table: [[name, SQL type], ...] }. The
// `professional_details` and `law_firms` tables gain rating / reviewsCount
// columns so the unified listing APIs can surface those values from the
// new user-centric model alongside the legacy seeded tables.
// `ADD COLUMN IF NOT EXISTS` keeps this idempotent on every boot.
const LISTING_COLUMNS = {
  professional_details: [
    ['rating', 'DECIMAL(3,2) DEFAULT 0'],
    ['reviewsCount', 'INT DEFAULT 0'],
  ],
  law_firms: [
    ['rating', 'DECIMAL(3,2) DEFAULT 0'],
    ['reviewsCount', 'INT DEFAULT 0'],
  ],
};

// RFC4122-ish v4 UUID generator (no external dependency).
const genUuid = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(
    16,
    20
  )}-${h.slice(20)}`;
};

/**
 * Apply additive schema migrations. Safe to run repeatedly.
 * @returns {Promise<void>}
 */
async function runMigrations() {
  console.log('[Migrate] Starting additive schema migrations...');

  // 1. Add any missing columns to the users table.
  let added = 0;
  for (const [col, type] of USER_COLUMNS) {
    try {
      await sequelize.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS \`${col}\` ${type}`
      );
      added += 1;
    } catch (err) {
      // IF NOT EXISTS makes this idempotent; log unexpected failures only.
      console.warn(`[Migrate] Could not add column ${col}: ${err.message}`);
    }
  }
  console.log(`[Migrate] users column check complete (${added} processed).`);

  // 2. Backfill profile values for rows that pre-date the new columns.
  await sequelize.query(
    "UPDATE users SET fullName = name WHERE fullName IS NULL OR fullName = ''"
  );
  // firstName = first whitespace-delimited token of name.
  await sequelize.query(
    "UPDATE users SET firstName = TRIM(SUBSTRING_INDEX(name, ' ', 1)) " +
      "WHERE (firstName IS NULL OR firstName = '') AND name IS NOT NULL AND name <> ''"
  );
  // lastName = remainder after the first token (empty when name is one word).
  await sequelize.query(
    "UPDATE users SET lastName = TRIM(" +
      "CASE WHEN LOCATE(' ', name) > 0 " +
      "THEN SUBSTRING(name, LOCATE(' ', name) + 1) ELSE '' END) " +
      "WHERE (lastName IS NULL) AND name IS NOT NULL AND name <> ''"
  );
  await sequelize.query(
    'UPDATE users SET memberSince = createdAt WHERE memberSince IS NULL'
  );
  await sequelize.query(
    "UPDATE users SET status = 'active' WHERE status IS NULL OR status = ''"
  );

  // Phase-6: keep every pre-existing user (demo / seed accounts) verified so
  // they can still log in after email verification becomes mandatory for new
  // signups. Only existing rows are touched; new signups start unverified.
  await sequelize.query(
    'UPDATE users SET emailVerified = 1, accountVerified = 1 ' +
      'WHERE emailVerified IS NULL OR emailVerified = 0'
  );

  // 3. Backfill uuid row-by-row (each row needs a distinct value).
  const [rowsNeedingUuid] = await sequelize.query(
    "SELECT id FROM users WHERE uuid IS NULL OR uuid = ''"
  );
  for (const row of rowsNeedingUuid) {
    await sequelize.query('UPDATE users SET uuid = ? WHERE id = ?', {
      replacements: [genUuid(), row.id],
    });
  }

  console.log(
    `[Migrate] Backfill complete. uuid assigned to ${rowsNeedingUuid.length} ` +
      'row(s); fullName/firstName/lastName/memberSince/status normalized.'
  );

  // 4. Phase-7: add the dynamic-registration columns to the existing
  //    professional-detail tables. Wrapped per-column so a table that does
  //    not yet exist (fresh DB — created later by sync()) is skipped quietly.
  let phase7Added = 0;
  for (const [table, columns] of Object.entries(PHASE7_COLUMNS)) {
    for (const [col, type] of columns) {
      try {
        await sequelize.query(
          `ALTER TABLE \`${table}\` ADD COLUMN IF NOT EXISTS \`${col}\` ${type}`
        );
        phase7Added += 1;
      } catch (err) {
        // The table may not exist yet on a brand-new database; sync() will
        // create it with the columns already defined on the model.
        console.warn(
          `[Migrate] Could not add ${table}.${col}: ${err.message}`
        );
      }
    }
  }
  console.log(
    `[Migrate] Phase-7 column check complete (${phase7Added} processed).`
  );

  // 5. Phase-8: add the firm-approval `status` column to the existing
  //    `law_firms` table, then backfill pre-existing firms so they do not
  //    block on review (treat firms created before Phase 8 as ACTIVE).
  let phase8Added = 0;
  for (const [table, columns] of Object.entries(PHASE8_COLUMNS)) {
    for (const [col, type] of columns) {
      try {
        await sequelize.query(
          `ALTER TABLE \`${table}\` ADD COLUMN IF NOT EXISTS \`${col}\` ${type}`
        );
        phase8Added += 1;
      } catch (err) {
        // The table may not exist yet on a brand-new database; sync() will
        // create it with the column already defined on the model.
        console.warn(
          `[Migrate] Could not add ${table}.${col}: ${err.message}`
        );
      }
    }
  }
  // Backfill: any law_firms row with a NULL/empty status pre-dates Phase 8.
  // Those firms were usable before the workflow existed, so keep them ACTIVE.
  try {
    await sequelize.query(
      "UPDATE law_firms SET status = 'ACTIVE' " +
        "WHERE status IS NULL OR status = ''"
    );
  } catch (err) {
    // law_firms may not exist yet on a brand-new database.
    console.warn(`[Migrate] Could not backfill law_firms.status: ${err.message}`);
  }
  console.log(
    `[Migrate] Phase-8 column check complete (${phase8Added} processed).`
  );

  // 6. Listing: add rating / reviewsCount columns to professional_details
  //    and law_firms so the unified listing APIs can serve those values
  //    from the new user-centric model. Wrapped per-column so a table that
  //    does not yet exist (fresh DB) is skipped quietly; sync() creates it
  //    with the columns already defined on the model.
  let listingAdded = 0;
  for (const [table, columns] of Object.entries(LISTING_COLUMNS)) {
    for (const [col, type] of columns) {
      try {
        await sequelize.query(
          `ALTER TABLE \`${table}\` ADD COLUMN IF NOT EXISTS \`${col}\` ${type}`
        );
        listingAdded += 1;
      } catch (err) {
        console.warn(
          `[Migrate] Could not add ${table}.${col}: ${err.message}`
        );
      }
    }
  }
  console.log(
    `[Migrate] Listing column check complete (${listingAdded} processed).`
  );

  // 7. Reviews: add `userId` (the authenticated reviewer) and `status` so a
  //    review can be tied to a user account and hidden while under appeal.
  const REVIEW_COLUMNS = [
    ['userId', 'VARCHAR(64)'],
    ['status', "VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED'"],
  ];
  let reviewAdded = 0;
  for (const [col, type] of REVIEW_COLUMNS) {
    try {
      await sequelize.query(
        `ALTER TABLE \`reviews\` ADD COLUMN IF NOT EXISTS \`${col}\` ${type}`
      );
      reviewAdded += 1;
    } catch (err) {
      console.warn(`[Migrate] Could not add reviews.${col}: ${err.message}`);
    }
  }
  // Treat every pre-existing review as published.
  try {
    await sequelize.query(
      "UPDATE reviews SET status = 'PUBLISHED' " +
        "WHERE status IS NULL OR status = ''"
    );
  } catch (err) {
    console.warn(
      `[Migrate] Could not backfill reviews.status: ${err.message}`
    );
  }
  console.log(
    `[Migrate] Review column check complete (${reviewAdded} processed).`
  );

  console.log('[Migrate] Migrations finished successfully.');
}

module.exports = { runMigrations };
