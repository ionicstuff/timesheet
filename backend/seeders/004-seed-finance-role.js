'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert Finance role if not exists
    const [rows] = await queryInterface.sequelize.query("SELECT id FROM role_masters WHERE LOWER(role_name) = 'finance' OR role_code = 'FIN'");
    if (rows && rows.length > 0) return;
    await queryInterface.bulkInsert('role_masters', [
      {
        role_code: 'FIN',
        role_name: 'Finance',
        description: 'Finance team member responsible for invoicing',
        level: 3,
        can_manage_users: false,
        can_manage_projects: false,
        can_view_reports: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('role_masters', { role_code: 'FIN' }, {});
  }
};
