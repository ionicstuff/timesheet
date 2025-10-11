// Script to apply recurrence columns to projects table without sequelize-cli
// Safe to run multiple times (idempotent)
const sequelize = require('../config/database');

async function run() {
  try {
    console.log('Applying recurrence columns...');
    // Create ENUM type if not exists
    await sequelize.query(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_projects_recurrence_frequency') THEN
        CREATE TYPE "enum_projects_recurrence_frequency" AS ENUM ('daily','weekly','monthly');
      END IF;
    END$$;`);

    // Add columns if not exists
    await sequelize.query(`ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS recurrence_active boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS recurrence_frequency "enum_projects_recurrence_frequency",
      ADD COLUMN IF NOT EXISTS recurrence_interval integer,
      ADD COLUMN IF NOT EXISTS recurrence_until date,
      ADD COLUMN IF NOT EXISTS recurrence_count integer;`);

    // Set default for interval if column exists but is null
    await sequelize.query(`UPDATE projects SET recurrence_interval = 1 WHERE recurrence_interval IS NULL;`);

    // Create index if not exists
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_projects_recurrence_active ON projects(recurrence_active);`);

    console.log('Recurrence columns applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to apply recurrence columns:', err);
    process.exit(1);
  }
}

run();
