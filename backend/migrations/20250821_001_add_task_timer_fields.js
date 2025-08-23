"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'paused' to enum, if the enum exists
    try {
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_type t WHERE t.typname = 'enum_tasks_status') THEN
            IF NOT EXISTS (
              SELECT 1 FROM pg_enum e
              JOIN pg_type t ON e.enumtypid = t.oid
              WHERE t.typname = 'enum_tasks_status' AND e.enumlabel = 'paused'
            ) THEN
              ALTER TYPE "enum_tasks_status" ADD VALUE 'paused';
            END IF;
          END IF;
        END$$;
      `);
    } catch (e) {
      // Ignore if enum/table does not exist yet or already contains the value
    }

    // Add new columns to tasks
    await queryInterface.addColumn('tasks', 'started_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('tasks', 'completed_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('tasks', 'total_tracked_seconds', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });
    await queryInterface.addColumn('tasks', 'active_timer_started_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('tasks', 'last_paused_at', { type: Sequelize.DATE, allowNull: true });

    // Index for concurrent-timer checks
    await queryInterface.addIndex('tasks', ['assigned_to', 'active_timer_started_at'], { name: 'idx_tasks_assignee_timer' });
  },

  async down(queryInterface, Sequelize) {
    // Remove columns (enum change not easily reversible)
    await queryInterface.removeIndex('tasks', 'idx_tasks_assignee_timer');
    await queryInterface.removeColumn('tasks', 'last_paused_at');
    await queryInterface.removeColumn('tasks', 'active_timer_started_at');
    await queryInterface.removeColumn('tasks', 'total_tracked_seconds');
    await queryInterface.removeColumn('tasks', 'completed_at');
    await queryInterface.removeColumn('tasks', 'started_at');
  }
};

