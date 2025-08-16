const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TimesheetEntry = sequelize.define('TimesheetEntry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  timesheetId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'timesheet_id',
    references: { model: 'timesheets', key: 'id' }
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'project_id',
    references: { model: 'projects', key: 'id' }
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'task_id',
    references: { model: 'tasks', key: 'id' }
  },
  minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  },
  isBillable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'is_billable'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'started_at'
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ended_at'
  }
}, {
  tableName: 'timesheet_entries',
  underscored: true,
  timestamps: true
});

module.exports = TimesheetEntry;
