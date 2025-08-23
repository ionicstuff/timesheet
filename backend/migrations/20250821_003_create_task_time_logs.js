"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create action enum if needed (Postgres only logic wrapped in try/catch)
    try {
      await queryInterface.sequelize.query("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_time_action') THEN CREATE TYPE task_time_action AS ENUM ('start','pause','resume','stop','complete'); END IF; END $$;");
    } catch (e) {
      // ignore on non-Postgres or if already exists
    }

    // Use a named Postgres enum type to keep consistency
    const actionType = Sequelize.ENUM({ name: 'task_time_action', values: ['start','pause','resume','stop','complete'] });

    await queryInterface.createTable('task_time_logs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      task_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tasks', key: 'id' } },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      action: { type: actionType, allowNull: false },
      start_at: { type: Sequelize.DATE, allowNull: true },
      end_at: { type: Sequelize.DATE, allowNull: true },
      duration_seconds: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      note: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.addIndex('task_time_logs', ['task_id'], { name: 'idx_ttl_task' });
    await queryInterface.addIndex('task_time_logs', ['user_id'], { name: 'idx_ttl_user' });
    await queryInterface.addIndex('task_time_logs', ['action'], { name: 'idx_ttl_action' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('task_time_logs', 'idx_ttl_action');
    await queryInterface.removeIndex('task_time_logs', 'idx_ttl_user');
    await queryInterface.removeIndex('task_time_logs', 'idx_ttl_task');
    await queryInterface.dropTable('task_time_logs');

    // Drop enum if exists (Postgres)
    try {
      await queryInterface.sequelize.query("DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_time_action') THEN DROP TYPE task_time_action; END IF; END $$;");
    } catch (e) {
      // ignore
    }
  }
};

