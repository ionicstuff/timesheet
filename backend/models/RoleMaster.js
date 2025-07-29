const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoleMaster = sequelize.define('RoleMaster', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  roleCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'role_code',
    validate: {
      notEmpty: true,
      isAlphanumeric: true
    }
  },
  roleName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'role_name',
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 10
    },
    comment: 'Hierarchy level: 1=highest (Director), 10=lowest'
  },
  canManageUsers: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'can_manage_users'
  },
  canManageProjects: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'can_manage_projects'
  },
  canViewReports: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'can_view_reports'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'role_masters',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['role_code']
    },
    {
      fields: ['level']
    }
  ]
});

module.exports = RoleMaster;
