const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('spocs', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      designation: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      department: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('spocs', ['client_id'], {
      name: 'idx_spocs_client_id'
    });

    await queryInterface.addIndex('spocs', ['project_id'], {
      name: 'idx_spocs_project_id'
    });

    await queryInterface.addIndex('spocs', ['email'], {
      name: 'idx_spocs_email'
    });

    await queryInterface.addIndex('spocs', ['is_primary'], {
      name: 'idx_spocs_is_primary'
    });

    await queryInterface.addIndex('spocs', ['is_active'], {
      name: 'idx_spocs_is_active'
    });

    // Add unique constraint for active SPOCs per client/project
    await queryInterface.addIndex('spocs', ['client_id', 'project_id', 'email'], {
      unique: true,
      name: 'unique_active_spoc_per_client_project',
      where: {
        is_active: true
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('spocs');
  }
};
