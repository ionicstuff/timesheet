const { Timesheet, TimesheetEntry, Project, Task } = require('../models');

// Default billable from project.is_billable if not provided
async function defaultBillable(projectId, incoming) {
  if (typeof incoming === 'boolean') return incoming;
  const project = await Project.findByPk(projectId);
  return project ? !!project.is_billable : true;
}

// Ensure a timesheet (header) exists for the day & user
async function ensureTimesheet(userId, date) {
  const [t] = await Timesheet.findOrCreate({
    where: { userId, date },
    defaults: { status: 'pending' }
  });
  return t;
}

exports.listForDate = async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;
    if (!date) return res.status(400).json({ success: false, message: 'date is required (YYYY-MM-DD)' });

    const header = await ensureTimesheet(userId, date);
    const entries = await TimesheetEntry.findAll({
      where: { timesheetId: header.id },
      include: [
        { model: Project, as: 'project', attributes: ['id','project_name','is_billable'] },
        { model: Task, as: 'task', attributes: ['id','name'] }
      ],
      order: [['id','ASC']]
    });
    const totalMinutes = entries.reduce((sum, e) => sum + (e.minutes||0), 0);
    return res.json({ success: true, data: { timesheetId: header.id, entries, totalMinutes } });
  } catch (err) {
    console.error('listForDate error', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, projectId, taskId, minutes, isBillable, description, startedAt, endedAt } = req.body;
    if (!date || !projectId || !minutes) {
      return res.status(400).json({ success: false, message: 'date, projectId, minutes are required' });
    }
    const header = await ensureTimesheet(userId, date);
    const billable = await defaultBillable(projectId, isBillable);
    const entry = await TimesheetEntry.create({
      timesheetId: header.id, projectId, taskId: taskId || null, minutes, isBillable: billable,
      description: description || null, startedAt: startedAt || null, endedAt: endedAt || null
    });
    return res.status(201).json({ success: true, data: entry });
  } catch (err) {
    console.error('create entry error', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { projectId, taskId, minutes, isBillable, description, startedAt, endedAt } = req.body;
    const entry = await TimesheetEntry.findByPk(id);
    if (!entry) return res.status(404).json({ success: false, message: 'Not found' });
    if (projectId) entry.projectId = projectId;
    if (typeof taskId !== 'undefined') entry.taskId = taskId;
    if (typeof minutes !== 'undefined') entry.minutes = minutes;
    if (typeof isBillable !== 'undefined') entry.isBillable = isBillable;
    if (typeof description !== 'undefined') entry.description = description;
    if (typeof startedAt !== 'undefined') entry.startedAt = startedAt;
    if (typeof endedAt !== 'undefined') entry.endedAt = endedAt;
    await entry.save();
    return res.json({ success: true, data: entry });
  } catch (err) {
    console.error('update entry error', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    const entry = await TimesheetEntry.findByPk(id);
    if (!entry) return res.status(404).json({ success: false, message: 'Not found' });
    await entry.destroy();
    return res.json({ success: true });
  } catch (err) {
    console.error('delete entry error', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.submitDay = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.body;
    if (!date) return res.status(400).json({ success: false, message: 'date is required' });
    const header = await ensureTimesheet(userId, date);
    header.status = 'submitted';
    await header.save();
    return res.json({ success: true, data: { id: header.id, status: header.status } });
  } catch (err) {
    console.error('submitDay error', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
