const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// GET /api/clients - Get clients for the current user
router.get('/', clientController.getUserClients);

// GET /api/clients/all - Get all clients (for dropdowns, etc.)
router.get('/all', clientController.getAllClients);

// GET /api/clients/industries - Get list of industries
router.get('/industries', clientController.getIndustries);

// GET /api/clients/:id - Get a specific client by ID
router.get('/:id', clientController.getClientById);

// POST /api/clients - Create a new client
router.post('/', clientController.createClient);

// PUT /api/clients/:id - Update a client
router.put('/:id', clientController.updateClient);

module.exports = router;
