const sequelize = require('../config/database');
const { Task, Timesheet } = require('../models');
const TaskTimeLog = require('../models/TaskTimeLog');
const emailService = require('./emailService');
const TimesheetAutoFillService = require('./TimesheetAutoFillService');

function roundSecondsToNearestMinute(sec) {
  // Round to nearest 60 seconds
  const minutes = Math.round(sec / 60);
  return minutes * 60;
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

async function ensureClockedIn(user, t) {
  const todayDate = getTodayDate();
  const ts = await Timesheet.findOne({ where: { userId: user.id, date: todayDate }, transaction: t });
  if (!ts || !ts.clockIn || ts.clockOut) {
    throw new Error('You must clock in to start or resume tasks.');
  }
}

class TaskTimerService {
  static async start(taskId, user, note = null) {
    return await sequelize.transaction(async (t) => {
      const task = await Task.findByPk(taskId, { transaction: t });
      if (!task) throw new Error('Task not found');

      // Permission: assignee or PM/AM roles
      if (task.assignedTo && task.assignedTo !== user.id && !['Project Manager','Account Manager','Admin','Director','Team Lead'].includes(user.role)) {
        throw new Error('Not authorized to start this task');
      }

      // Require user to be clocked in
      await ensureClockedIn(user, t);

      // Prevent concurrent timers for user across tasks
      if (user.id) {
        const running = await Task.findOne({
          where: { assignedTo: user.id, activeTimerStartedAt: { [require('sequelize').Op.ne]: null } },
          transaction: t
        });
        if (running && running.id !== task.id) {
          throw new Error('You already have another task timer running');
        }
      }

      if (task.activeTimerStartedAt) {
        // idempotent
        return task;
      }

      // Transition rules
      if (task.status === 'pending' || task.status === 'paused') {
        if (!task.startedAt) task.startedAt = new Date();
        task.status = 'in_progress';
        task.activeTimerStartedAt = new Date();
        await task.save({ transaction: t });

        await TaskTimeLog.create({
          taskId: task.id,
          userId: user.id,
          action: 'start',
          startAt: task.activeTimerStartedAt,
          endAt: null,
          durationSeconds: 0,
          note
        }, { transaction: t });

        // notify PM/AM via email (best-effort, do not block)
        void emailService.sendTaskStatusEmail?.(task, 'started', user).catch(() => {});
        return task;
      }

      throw new Error(`Cannot start task from status ${task.status}`);
    });
  }

  static async pause(taskId, user, note = null) {
    return await this._endRun(taskId, user, 'pause', note);
  }

  static async stop(taskId, user, note = null) {
    // stop behaves like pause (status becomes paused)
    return await this._endRun(taskId, user, 'stop', note);
  }

  static async resume(taskId, user, note = null) {
    return await sequelize.transaction(async (t) => {
      const task = await Task.findByPk(taskId, { transaction: t });
      if (!task) throw new Error('Task not found');

      if (task.assignedTo && task.assignedTo !== user.id && !['Project Manager','Account Manager','Admin','Director','Team Lead'].includes(user.role)) {
        throw new Error('Not authorized to resume this task');
      }

      if (task.status !== 'paused') {
        if (task.status === 'in_progress' && task.activeTimerStartedAt) return task; // idempotent
        throw new Error('Task must be paused to resume');
      }

      // Require user to be clocked in
      await ensureClockedIn(user, t);

      // Prevent concurrent timers
      if (user.id) {
        const running = await Task.findOne({
          where: { assignedTo: user.id, activeTimerStartedAt: { [require('sequelize').Op.ne]: null } },
          transaction: t
        });
        if (running && running.id !== task.id) {
          throw new Error('You already have another task timer running');
        }
      }

      task.status = 'in_progress';
      task.activeTimerStartedAt = new Date();
      await task.save({ transaction: t });

      await TaskTimeLog.create({
        taskId: task.id,
        userId: user.id,
        action: 'resume',
        startAt: task.activeTimerStartedAt,
        endAt: null,
        durationSeconds: 0,
        note
      }, { transaction: t });

      void emailService.sendTaskStatusEmail?.(task, 'resumed', user).catch(() => {});
      return task;
    });
  }

  static async complete(taskId, user, note = null) {
    return await sequelize.transaction(async (t) => {
      const task = await Task.findByPk(taskId, { transaction: t });
      if (!task) throw new Error('Task not found');

      if (task.assignedTo && task.assignedTo !== user.id && !['Project Manager','Account Manager','Admin','Director','Team Lead'].includes(user.role)) {
        throw new Error('Not authorized to complete this task');
      }

      // If active timer, end it first
      if (task.activeTimerStartedAt) {
        await this._endRun(taskId, user, 'pause', note, t);
        await task.reload({ transaction: t });
      }

      if (task.status === 'completed') return task; // idempotent

      task.status = 'completed';
      task.completedAt = new Date();
      await task.save({ transaction: t });

      await TaskTimeLog.create({
          taskId: task.id,
          userId: user.id,
          action: 'complete',
          startAt: null,
          endAt: task.completedAt,
          durationSeconds: 0,
          note
        }, { transaction: t });

      // Prefill today's timesheet entry for this task/user
      await TimesheetAutoFillService.upsertFromTaskCompletion(task, user, t);

      void emailService.sendTaskStatusEmail?.(task, 'completed', user).catch(() => {});
      return task;
    });
  }

  static async _endRun(taskId, user, action, note = null, existingTx = null) {
    const doAction = async (t) => {
      const task = await Task.findByPk(taskId, { transaction: t });
      if (!task) throw new Error('Task not found');

      if (task.assignedTo && task.assignedTo !== user.id && !['Project Manager','Account Manager','Admin','Director','Team Lead'].includes(user.role)) {
        throw new Error('Not authorized to modify this task');
      }

      if (!task.activeTimerStartedAt || task.status !== 'in_progress') {
        // idempotent noop
        return task;
      }

      const now = new Date();
      const rawSeconds = Math.max(0, Math.floor((now.getTime() - new Date(task.activeTimerStartedAt).getTime()) / 1000));
      const durationSeconds = roundSecondsToNearestMinute(rawSeconds);

      task.totalTrackedSeconds = (task.totalTrackedSeconds || 0) + durationSeconds;
      task.lastPausedAt = now;
      task.activeTimerStartedAt = null;
      task.status = 'paused';
      await task.save({ transaction: t });

      await TaskTimeLog.create({
        taskId: task.id,
        userId: user.id,
        action,
        startAt: null,
        endAt: now,
        durationSeconds,
        note
      }, { transaction: t });

      const verb = action === 'stop' ? 'stopped' : 'paused';
      void emailService.sendTaskStatusEmail?.(task, verb, user).catch(() => {});
      return task;
    };

    if (existingTx) return doAction(existingTx);
    return await sequelize.transaction(doAction);
  }
}

module.exports = TaskTimerService;
