const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Timesheet, TimesheetEntry, Project } = require('../models');
const TaskTimeLog = require('../models/TaskTimeLog');

function getTodayDate() {
  // Keep consistent with other routes using UTC date partitioning
  return new Date().toISOString().split('T')[0];
}

function startOfUtcDay(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function startOfNextUtcDay(dateStr) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

async function ensureTimesheet(userId, date, t) {
  // If a header exists and is submitted, skip any auto-fill
  const existing = await Timesheet.findOne({ where: { userId, date }, transaction: t });
  if (existing) {
    if (existing.status === 'submitted') return { header: existing, skip: true };
    return { header: existing, skip: false };
  }
  const header = await Timesheet.create({ userId, date, status: 'pending' }, { transaction: t });
  return { header, skip: false };
}

async function defaultBillable(projectId, t) {
  try {
    const project = await Project.findByPk(projectId, { transaction: t });
    return project ? !!project.is_billable : true;
  } catch {
    return true;
  }
}

async function upsertFromTaskCompletion(task, user, t) {
  if (!task || !user) return;

  const today = getTodayDate();
  const start = startOfUtcDay(today);
  const end = startOfNextUtcDay(today);

  // Sum today's durations for this task/user
  const logs = await TaskTimeLog.findAll({
    where: {
      taskId: task.id,
      userId: user.id,
      endAt: { [Op.gte]: start, [Op.lt]: end }
    },
    transaction: t
  });

  const totalSeconds = logs.reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
  const minutes = Math.max(0, Math.floor(totalSeconds / 60));

  if (minutes <= 0) {
    // Nothing to prefill for today
    return;
  }

  // Ensure timesheet header exists; skip if submitted
  const { header, skip } = await ensureTimesheet(user.id, today, t);
  if (skip) return;

  // Upsert entry per (timesheetId, taskId)
  let entry = await TimesheetEntry.findOne({
    where: { timesheetId: header.id, taskId: task.id },
    transaction: t
  });

  if (entry) {
    // Update minutes only; preserve description and other fields as-is
    entry.minutes = minutes;
    await entry.save({ transaction: t });
    return entry;
  }

  // Create new entry
  const billable = await defaultBillable(task.projectId, t);
  entry = await TimesheetEntry.create({
    timesheetId: header.id,
    projectId: task.projectId,
    taskId: task.id,
    minutes,
    isBillable: billable,
    description: null,
    startedAt: null,
    endedAt: null
  }, { transaction: t });

  return entry;
}

module.exports = {
  upsertFromTaskCompletion,
};

