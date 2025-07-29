const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ModuleMaster = sequelize.define('ModuleMaster', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  moduleCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'module_code',
    validate: {
      notEmpty: true,
      isAlphanumeric: true
    }
  },
  moduleName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'module_name',
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  route: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Frontend route path for this module'
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Icon class name for UI display'
  },
  parentModuleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'parent_module_id',
    references: {
      model: 'module_masters',
      key: 'id'
    }
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'module_masters',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['module_code']
    },
    {
      fields: ['parent_module_id']
    },
    {
      fields: ['sort_order']
    }
  ]
});

// Self-referencing association for parent-child modules
ModuleMaster.hasMany(ModuleMaster, {
  foreignKey: 'parentModuleId',
  as: 'subModules'
});

ModuleMaster.belongsTo(ModuleMaster, {
  foreignKey: 'parentModuleId',
  as: 'parentModule'
});

module.exports = ModuleMaster;
