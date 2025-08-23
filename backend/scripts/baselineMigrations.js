const sequelize = require('../config/database');

async function main() {
  const qi = sequelize.getQueryInterface();
  const names = [
    '001-create-role-masters.js',
    '002-create-module-masters.js',
    '003-create-permission-masters.js',
    '004-create-role-permissions.js',
    '005-create-user-hierarchies.js',
    '006-create-clients.js',
    '007-create-projects.js',
    '008-add-role-id-to-users.js',
    '009-create-spocs.js',
    '009-create-timesheet-entries.js',
    '010-add-project-fields.js',
    '010-allow-submitted-status.js',
    '011-create-tasks.js',
    '012-add-task-acceptance.js',
    '013-add-password-reset-fields.js'
  ];

  try {
    // Ensure SequelizeMeta table exists (sequelize-cli normally creates it)
    await sequelize.query('CREATE TABLE IF NOT EXISTS "SequelizeMeta" ("name" VARCHAR(255) NOT NULL UNIQUE, PRIMARY KEY ("name"));');

    // Fetch existing rows to avoid duplicates
    const [rows] = await sequelize.query('SELECT name FROM "SequelizeMeta"');
    const existing = new Set(rows.map(r => r.name));

    const toInsert = names.filter(n => !existing.has(n)).map(n => ({ name: n }));
    if (toInsert.length > 0) {
      await qi.bulkInsert('SequelizeMeta', toInsert);
      console.log(`Inserted ${toInsert.length} baseline migration entries.`);
    } else {
      console.log('No baseline entries needed.');
    }
  } catch (err) {
    console.error('Baseline failed:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();

