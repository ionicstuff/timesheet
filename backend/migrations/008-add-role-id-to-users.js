'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'role_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'role_masters',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for role_id
    await queryInterface.addIndex('users', ['role_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'role_id');
  }
};
