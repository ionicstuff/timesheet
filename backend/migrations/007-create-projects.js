'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('projects', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      project_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      project_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      project_manager_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      estimated_hours: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true
      },
      actual_hours: {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0
      },
      budget_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      spent_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
        validate: {
          len: [3, 3]
        }
      },
      status: {
        type: Sequelize.ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled'),
        defaultValue: 'planning'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium'
      },
      billing_type: {
        type: Sequelize.ENUM('hourly', 'fixed', 'milestone'),
        defaultValue: 'hourly'
      },
      hourly_rate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      is_time_tracking_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_billable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        comment: 'Array of project tags for categorization'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.addIndex('projects', ['project_code']);
    await queryInterface.addIndex('projects', ['project_name']);
    await queryInterface.addIndex('projects', ['client_id']);
    await queryInterface.addIndex('projects', ['project_manager_id']);
    await queryInterface.addIndex('projects', ['status']);
    await queryInterface.addIndex('projects', ['priority']);
    await queryInterface.addIndex('projects', ['start_date', 'end_date']);
    await queryInterface.addIndex('projects', ['is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('projects');
  }
};
