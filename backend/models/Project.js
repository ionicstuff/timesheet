const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projectCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'project_code',
    validate: {
      notEmpty: true
    }
  },
  projectName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'project_name',
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'client_id',
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  projectManagerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'project_manager_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'end_date'
  },
  estimatedHours: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    field: 'estimated_hours',
    validate: {
      min: 0
    }
  },
  actualHours: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
    field: 'actual_hours',
    validate: {
      min: 0
    }
  },
  budgetAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'budget_amount',
    validate: {
      min: 0
    }
  },
  spentAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'spent_amount',
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD',
    validate: {
      len: [3, 3]
    }
  },
  status: {
    type: DataTypes.ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled'),
    defaultValue: 'planning'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  billingType: {
    type: DataTypes.ENUM('hourly', 'fixed', 'milestone'),
    defaultValue: 'hourly',
    field: 'billing_type'
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'hourly_rate'
  },
  isTimeTrackingEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_time_tracking_enabled'
  },
  isBillable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_billable'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Array of project tags for categorization'
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
  spocId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'spoc_id',
    references: {
      model: 'spocs',
      key: 'id'
    }
  },
  briefReceivedOn: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'brief_received_on'
  },
  estimatedTime: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    field: 'estimated_time',
    validate: {
      min: 0
    },
    comment: 'Estimated time in hours'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Closing metadata
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'closed_at'
  },
  closedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'closed_by_user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  closedReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'closed_reason'
  }
}, {
  tableName: 'projects',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['project_code']
    },
    {
      fields: ['project_name']
    },
    {
      fields: ['client_id']
    },
    {
      fields: ['project_manager_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['start_date', 'end_date']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['closed_at']
    }
  ]
});

module.exports = Project;
