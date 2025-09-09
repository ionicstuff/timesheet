const express = require('express');
const router = express.Router();
const { Timesheet, Task } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const TaskTimerService = require('../services/TaskTimerService');
const { Op } = require('sequelize');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Helper functions
const getTodayDate = () => new Date().toISOString().split('T')[0];
const getCurrentTime = () => {
  const now = new Date();
  return now.toTimeString().split(' ')[0]; // Returns HH:MM:SS format
};

// Format timesheet response
const formatTimesheetResponse = (timesheet) => {
  if (!timesheet) {
    return {
      status: 'not_clocked_in',
      clockInTime: null,
      clockOutTime: null,
      totalHours: 0,
      requiredHours: 8
    };
  }

  const status = timesheet.clockIn && !timesheet.clockOut ? 'clocked_in' : 
                 timesheet.clockIn && timesheet.clockOut ? 'clocked_out' : 'not_clocked_in';

  return {
    id: timesheet.id,
    date: timesheet.date,
    status,
    clockInTime: timesheet.clockIn,
    clockOutTime: timesheet.clockOut,
    totalHours: timesheet.totalHours || 0,
    requiredHours: 8,
    breakDuration: timesheet.breakDuration || 0,
    overtimeHours: timesheet.overtimeHours || 0,
    notes: timesheet.notes
  };
};

// Clock In
router.post('/clockin', async (req, res) => {
  try {
    const todayDate = getTodayDate();
    const currentTime = getCurrentTime();
    
    // Check if already clocked in today
    let timesheet = await Timesheet.findOne({
      where: { userId: req.user.id, date: todayDate }
    });

    if (timesheet && timesheet.clockIn) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked in today',
        data: formatTimesheetResponse(timesheet)
      });
    }

    // Create or update the timesheet record
    if (!timesheet) {
      timesheet = await Timesheet.create({
        userId: req.user.id,
        date: todayDate,
        clockIn: currentTime,
        ipAddress: req.ip,
        location: req.body.location || null
      });
    } else {
      timesheet.clockIn = currentTime;
      timesheet.ipAddress = req.ip;
      timesheet.location = req.body.location || null;
      await timesheet.save();
    }

    res.status(200).json({
      success: true,
      message: 'Clocked in successfully',
      data: formatTimesheetResponse(timesheet)
    });
  } catch (error) {
    console.error('Error during clock in:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error' 
    });
  }
});

// Clock Out
router.post('/clockout', async (req, res) => {
  try {
    const todayDate = getTodayDate();
    const currentTime = getCurrentTime();
    
    // Fetch today's record
    const timesheet = await Timesheet.findOne({
      where: { userId: req.user.id, date: todayDate }
    });

    if (!timesheet || !timesheet.clockIn) {
      return res.status(400).json({
        success: false,
        message: 'Cannot clock out before clocking in',
        data: formatTimesheetResponse(null)
      });
    }

    if (timesheet.clockOut) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked out today',
        data: formatTimesheetResponse(timesheet)
      });
    }

    // Auto-pause any running tasks for this user before clocking out
    const runningTasks = await Task.findAll({
      where: { assignedTo: req.user.id, activeTimerStartedAt: { [Op.ne]: null } }
    });
    for (const task of runningTasks) {
      try {
        await TaskTimerService.pause(task.id, req.user, 'Auto-pause due to clock out');
      } catch (e) {
        // Non-blocking: proceed even if a task fails to pause
        console.error('Auto-pause failed for task', task.id, e?.message || e);
      }
    }

    timesheet.clockOut = currentTime;
    await timesheet.save();

    res.status(200).json({
      success: true,
      message: 'Clocked out successfully',
      data: formatTimesheetResponse(timesheet)
    });
  } catch (error) {
    console.error('Error during clock out:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error' 
    });
  }
});

// Get current status
router.get('/status', async (req, res) => {
  try {
    const todayDate = getTodayDate();
    const timesheet = await Timesheet.findOne({
      where: { userId: req.user.id, date: todayDate }
    });
    
    res.status(200).json({
      success: true,
      data: formatTimesheetResponse(timesheet)
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error' 
    });
  }
});

module.exports = router;

