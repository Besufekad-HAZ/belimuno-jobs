const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isRead } = req.query;

  const query = { recipient: req.user._id };
  if (isRead !== undefined) {
    query.isRead = isRead === 'true';
  }

  const notifications = await Notification.find(query)
    .populate('sender', 'name profile.avatar')
    .populate('relatedJob', 'title')
    .populate('relatedUser', 'name profile.avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false
  });

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    unreadCount,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: notifications
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.status(200).json({
    success: true,
    message: `Marked ${result.modifiedCount} notifications as read`
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
exports.getNotificationStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await Notification.aggregate([
    { $match: { recipient: userId } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        unreadCount: {
          $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
        }
      }
    }
  ]);

  const totalNotifications = await Notification.countDocuments({ recipient: userId });
  const unreadNotifications = await Notification.countDocuments({
    recipient: userId,
    isRead: false
  });

  res.status(200).json({
    success: true,
    data: {
      total: totalNotifications,
      unread: unreadNotifications,
      byType: stats
    }
  });
});

// @desc    Create notification (for system use)
// @route   POST /api/notifications/create
// @access  Private/Admin
exports.createNotification = asyncHandler(async (req, res) => {
  const {
    recipients,
    title,
    message,
    type = 'general',
    priority = 'medium',
    relatedJob,
    relatedUser,
    relatedPayment,
    actionButton,
    channels = { inApp: true },
    expiresAt
  } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Recipients array is required'
    });
  }

  if (!title || !message) {
    return res.status(400).json({
      success: false,
      message: 'Title and message are required'
    });
  }

  // Create notifications for all recipients
  const notifications = await Promise.all(
    recipients.map(recipientId =>
      Notification.create({
        recipient: recipientId,
        sender: req.user._id,
        title,
        message,
        type,
        priority,
        relatedJob,
        relatedUser,
        relatedPayment,
        actionButton,
        channels,
        expiresAt
      })
    )
  );

  res.status(201).json({
    success: true,
    message: `Created ${notifications.length} notifications`,
    data: notifications
  });
});

// @desc    Send system announcement
// @route   POST /api/notifications/announcement
// @access  Private/SuperAdmin
exports.sendSystemAnnouncement = asyncHandler(async (req, res) => {
  const {
    title,
    message,
    targetRoles = ['worker', 'client'],
    priority = 'medium',
    expiresAt
  } = req.body;

  if (!title || !message) {
    return res.status(400).json({
      success: false,
      message: 'Title and message are required'
    });
  }

  // Get all users with target roles
  const User = require('../models/User');
  const targetUsers = await User.find({
    role: { $in: targetRoles },
    isActive: true
  }).select('_id');

  if (targetUsers.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No active users found with target roles'
    });
  }

  // Create notifications for all target users
  const notifications = await Promise.all(
    targetUsers.map(user =>
      Notification.create({
        recipient: user._id,
        sender: req.user._id,
        title,
        message,
        type: 'system_announcement',
        priority,
        channels: { inApp: true, email: true },
        expiresAt
      })
    )
  );

  res.status(201).json({
    success: true,
    message: `System announcement sent to ${notifications.length} users`,
    data: {
      recipientCount: notifications.length,
      targetRoles
    }
  });
});
