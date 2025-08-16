const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/timesheetEntryController');

router.use(authMiddleware);

router.get('/', ctrl.listForDate);           // ?date=YYYY-MM-DD
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/submit', ctrl.submitDay);      // { date }

module.exports = router;
