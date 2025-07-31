const express = require('express');
const clientController = require('../controllers/clientController');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router();

// Protect all client routes with roles that can manage clients
router.use(authorizeRoles('Admin', 'Director', 'Account Manager', 'Project Manager'));

// Client routes
router.get('/', clientController.getClients);
router.get('/all', clientController.getAllClients);
router.post('/', clientController.createClient);
router.get('/:id', clientController.getClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);
module.exports = router;
