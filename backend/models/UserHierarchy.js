const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserHierarchy = sequelize.define('UserHierarchy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  parentUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'parent_user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  hierarchyLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'hierarchy_level',
    validate: {
      min: 1,
      max: 10
    },
    comment: 'Level in organizational hierarchy: 1=top level, higher numbers=lower levels'
  },
  relationshipType: {
    type: DataTypes.ENUM('direct_report', 'indirect_report', 'matrix_report'),
    defaultValue: 'direct_report',
    field: 'relationship_type'
  },
  effectiveFrom: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'effective_from'
  },
  effectiveTo: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'effective_to'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'user_hierarchies',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'parent_user_id', 'effective_from'],
      where: {
        is_active: true
      }
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['parent_user_id']
    },
    {
      fields: ['hierarchy_level']
    },
    {
      fields: ['relationship_type']
    },
    {
      fields: ['effective_from', 'effective_to']
    }
  ]
});

module.exports = UserHierarchy;
