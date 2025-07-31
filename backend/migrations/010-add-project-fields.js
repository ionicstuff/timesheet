const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add spoc_id column
    await queryInterface.addColumn('projects', 'spoc_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'spocs',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add brief_received_on column
    await queryInterface.addColumn('projects', 'brief_received_on', {
      type: DataTypes.DATEONLY,
      allowNull: true
    });

    // Add estimated_time column (in hours)
    await queryInterface.addColumn('projects', 'estimated_time', {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    });

    // Add indexes for the new columns
    await queryInterface.addIndex('projects', ['spoc_id'], {
      name: 'idx_projects_spoc_id'
    });

    await queryInterface.addIndex('projects', ['brief_received_on'], {
      name: 'idx_projects_brief_received_on'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('projects', 'idx_projects_spoc_id');
    await queryInterface.removeIndex('projects', 'idx_projects_brief_received_on');

    // Remove columns
    await queryInterface.removeColumn('projects', 'spoc_id');
    await queryInterface.removeColumn('projects', 'brief_received_on');
    await queryInterface.removeColumn('projects', 'estimated_time');
  }
};
