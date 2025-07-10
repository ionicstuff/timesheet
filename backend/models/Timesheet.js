const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Timesheet = sequelize.define('Timesheet', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  clockIn: {
    type: DataTypes.TIME,
    allowNull: true,
    field: 'clock_in'
  },
  clockOut: {
    type: DataTypes.TIME,
    allowNull: true,
    field: 'clock_out'
  },
  breakDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'break_duration',
    validate: {
      min: 0
    }
  },
  totalHours: {
    type: DataTypes.DECIMAL(4, 2),
    defaultValue: 0,
    field: 'total_hours',
    validate: {
      min: 0
    }
  },
  overtimeHours: {
    type: DataTypes.DECIMAL(4, 2),
    defaultValue: 0,
    field: 'overtime_hours',
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.INET,
    allowNull: true,
    field: 'ip_address'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'timesheets',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'date']
    }
  ]
});

// Instance methods
Timesheet.prototype.calculateTotalHours = function() {
  if (this.clockIn && this.clockOut) {
    const clockInTime = new Date(`1970-01-01T${this.clockIn}`);
    const clockOutTime = new Date(`1970-01-01T${this.clockOut}`);
    
    let diffMs = clockOutTime - clockInTime;
    
    // Handle cases where clock out is next day
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Add 24 hours
    }
    
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const workingMinutes = totalMinutes - (this.breakDuration || 0);
    
    return Math.max(0, workingMinutes / 60);
  }
  return 0;
};

Timesheet.prototype.isLate = function(standardClockIn = '09:00:00') {
  if (!this.clockIn) return false;
  
  const clockInTime = new Date(`1970-01-01T${this.clockIn}`);
  const standardTime = new Date(`1970-01-01T${standardClockIn}`);
  
  return clockInTime > standardTime;
};

Timesheet.prototype.isEarlyOut = function(standardClockOut = '18:00:00') {
  if (!this.clockOut) return false;
  
  const clockOutTime = new Date(`1970-01-01T${this.clockOut}`);
  const standardTime = new Date(`1970-01-01T${standardClockOut}`);
  
  return clockOutTime < standardTime;
};

// Hooks
Timesheet.beforeSave(async (timesheet) => {
  if (timesheet.clockIn && timesheet.clockOut) {
    timesheet.totalHours = timesheet.calculateTotalHours();
    
    // Calculate overtime (assuming 8 hours is standard)
    const standardHours = 8;
    if (timesheet.totalHours > standardHours) {
      timesheet.overtimeHours = timesheet.totalHours - standardHours;
    } else {
      timesheet.overtimeHours = 0;
    }
  }
});

module.exports = Timesheet;
