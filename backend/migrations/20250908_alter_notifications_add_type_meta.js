"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add type, actor_user_id, metadata columns
    await queryInterface.addColumn('notifications', 'type', {
      type: Sequelize.STRING(64),
      allowNull: true,
    });
    await queryInterface.addColumn('notifications', 'actor_user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    // Use JSONB where supported (Postgres)
    await queryInterface.addColumn('notifications', 'metadata', {
      type: Sequelize.JSONB || Sequelize.JSON,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('notifications', 'metadata');
    await queryInterface.removeColumn('notifications', 'actor_user_id');
    await queryInterface.removeColumn('notifications', 'type');
  }
};

