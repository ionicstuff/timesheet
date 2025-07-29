const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'role_id',
    references: {
      model: 'role_masters',
      key: 'id'
    }
  },
  permissionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'permission_id',
    references: {
      model: 'permission_masters',
      key: 'id'
    }
  },
  isGranted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_granted'
  },
  grantedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'granted_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  grantedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'granted_at'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at'
  }
}, {
  tableName: 'role_permissions',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['role_id', 'permission_id']
    },
    {
      fields: ['role_id']
    },
    {
      fields: ['permission_id']
    },
    {
      fields: ['granted_by']
    }
  ]
});

module.exports = RolePermission;
