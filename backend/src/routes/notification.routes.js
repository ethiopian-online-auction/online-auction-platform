const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const notificationService = require('../services/notification.service');

// GET /api/notifications - fetch all notifications for logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.userId);
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
});

// PUT /api/notifications/read-all - must be before /:id/read to avoid route conflict
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.userId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const updated = await notificationService.markAsRead(req.params.id, req.user.userId);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
});

module.exports = router;
