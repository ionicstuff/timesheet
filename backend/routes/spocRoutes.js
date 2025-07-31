const express = require('express');
const spocController = require('../controllers/spocController');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router();

// Protect all SPOC routes with roles that can manage SPOCs
router.use(authorizeRoles('Admin', 'Director', 'Account Manager', 'Project Manager'));

// SPOC routes
router.get('/', spocController.getAllSpocs);
router.get('/client/:clientId', spocController.getSpocsByClient);
router.post('/', spocController.createSpoc);
router.put('/:id', spocController.updateSpoc);
router.delete('/:id', spocController.deleteSpoc);

module.exports = router;
