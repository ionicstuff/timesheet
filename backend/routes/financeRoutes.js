const express = require('express');
const authorizeRoles = require('../middleware/authorizeRoles');
const financeController = require('../controllers/financeController');

const router = express.Router();

// All finance routes restricted to Finance role
router.use(authorizeRoles('Finance'));

router.get('/ready-projects', financeController.getReadyProjects);
router.post('/projects/:projectId/invoice', financeController.generateInvoice);

router.get('/invoices', financeController.listInvoices);

// Allow viewing PDFs to Finance (and maybe later AM/PM)
router.get('/invoices/:id/pdf', financeController.getInvoicePdf);

router.post('/invoices/:id/approve', financeController.approveInvoice);
router.post('/invoices/:id/send', financeController.sendInvoice);

module.exports = router;
