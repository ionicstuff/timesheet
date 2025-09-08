const path = require('path');
const fs = require('fs');
const db = require('../config/database');

async function run() {
  try {
    console.log('Starting migrations...');
    await db.authenticate();
    console.log('Database connected');

    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js')).sort();

    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      console.log('Running migration', file);
      const migration = require(fullPath);
      if (migration && typeof migration.up === 'function') {
        await migration.up(db.getQueryInterface(), require('sequelize'));
        console.log('Applied', file);
      }
    }

    console.log('Migrations complete');
    await db.close();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err);
    process.exit(1);
  }
}

run();
