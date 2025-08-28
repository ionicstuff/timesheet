'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('invoice_counters', {
      year: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      last_seq: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('invoice_counters');
  }
};
