const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const controller = require('../controllers/notificationController');

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

router.get('/', controller.list);
router.get('/unread-count', controller.unreadCount);
router.post('/read-all', controller.markAllRead);
router.post('/:id/read', controller.markRead);

module.exports = router;

