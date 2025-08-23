"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('projects', 'closed_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('projects', 'closed_by_user_id', { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } });
    await queryInterface.addColumn('projects', 'closed_reason', { type: Sequelize.TEXT, allowNull: true });
    await queryInterface.addIndex('projects', ['closed_at'], { name: 'idx_projects_closed_at' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('projects', 'idx_projects_closed_at');
    await queryInterface.removeColumn('projects', 'closed_reason');
    await queryInterface.removeColumn('projects', 'closed_by_user_id');
    await queryInterface.removeColumn('projects', 'closed_at');
  }
};

