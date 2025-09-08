const express = require('express');
const projectController = require('../controllers/projectController');
const authorizeRoles = require('../middleware/authorizeRoles');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Route for any authenticated user to fetch their accessible projects
router.get('/my', authMiddleware, projectController.getMyProjects);

// Protect all remaining project routes
router.use(authorizeRoles('Admin', 'Director', 'Account Manager', 'Project Manager'));

// Project routes
router.get('/', projectController.getProjects);
router.get('/managers', projectController.getManagers);
router.get('/users', projectController.getUsers);
router.post('/', projectController.createProject);
router.get('/:id', projectController.getProject);
router.get('/:id/performance', projectController.getProjectPerformance);
router.put('/:id', projectController.updateProject);
router.put('/:id/details', projectController.updateProjectDetails);
router.post('/:id/upload', projectController.uploadProjectFiles);
router.get('/:id/files', projectController.getProjectFiles);
// Only allow Account Manager or Project Manager to close a project
router.post('/:id/close', authorizeRoles('Account Manager', 'Project Manager'), projectController.closeProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
