'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('module_masters', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      module_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      module_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      route: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Frontend route path for this module'
      },
      icon: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Icon class name for UI display'
      },
      parent_module_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'module_masters',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await queryInterface.addIndex('module_masters', ['module_code']);
    await queryInterface.addIndex('module_masters', ['parent_module_id']);
    await queryInterface.addIndex('module_masters', ['sort_order']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('module_masters');
  }
};
