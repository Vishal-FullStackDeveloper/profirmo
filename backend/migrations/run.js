// Migration runner for the Profirmo backend.
//
// Usage:
//   node migrations/run.js          -> runs every migration's up() in order
//   node migrations/run.js down     -> runs every migration's down() in
//                                      reverse order (drops the tables)
//
// Migration files are the numbered `NNN_*.js` files in this directory. Each
// exports `up(sequelize)` and `down(sequelize)`. The `up` migrations use
// `CREATE TABLE IF NOT EXISTS`, so this runner is safe to run repeatedly and
// is independent of the boot-time `sync()` in src/server.js.

const fs = require('fs');
const path = require('path');
const sequelize = require('../src/config/database');

// Collect numbered migration files, sorted ascending by filename.
function loadMigrations() {
  return fs
    .readdirSync(__dirname)
    .filter((f) => /^\d{3}_.*\.js$/.test(f))
    .sort()
    .map((file) => ({
      file,
      migration: require(path.join(__dirname, file)),
    }));
}

async function run() {
  const direction = (process.argv[2] || 'up').toLowerCase();
  if (direction !== 'up' && direction !== 'down') {
    console.error(`[Migrate] Unknown argument "${direction}". Use up|down.`);
    process.exit(1);
  }

  let migrations = loadMigrations();
  if (direction === 'down') migrations = migrations.reverse();

  console.log(
    `[Migrate] Running ${migrations.length} migration(s) "${direction}"...`
  );

  try {
    await sequelize.authenticate();
    console.log('[Migrate] Database connection established.');

    let applied = 0;
    for (const { file, migration } of migrations) {
      const fn = migration[direction];
      if (typeof fn !== 'function') {
        console.warn(`[Migrate] ${file} has no ${direction}() — skipped.`);
        continue;
      }
      await fn(sequelize);
      applied += 1;
      console.log(`[Migrate]   ${direction} OK: ${file}`);
    }

    console.log(
      `[Migrate] Done. ${applied}/${migrations.length} migration(s) ` +
        `applied "${direction}".`
    );
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('[Migrate] Migration failed:');
    console.error(err.message || err);
    try {
      await sequelize.close();
    } catch (closeErr) {
      // ignore close errors during failure path
    }
    process.exit(1);
  }
}

run();
