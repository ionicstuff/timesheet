'use strict';

module.exports = {
  async up (queryInterface) {
    // The column is VARCHAR with a CHECK constraint in Postgres.
    // We drop the old constraint and re-add with 'submitted' allowed.
    await queryInterface.sequelize.query(`
      ALTER TABLE public.timesheets
      DROP CONSTRAINT IF EXISTS timesheets_status_check;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE public.timesheets
      ADD CONSTRAINT timesheets_status_check
      CHECK (status IN ('pending','submitted','approved','rejected'));
    `);
  },

  async down (queryInterface) {
    // Revert to original constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE public.timesheets
      DROP CONSTRAINT IF EXISTS timesheets_status_check;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE public.timesheets
      ADD CONSTRAINT timesheets_status_check
      CHECK (status IN ('pending','approved','rejected'));
    `);
  }
};
