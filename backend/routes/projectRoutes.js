const express = require('express');
const projectController = require('../controllers/projectController');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router();

// Protect all project routes
router.use(authorizeRoles('Admin', 'Director', 'Account Manager', 'Project Manager'));

// Project routes
router.get('/', projectController.getProjects);
router.get('/managers', projectController.getManagers);
router.get('/users', projectController.getUsers);
router.post('/', projectController.createProject);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.put('/:id/details', projectController.updateProjectDetails);
router.post('/:id/upload', projectController.uploadProjectFiles);
router.get('/:id/files', projectController.getProjectFiles);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
