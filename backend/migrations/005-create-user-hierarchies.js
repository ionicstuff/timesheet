'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_hierarchies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      parent_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      hierarchy_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Level in organizational hierarchy: 1=top level, higher numbers=lower levels'
      },
      relationship_type: {
        type: Sequelize.ENUM('direct_report', 'indirect_report', 'matrix_report'),
        defaultValue: 'direct_report'
      },
      effective_from: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      effective_to: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('user_hierarchies', ['user_id']);
    await queryInterface.addIndex('user_hierarchies', ['parent_user_id']);
    await queryInterface.addIndex('user_hierarchies', ['hierarchy_level']);
    await queryInterface.addIndex('user_hierarchies', ['relationship_type']);
    await queryInterface.addIndex('user_hierarchies', ['effective_from', 'effective_to']);
    
    // Add unique constraint for user_id + parent_user_id + effective_from with active condition
    await queryInterface.addConstraint('user_hierarchies', {
      fields: ['user_id', 'parent_user_id', 'effective_from'],
      type: 'unique',
      name: 'unique_user_hierarchy_active',
      where: {
        is_active: true
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_hierarchies');
  }
};
