const { Task, Project, User } = require('../models');
const sequelize = require('../config/database');

// Get all tasks
const getTasks = async (req, res) => {
  try {
    const { projectId, assignedTo, status } = req.query;
    const whereClause = {};
    
    if (projectId) whereClause.projectId = projectId;
    if (assignedTo) whereClause.assignedTo = assignedTo;
    if (status) whereClause.status = status;
    
    const tasks = await Task.findAll({
      where: whereClause,
      include: [
        { 
          model: Project, 
          as: 'project',
          attributes: ['id', 'projectName', 'projectCode']
        }, 
        { 
          model: User, 
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

// Get tasks by project
const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.findAll({
      where: { projectId },
      include: [
        { 
          model: User, 
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks by project:', error);
    res.status(500).json({ message: 'Error fetching tasks by project', error: error.message });
  }
};

// Get a single task
const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id, {
      include: [{ model: Project, as: 'project' }, { model: User, as: 'assignee' }]
    });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Error fetching task', error: error.message });
  }
};

// Create a new task
const createTask = async (req, res) => {
  try {
    const { projectId, name, description, assignedTo, estimatedTime } = req.body;
    const task = await Task.create({
      projectId,
      name,
      description,
      assignedTo,
      estimatedTime
    });

    // Send notification to assigned user if they exist
    if (assignedTo) {
      // Example notification - Replace it with your notification system implementation
      console.log(`Notification sent to user ${assignedTo}: You have been assigned a new task: ${name}.`);
    }

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

// Update a task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, assignedTo, estimatedTime, status } = req.body;
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    await task.update({ name, description, assignedTo, estimatedTime, status });
    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    await task.destroy();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

// Accept a task
const acceptTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if the current user is the assigned user
    if (task.assignedTo !== req.user.id) {
      return res.status(403).json({ message: 'You can only accept tasks assigned to you' });
    }

    await task.update({
      acceptanceStatus: 'accepted',
      acceptedAt: new Date()
    });

    res.json({ message: 'Task accepted successfully', task });
  } catch (error) {
    console.error('Error accepting task:', error);
    res.status(500).json({ message: 'Error accepting task', error: error.message });
  }
};

// Reject a task
const rejectTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const task = await Task.findByPk(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if the current user is the assigned user
    if (task.assignedTo !== req.user.id) {
      return res.status(403).json({ message: 'You can only reject tasks assigned to you' });
    }

    await task.update({
      acceptanceStatus: 'rejected',
      rejectionReason: rejectionReason || null
    });

    res.json({ message: 'Task rejected successfully', task });
  } catch (error) {
    console.error('Error rejecting task:', error);
    res.status(500).json({ message: 'Error rejecting task', error: error.message });
  }
};

// Get tasks assigned to current user
const getMyTasks = async (req, res) => {
  try {
    const { status, acceptanceStatus } = req.query;
    const whereClause = { assignedTo: req.user.id };
    
    if (status) whereClause.status = status;
    if (acceptanceStatus) whereClause.acceptanceStatus = acceptanceStatus;
    
    const tasks = await Task.findAll({
      where: whereClause,
      include: [
        { 
          model: Project, 
          as: 'project',
          attributes: ['id', 'projectName', 'projectCode']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    res.status(500).json({ message: 'Error fetching my tasks', error: error.message });
  }
};

// Get time logs for a task
const getTaskTimeLogs = async (req, res) => {
  try {
    const TaskTimeLog = require('../models/TaskTimeLog');
    const { id } = req.params;
    const logs = await TaskTimeLog.findAll({
      where: { taskId: id },
      order: [['created_at', 'ASC']]
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching task time logs:', error);
    res.status(500).json({ message: 'Error fetching task time logs', error: error.message });
  }
};

const TaskTimerService = require('../services/TaskTimerService');

const startTask = async (req, res) => {
  try {
    const task = await TaskTimerService.start(req.params.id, req.user, req.body?.note || null);
    res.json({ message: 'Task started', task });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const pauseTask = async (req, res) => {
  try {
    const task = await TaskTimerService.pause(req.params.id, req.user, req.body?.note || null);
    res.json({ message: 'Task paused', task });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const resumeTask = async (req, res) => {
  try {
    const task = await TaskTimerService.resume(req.params.id, req.user, req.body?.note || null);
    res.json({ message: 'Task resumed', task });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const stopTask = async (req, res) => {
  try {
    const task = await TaskTimerService.stop(req.params.id, req.user, req.body?.note || null);
    res.json({ message: 'Task stopped', task });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const completeTask = async (req, res) => {
  try {
    const task = await TaskTimerService.complete(req.params.id, req.user, req.body?.note || null);
    res.json({ message: 'Task completed', task });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = {
  getTasks,
  getTasksByProject,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  acceptTask,
  rejectTask,
  getMyTasks,
  startTask,
  pauseTask,
  resumeTask,
  stopTask,
  completeTask,
  getTaskTimeLogs
};

