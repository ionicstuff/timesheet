const express = require('express');
const adminController = require('../controllers/adminController');
const adminAuthMiddleware = require('../middleware/adminAuth');

const router = express.Router();

// Use adminAuthMiddleware to protect admin routes
router.use(adminAuthMiddleware);

// Dashboard stats
router.get('/dashboard/stats', adminController.getDashboardStats);

// Role management routes
router.get('/roles', adminController.getRoles);
router.post('/roles', adminController.createRole);
router.put('/roles/:id', adminController.updateRole);
router.delete('/roles/:id', adminController.deleteRole);

// User management routes
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Permission and module routes
router.get('/permissions', adminController.getPermissions);
router.get('/modules', adminController.getModules);

// Client management routes
router.get('/clients', adminController.getClients);
router.post('/clients', adminController.createClient);
router.put('/clients/:id', adminController.updateClient);
router.delete('/clients/:id', adminController.deleteClient);

// Project management routes
router.get('/projects', adminController.getProjects);
router.post('/projects', adminController.createProject);
router.put('/projects/:id', adminController.updateProject);
router.delete('/projects/:id', adminController.deleteProject);

// Department and designation routes
router.get('/departments', adminController.getDepartments);
router.get('/designations', adminController.getDesignations);

module.exports = router;

