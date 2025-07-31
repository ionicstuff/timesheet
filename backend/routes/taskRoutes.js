const express = require('express');
const taskController = require('../controllers/taskController');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router();

// Protect all task routes
router.use(authorizeRoles('Admin', 'Director', 'Account Manager', 'Project Manager', 'Team Lead', 'Developer'));

// Task routes
router.get('/', taskController.getTasks);
router.get('/my-tasks', taskController.getMyTasks);
router.post('/', taskController.createTask);
router.get('/project/:projectId', taskController.getTasksByProject);
router.put('/:id/accept', taskController.acceptTask);
router.put('/:id/reject', taskController.rejectTask);
router.get('/:id', taskController.getTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
