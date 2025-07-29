'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('module_masters', [
      // Main modules
      {
        id: 1,
        module_code: 'DASH',
        module_name: 'Dashboard',
        description: 'Main dashboard with overview and statistics',
        route: '/dashboard',
        icon: 'dashboard',
        parent_module_id: null,
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        module_code: 'TIME',
        module_name: 'Time Tracking',
        description: 'Time tracking and timesheet management',
        route: '/timesheet',
        icon: 'schedule',
        parent_module_id: null,
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        module_code: 'USR',
        module_name: 'User Management',
        description: 'User accounts and profile management',
        route: '/users',
        icon: 'people',
        parent_module_id: null,
        sort_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 4,
        module_code: 'PROJ',
        module_name: 'Project Management',
        description: 'Project creation and management',
        route: '/projects',
        icon: 'folder',
        parent_module_id: null,
        sort_order: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 5,
        module_code: 'CLT',
        module_name: 'Client Management',
        description: 'Client information and relationship management',
        route: '/clients',
        icon: 'business',
        parent_module_id: null,
        sort_order: 5,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 6,
        module_code: 'RPT',
        module_name: 'Reports',
        description: 'Various reports and analytics',
        route: '/reports',
        icon: 'assessment',
        parent_module_id: null,
        sort_order: 6,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 7,
        module_code: 'ADM',
        module_name: 'Administration',
        description: 'System administration and settings',
        route: '/admin',
        icon: 'settings',
        parent_module_id: null,
        sort_order: 7,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // Sub-modules
      {
        id: 8,
        module_code: 'CLOCK',
        module_name: 'Clock In/Out',
        description: 'Clock in and clock out functionality',
        route: '/timesheet/clock',
        icon: 'access_time',
        parent_module_id: 2,
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 9,
        module_code: 'TMSHEET',
        module_name: 'Timesheet View',
        description: 'View and edit timesheets',
        route: '/timesheet/view',
        icon: 'view_list',
        parent_module_id: 2,
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 10,
        module_code: 'ROLE',
        module_name: 'Role Management',
        description: 'Manage user roles and permissions',
        route: '/admin/roles',
        icon: 'security',
        parent_module_id: 7,
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 11,
        module_code: 'PERM',
        module_name: 'Permission Management',
        description: 'Manage system permissions',
        route: '/admin/permissions',
        icon: 'vpn_key',
        parent_module_id: 7,
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('module_masters', null, {});
  }
};
