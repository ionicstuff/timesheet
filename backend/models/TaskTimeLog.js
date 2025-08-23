const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskTimeLog = sequelize.define('TaskTimeLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'task_id',
    references: { model: 'tasks', key: 'id' }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' }
  },
  action: {
    type: DataTypes.ENUM('start', 'pause', 'resume', 'stop', 'complete'),
    allowNull: false
  },
  startAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'start_at'
  },
  endAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'end_at'
  },
  durationSeconds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'duration_seconds',
    validate: { min: 0 }
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'task_time_logs',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['task_id'] },
    { fields: ['user_id'] },
    { fields: ['action'] }
  ]
});

module.exports = TaskTimeLog;
