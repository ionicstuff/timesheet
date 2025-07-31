'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tasks', 'acceptance_status', {
      type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    });

    await queryInterface.addColumn('tasks', 'accepted_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('tasks', 'rejection_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Add index for acceptance status
    await queryInterface.addIndex('tasks', ['acceptance_status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tasks', 'acceptance_status');
    await queryInterface.removeColumn('tasks', 'accepted_at');
    await queryInterface.removeColumn('tasks', 'rejection_reason');
  }
};
