const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // Basic Information
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Notification Content
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'job_posted', 'job_application', 'job_assigned', 'job_completed',
      'payment_received', 'payment_processed', 'review_received',
      'dispute_raised', 'dispute_resolved', 'profile_verified',
      'system_announcement', 'deadline_reminder', 'general'
    ],
    required: true
  },

  // Related Objects
  relatedJob: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relatedPayment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

  // Status and Actions
  isRead: { type: Boolean, default: false },
  readAt: Date,

  // Action Button (optional)
  actionButton: {
    text: String,
    url: String,
    action: String // e.g., 'view_job', 'accept_application', 'make_payment'
  },

  // Priority and Display
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Delivery Channels
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },

  // Delivery Status
  deliveryStatus: {
    inApp: { delivered: Boolean, deliveredAt: Date },
    email: { delivered: Boolean, deliveredAt: Date, error: String },
    sms: { delivered: Boolean, deliveredAt: Date, error: String },
    push: { delivered: Boolean, deliveredAt: Date, error: String }
  },

  // Expiration
  expiresAt: Date,

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware
NotificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Notification', NotificationSchema);
