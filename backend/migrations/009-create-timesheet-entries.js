'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Create table timesheet_entries
    await queryInterface.createTable('timesheet_entries', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      timesheet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'timesheets', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      task_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'tasks', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      minutes: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      is_billable: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      ended_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Indexes
    await queryInterface.addIndex('timesheet_entries', ['timesheet_id']);
    await queryInterface.addIndex('timesheet_entries', ['project_id', 'task_id']);
    await queryInterface.addIndex('timesheet_entries', ['is_billable']);
  },

  async down (queryInterface) {
    await queryInterface.dropTable('timesheet_entries');
  }
};
