const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
  createNotification,
  sendSystemAnnouncement
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { requireAnyAdmin, requireSuperAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// Get notifications and stats
router.get('/', getNotifications);
router.get('/stats', getNotificationStats);

// Mark notifications as read
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// Admin routes
router.post('/create', requireAnyAdmin, createNotification);
router.post('/announcement', requireSuperAdmin, sendSystemAnnouncement);

module.exports = router;
