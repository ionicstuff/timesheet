const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'project_id',
    references: {
      model: 'projects',
      key: 'id'
    },
    validate: {
      notNull: {
        msg: 'Project ID is required'
      }
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Task name cannot be empty'
      },
      len: {
        args: [1, 255],
        msg: 'Task name must be between 1 and 255 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'assigned_to',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  estimatedTime: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'estimated_time',
    validate: {
      min: {
        args: [0],
        msg: 'Estimated time must be greater than or equal to 0'
      },
      notNull: {
        msg: 'Estimated time is required'
      }
    },
    comment: 'Estimated time in hours'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending',
    validate: {
      isIn: {
        args: [['pending', 'in_progress', 'completed', 'cancelled']],
        msg: 'Status must be one of: pending, in_progress, completed, cancelled'
      }
    }
  },
  acceptanceStatus: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending',
    field: 'acceptance_status',
    validate: {
      isIn: {
        args: [['pending', 'accepted', 'rejected']],
        msg: 'Acceptance status must be one of: pending, accepted, rejected'
      }
    }
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'accepted_at'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rejection_reason'
  }
}, {
  tableName: 'tasks',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['project_id']
    },
    {
      fields: ['assigned_to']
    },
    {
      fields: ['status']
    },
    {
      fields: ['project_id', 'status']
    }
  ]
});

module.exports = Task;
