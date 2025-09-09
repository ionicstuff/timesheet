const Notification = require('../models/Notification');

// Centralized notification types
const NotificationTypes = Object.freeze({
  // Tasks
  TASK_ASSIGNED: 'task.assigned',
  TASK_REASSIGNED: 'task.reassigned',
  TASK_STATUS_CHANGED: 'task.status_changed',
  TASK_DUE_SOON: 'task.due_soon',
  TASK_OVERDUE: 'task.overdue',
  TASK_ACCEPTED: 'task.accepted',
  TASK_REJECTED: 'task.rejected',

  // Timesheet
  TIMESHEET_REMINDER_DAILY: 'timesheet.reminder_daily',
  TIMESHEET_REMINDER_WEEKLY: 'timesheet.reminder_weekly',
  TIMESHEET_SUBMITTED: 'timesheet.submitted',
  TIMESHEET_APPROVED: 'timesheet.approved',
  TIMESHEET_REJECTED: 'timesheet.rejected',

  // Projects
  PROJECT_TEAM_ADDED: 'project.team_added',
  PROJECT_TEAM_REMOVED: 'project.team_removed',
  PROJECT_STATUS_CHANGED: 'project.status_changed',

  // Billing
  INVOICE_GENERATED: 'billing.invoice_generated',
  INVOICE_APPROVED: 'billing.invoice_approved',
  INVOICE_REJECTED: 'billing.invoice_rejected',

  // System
  SECURITY_ALERT: 'system.security_alert',
  ANNOUNCEMENT: 'system.announcement',
});

// Template builders per type (minimal v1)
function buildPayload(type, ctx = {}) {
  switch (type) {
    case NotificationTypes.TASK_ASSIGNED:
      return {
        title: 'Task assigned',
        body: `You have been assigned: ${ctx.taskName || 'a task'}`,
        link: `/tasks/${ctx.taskId || ''}`,
      };
    case NotificationTypes.TASK_REASSIGNED:
      return {
        title: 'Task reassigned',
        body: `${ctx.taskName || 'Task'} has been reassigned${ctx.toUserName ? ` to ${ctx.toUserName}` : ''}`,
        link: `/tasks/${ctx.taskId || ''}`,
      };
    case NotificationTypes.TASK_STATUS_CHANGED:
      return {
        title: 'Task status updated',
        body: `${ctx.taskName || 'Task'} is now ${ctx.status || 'updated'}`,
        link: `/tasks/${ctx.taskId || ''}`,
      };
    case NotificationTypes.TASK_ACCEPTED:
      return {
        title: 'Task accepted',
        body: `${ctx.taskName || 'Task'} was accepted by ${ctx.actorName || 'assignee'}`,
        link: `/tasks/${ctx.taskId || ''}`,
      };
    case NotificationTypes.TASK_REJECTED:
      return {
        title: 'Task rejected',
        body: `${ctx.taskName || 'Task'} was rejected${ctx.reason ? `: ${ctx.reason}` : ''}`,
        link: `/tasks/${ctx.taskId || ''}`,
      };
    default:
      return {
        title: ctx.title || 'Notification',
        body: ctx.body || '',
        link: ctx.link || null,
      };
  }
}

async function createNotification({ userId, type, actorUserId = null, ctx = {} }) {
  const payload = buildPayload(type, ctx);
  return Notification.create({
    userId,
    title: payload.title,
    body: payload.body,
    link: payload.link,
    isRead: false,
    type,
    actorUserId,
    metadata: ctx || null,
  });
}

// Helper APIs for common events
async function notifyTaskAssigned(task, actorUserId = null, ctxExtra = {}) {
  if (!task || !task.assignedTo) return;
  await createNotification({
    userId: task.assignedTo,
    type: NotificationTypes.TASK_ASSIGNED,
    actorUserId,
    ctx: { taskId: task.id, taskName: task.name, projectId: task.projectId, ...ctxExtra },
  });
}

async function notifyTaskReassigned(task, prevAssigneeId, actorUserId = null, ctxExtra = {}) {
  if (prevAssigneeId && prevAssigneeId !== task.assignedTo) {
    // Inform previous assignee
    await createNotification({
      userId: prevAssigneeId,
      type: NotificationTypes.TASK_REASSIGNED,
      actorUserId,
      ctx: { taskId: task.id, taskName: task.name, projectId: task.projectId, toUserId: task.assignedTo, ...ctxExtra },
    });
  }
  if (task.assignedTo && prevAssigneeId !== task.assignedTo) {
    // Inform new assignee
    await createNotification({
      userId: task.assignedTo,
      type: NotificationTypes.TASK_ASSIGNED,
      actorUserId,
      ctx: { taskId: task.id, taskName: task.name, projectId: task.projectId, ...ctxExtra },
    });
  }
}

async function notifyTaskStatusChanged(task, oldStatus, actorUserId = null, ctxExtra = {}) {
  if (!task) return;
  if (task.status === oldStatus) return;
  // Notify current assignee (if any)
  if (task.assignedTo) {
    await createNotification({
      userId: task.assignedTo,
      type: NotificationTypes.TASK_STATUS_CHANGED,
      actorUserId,
      ctx: { taskId: task.id, taskName: task.name, status: task.status, oldStatus, projectId: task.projectId, ...ctxExtra },
    });
  }
}

module.exports = {
  NotificationTypes,
  buildPayload,
  createNotification,
  notifyTaskAssigned,
  notifyTaskReassigned,
  notifyTaskStatusChanged,
};

