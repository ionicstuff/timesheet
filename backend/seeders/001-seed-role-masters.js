'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('role_masters', [
      {
        role_code: 'DIR',
        role_name: 'Director',
        description: 'Senior executive responsible for overall business direction and strategy',
        level: 1,
        can_manage_users: true,
        can_manage_projects: true,
        can_view_reports: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        role_code: 'ACM',
        role_name: 'Account Manager',
        description: 'Manages client relationships and oversees multiple projects',
        level: 2,
        can_manage_users: true,
        can_manage_projects: true,
        can_view_reports: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        role_code: 'PM',
        role_name: 'Project Manager',
        description: 'Manages specific projects and coordinates team activities',
        level: 3,
        can_manage_users: false,
        can_manage_projects: true,
        can_view_reports: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        role_code: 'TL',
        role_name: 'Team Lead',
        description: 'Leads a team of developers and manages day-to-day activities',
        level: 4,
        can_manage_users: false,
        can_manage_projects: false,
        can_view_reports: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        role_code: 'SD',
        role_name: 'Senior Developer',
        description: 'Experienced developer with mentoring responsibilities',
        level: 5,
        can_manage_users: false,
        can_manage_projects: false,
        can_view_reports: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        role_code: 'DEV',
        role_name: 'Developer',
        description: 'Software developer responsible for coding and implementation',
        level: 6,
        can_manage_users: false,
        can_manage_projects: false,
        can_view_reports: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        role_code: 'JD',
        role_name: 'Junior Developer',
        description: 'Entry-level developer learning and contributing to projects',
        level: 7,
        can_manage_users: false,
        can_manage_projects: false,
        can_view_reports: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        role_code: 'HR',
        role_name: 'HR Manager',
        description: 'Human Resources manager handling employee affairs',
        level: 3,
        can_manage_users: true,
        can_manage_projects: false,
        can_view_reports: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        role_code: 'ADM',
        role_name: 'System Admin',
        description: 'System administrator with full access to all modules',
        level: 1,
        can_manage_users: true,
        can_manage_projects: true,
        can_view_reports: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('role_masters', null, {});
  }
};
