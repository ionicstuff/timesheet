const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PermissionMaster = sequelize.define('PermissionMaster', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  permissionCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'permission_code',
    validate: {
      notEmpty: true
    }
  },
  permissionName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'permission_name',
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  moduleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'module_id',
    references: {
      model: 'module_masters',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM('create', 'read', 'update', 'delete', 'import', 'export', 'approve'),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  resource: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Resource this permission applies to (e.g., timesheet, user, project)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'permission_masters',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['permission_code']
    },
    {
      fields: ['module_id']
    },
    {
      fields: ['action']
    },
    {
      fields: ['resource']
    },
    {
      unique: true,
      fields: ['module_id', 'action', 'resource']
    }
  ]
});

module.exports = PermissionMaster;
