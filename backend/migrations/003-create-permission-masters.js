'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('permission_masters', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      permission_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      permission_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      module_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'module_masters',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      action: {
        type: Sequelize.ENUM('create', 'read', 'update', 'delete', 'import', 'export', 'approve'),
        allowNull: false
      },
      resource: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Resource this permission applies to (e.g., timesheet, user, project)'
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
    await queryInterface.addIndex('permission_masters', ['permission_code']);
    await queryInterface.addIndex('permission_masters', ['module_id']);
    await queryInterface.addIndex('permission_masters', ['action']);
    await queryInterface.addIndex('permission_masters', ['resource']);
    
    // Add unique constraint for module_id + action + resource
    await queryInterface.addConstraint('permission_masters', {
      fields: ['module_id', 'action', 'resource'],
      type: 'unique',
      name: 'unique_module_action_resource'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('permission_masters');
  }
};
