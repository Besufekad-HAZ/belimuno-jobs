const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

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

module.exports = router;
