'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('role_masters', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      role_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      role_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Hierarchy level: 1=highest (Director), 10=lowest'
      },
      can_manage_users: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      can_manage_projects: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      can_view_reports: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

    // Add indexes
    await queryInterface.addIndex('role_masters', ['role_code']);
    await queryInterface.addIndex('role_masters', ['level']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('role_masters');
  }
};
