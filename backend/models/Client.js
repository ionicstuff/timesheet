const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clientCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'client_code',
    validate: {
      notEmpty: true
    }
  },
  clientName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'client_name',
    validate: {
      notEmpty: true
    }
  },
  companyName: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'company_name'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  postalCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'postal_code'
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  industry: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  accountManagerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'account_manager_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  contractStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'contract_start_date'
  },
  contractEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'contract_end_date'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'prospect', 'closed'),
    defaultValue: 'active'
  },
  billingType: {
    type: DataTypes.ENUM('hourly', 'fixed', 'monthly', 'project'),
    allowNull: true,
    field: 'billing_type'
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'hourly_rate'
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD',
    validate: {
      len: [3, 3]
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'clients',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['client_code']
    },
    {
      fields: ['client_name']
    },
    {
      fields: ['account_manager_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = Client;
