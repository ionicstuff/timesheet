const path = require('path');
const db = require('../config/database');

async function run(filename) {
  try {
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const fullPath = path.join(migrationsDir, filename);
    console.log('Running migration', filename);
    const migration = require(fullPath);
    if (migration && typeof migration.up === 'function') {
      await db.authenticate();
      await migration.up(db.getQueryInterface(), require('sequelize'));
      console.log('Migration applied:', filename);
    } else {
      console.error('Migration file not found or invalid:', filename);
    }
  } catch (err) {
    console.error('Migration failed', err);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}

const fname = process.argv[2];
if (!fname) {
  console.error('Usage: node runOneMigration.js <migration-filename.js>');
  process.exit(1);
}
run(fname).then(()=>process.exit(0));
