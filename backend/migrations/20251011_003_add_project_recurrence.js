"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('projects', 'recurrence_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('projects', 'recurrence_frequency', {
      type: Sequelize.ENUM('daily', 'weekly', 'monthly'),
      allowNull: true,
    });

    await queryInterface.addColumn('projects', 'recurrence_interval', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
    });

    await queryInterface.addColumn('projects', 'recurrence_until', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    await queryInterface.addColumn('projects', 'recurrence_count', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Max number of additional occurrences to generate',
    });

    await queryInterface.addIndex('projects', ['recurrence_active'], { name: 'idx_projects_recurrence_active' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('projects', 'idx_projects_recurrence_active');
    await queryInterface.removeColumn('projects', 'recurrence_count');
    await queryInterface.removeColumn('projects', 'recurrence_until');
    await queryInterface.removeColumn('projects', 'recurrence_interval');
    await queryInterface.removeColumn('projects', 'recurrence_frequency');
    await queryInterface.removeColumn('projects', 'recurrence_active');
    // Note: ENUM type cleanup may be required in Postgres if using ENUMs across migrations.
  }
};
