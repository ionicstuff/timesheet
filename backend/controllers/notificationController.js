const Notification = require('../models/Notification');

// GET /api/notifications
// Query: limit, offset, unreadOnly
exports.list = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const offset = parseInt(req.query.offset, 10) || 0;
    const unreadOnly = (req.query.unreadOnly === '1' || req.query.unreadOnly === 'true');

    const where = { userId: req.user.id };
    if (unreadOnly) where.isRead = false;

    const items = await Notification.findAll({
      where,
      order: [['id', 'DESC']],
      limit,
      offset,
    });

    // Include createdAt derived from created_at if present
    const data = items.map((n) => {
      const obj = n.toJSON();
      const createdAt = (typeof n.get === 'function') ? n.get('created_at') : obj.created_at;
      if (createdAt && !obj.createdAt) obj.createdAt = createdAt;
      return obj;
    });

    res.json({ items: data });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// GET /api/notifications/unread-count
exports.unreadCount = async (req, res) => {
  try {
    const count = await Notification.count({ where: { userId: req.user.id, isRead: false } });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
};

// POST /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findByPk(id);
    if (!notif || notif.userId !== req.user.id) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    if (!notif.isRead) await notif.update({ isRead: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
};

// POST /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    const [updated] = await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );
    res.json({ success: true, updated });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error marking all notifications as read', error: error.message });
  }
};

