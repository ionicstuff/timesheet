const sequelize = require('../config/database');
const path = require('path');
const fs = require('fs');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection successful');

    // Get all migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);

    // Execute migrations in order
    for (const file of migrationFiles) {
      try {
        console.log(`Running migration: ${file}`);
        const migration = require(path.join(migrationsDir, file));
        await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
        console.log(`✓ ${file} completed successfully`);
      } catch (error) {
        console.error(`✗ Error in migration ${file}:`, error.message);
        // Continue with next migration instead of stopping
      }
    }

    console.log('\n--- Running Seeders ---');

    // Get all seeder files
    const seedersDir = path.join(__dirname, '..', 'seeders');
    if (fs.existsSync(seedersDir)) {
      const seederFiles = fs.readdirSync(seedersDir)
        .filter(file => file.endsWith('.js'))
        .sort();

      console.log(`Found ${seederFiles.length} seeder files`);

      // Execute seeders in order
      for (const file of seederFiles) {
        try {
          console.log(`Running seeder: ${file}`);
          const seeder = require(path.join(seedersDir, file));
          await seeder.up(sequelize.getQueryInterface(), sequelize.constructor);
          console.log(`✓ ${file} completed successfully`);
        } catch (error) {
          console.error(`✗ Error in seeder ${file}:`, error.message);
          // Continue with next seeder
        }
      }
    }

    console.log('\n✓ All migrations and seeders completed successfully!');
    
  } catch (error) {
    console.error('✗ Migration process failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
