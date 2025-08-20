const Notification = require('../models/Notification');

/**
 * Notification Service - Centralized notification management
 */
class NotificationService {
  /**
   * Create a notification for one or multiple recipients
   */
  static async createNotification({
    recipients,
    sender,
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
  }) {
    try {
      const recipientArray = Array.isArray(recipients) ? recipients : [recipients];

      const notifications = await Promise.all(
        recipientArray.map(recipientId =>
          Notification.create({
            recipient: recipientId,
            sender,
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

      return notifications;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Job-related notifications
   */
  static async notifyJobPosted(jobId, clientId, workersInRegion = []) {
    const Job = require('../models/Job');
    const job = await Job.findById(jobId).populate('client', 'name');

    if (!job) return;

    // Notify suitable workers
    if (workersInRegion.length > 0) {
      await this.createNotification({
        recipients: workersInRegion,
        sender: clientId,
        title: 'New Job Opportunity! 💼',
        message: `A new job "${job.title}" has been posted in your area. Check it out!`,
        type: 'job_posted',
        priority: 'medium',
        relatedJob: jobId,
        actionButton: {
          text: 'View Job',
          url: `/jobs/${jobId}`,
          action: 'view_job'
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
    }
  }

  static async notifyJobApplication(jobId, workerId, clientId) {
    const Job = require('../models/Job');
    const User = require('../models/User');

    const [job, worker] = await Promise.all([
      Job.findById(jobId),
      User.findById(workerId)
    ]);

    if (!job || !worker) return;

    // Notify client of new application
    await this.createNotification({
      recipients: [clientId],
      sender: workerId,
      title: 'New Job Application! 📝',
      message: `${worker.name} has applied for your job "${job.title}". Review their application now.`,
      type: 'job_application',
      priority: 'high',
      relatedJob: jobId,
      relatedUser: workerId,
      actionButton: {
        text: 'Review Application',
        url: `/client/jobs/${jobId}/applications`,
        action: 'review_application'
      }
    });
  }

  static async notifyJobAssigned(jobId, workerId, clientId) {
    const Job = require('../models/Job');
    const User = require('../models/User');

    const [job, client] = await Promise.all([
      Job.findById(jobId),
      User.findById(clientId)
    ]);

    if (!job || !client) return;

    // Notify worker of job assignment
    await this.createNotification({
      recipients: [workerId],
      sender: clientId,
      title: 'Job Assigned! 🎉',
      message: `Congratulations! You've been assigned to work on "${job.title}" by ${client.name}.`,
      type: 'job_assigned',
      priority: 'high',
      relatedJob: jobId,
      relatedUser: clientId,
      actionButton: {
        text: 'View Job Details',
        url: `/worker/jobs/${jobId}`,
        action: 'view_job_details'
      }
    });
  }

  static async notifyJobCompleted(jobId, workerId, clientId) {
    const Job = require('../models/Job');

    const job = await Job.findById(jobId).populate('worker client', 'name');
    if (!job) return;

    // Notify both parties
    await Promise.all([
      // Notify client
      this.createNotification({
        recipients: [clientId],
        sender: workerId,
        title: 'Job Completed! ✅',
        message: `${job.worker.name} has completed the job "${job.title}". Please review and make payment.`,
        type: 'job_completed',
        priority: 'high',
        relatedJob: jobId,
        relatedUser: workerId,
        actionButton: {
          text: 'Review & Pay',
          url: `/client/jobs/${jobId}/payment`,
          action: 'review_and_pay'
        }
      }),
      // Notify worker
      this.createNotification({
        recipients: [workerId],
        sender: clientId,
        title: 'Job Marked as Completed! ✅',
        message: `Your work on "${job.title}" has been marked as completed. Awaiting client review and payment.`,
        type: 'job_completed',
        priority: 'medium',
        relatedJob: jobId,
        relatedUser: clientId
      })
    ]);
  }

  static async notifyRevisionRequested(jobId, workerId, clientId, reason) {
    const Job = require('../models/Job');
    const User = require('../models/User');

    const [job, client] = await Promise.all([
      Job.findById(jobId),
      User.findById(clientId)
    ]);

    if (!job || !client) return;

    // Notify worker about revision request
    await this.createNotification({
      recipients: [workerId],
      sender: clientId,
      title: 'Revision Requested 🔄',
      message: `The client has requested revisions for "${job.title}". Reason: ${reason}`,
      type: 'revision_requested',
      priority: 'high',
      relatedJob: jobId,
      relatedUser: clientId,
      actionButton: {
        text: 'View Job Details',
        url: `/worker/jobs/${jobId}`,
        action: 'view_job_details'
      }
    });
  }

  /**
   * Payment-related notifications
   */
  static async notifyPaymentReceived(paymentId, workerId, amount) {
    await this.createNotification({
      recipients: [workerId],
      title: 'Payment Received! 💰',
      message: `You've received a payment of $${amount}. The funds have been credited to your account.`,
      type: 'payment_received',
      priority: 'high',
      relatedPayment: paymentId,
      actionButton: {
        text: 'View Earnings',
        url: '/worker/earnings',
        action: 'view_earnings'
      }
    });
  }

  static async notifyPaymentProcessed(paymentId, clientId, amount) {
    await this.createNotification({
      recipients: [clientId],
      title: 'Payment Processed! ✅',
      message: `Your payment of $${amount} has been successfully processed and sent to the worker.`,
      type: 'payment_processed',
      priority: 'medium',
      relatedPayment: paymentId,
      actionButton: {
        text: 'View Payment History',
        url: '/client/payments',
        action: 'view_payments'
      }
    });
  }

  /**
   * Review and rating notifications
   */
  static async notifyReviewReceived(reviewId, revieweeId, reviewerName, rating) {
    await this.createNotification({
      recipients: [revieweeId],
      title: 'New Review Received! ⭐',
      message: `${reviewerName} has left you a ${rating}-star review. Check it out!`,
      type: 'review_received',
      priority: 'medium',
      actionButton: {
        text: 'View Review',
        url: '/profile/reviews',
        action: 'view_reviews'
      }
    });
  }

  /**
   * HR-related notifications
   */
  static async notifyWorkerVerified(workerId) {
    await this.createNotification({
      recipients: [workerId],
      title: 'Profile Verified! 🎉',
      message: 'Congratulations! Your worker profile has been verified by our HR team. You can now apply for jobs.',
      type: 'profile_verified',
      priority: 'high',
      actionButton: {
        text: 'Browse Jobs',
        url: '/jobs',
        action: 'browse_jobs'
      }
    });
  }

  static async notifyWorkerRejected(workerId, reason) {
    await this.createNotification({
      recipients: [workerId],
      title: 'Profile Verification Update',
      message: `Your profile verification was not approved. Reason: ${reason}. Please update your profile and resubmit.`,
      type: 'profile_verified',
      priority: 'high',
      actionButton: {
        text: 'Update Profile',
        url: '/profile/edit',
        action: 'update_profile'
      }
    });
  }

  /**
   * Dispute-related notifications
   */
  static async notifyDisputeRaised(disputeId, involvedParties, description) {
    const User = require('../models/User');

    // Get admin users
    const admins = await User.find({
      role: { $in: ['super_admin', 'admin_hr'] },
      isActive: true
    }).select('_id');

    const adminIds = admins.map(admin => admin._id);

    // Notify admins
    if (adminIds.length > 0) {
      await this.createNotification({
        recipients: adminIds,
        title: 'New Dispute Raised! ⚠️',
        message: `A new dispute has been raised between involved parties. Immediate attention required.`,
        type: 'dispute_raised',
        priority: 'urgent',
        actionButton: {
          text: 'Handle Dispute',
          url: `/admin/disputes/${disputeId}`,
          action: 'handle_dispute'
        }
      });
    }

    // Notify involved parties
    await this.createNotification({
      recipients: involvedParties,
      title: 'Dispute Case Opened',
      message: 'A dispute case has been opened for your project. Our team will review and contact you soon.',
      type: 'dispute_raised',
      priority: 'high'
    });
  }

  static async notifyDisputeResolved(disputeId, involvedParties, resolution) {
    await this.createNotification({
      recipients: involvedParties,
      title: 'Dispute Resolved ✅',
      message: `Your dispute has been resolved. Resolution: ${resolution}`,
      type: 'dispute_resolved',
      priority: 'high',
      actionButton: {
        text: 'View Resolution',
        url: `/disputes/${disputeId}`,
        action: 'view_resolution'
      }
    });
  }

  /**
   * System notifications
   */
  static async notifySystemMaintenance(targetRoles = ['worker', 'client'], maintenanceTime) {
    const User = require('../models/User');

    const users = await User.find({
      role: { $in: targetRoles },
      isActive: true
    }).select('_id');

    const userIds = users.map(user => user._id);

    if (userIds.length > 0) {
      await this.createNotification({
        recipients: userIds,
        title: 'Scheduled Maintenance Notice 🔧',
        message: `System maintenance is scheduled for ${maintenanceTime}. Service may be temporarily unavailable.`,
        type: 'system_announcement',
        priority: 'medium',
        channels: { inApp: true, email: true }
      });
    }
  }

  static async notifyDeadlineReminder(jobId, workerId, hoursLeft) {
    const Job = require('../models/Job');
    const job = await Job.findById(jobId);

    if (!job) return;

    await this.createNotification({
      recipients: [workerId],
      title: 'Deadline Reminder! ⏰',
      message: `Your job "${job.title}" is due in ${hoursLeft} hours. Make sure to complete it on time.`,
      type: 'deadline_reminder',
      priority: hoursLeft <= 24 ? 'urgent' : 'high',
      relatedJob: jobId,
      actionButton: {
        text: 'View Job',
        url: `/worker/jobs/${jobId}`,
        action: 'view_job'
      }
    });
  }

  /**
   * Bulk notifications for admin use
   */
  static async sendBulkNotification({
    targetRoles = ['worker', 'client'],
    title,
    message,
    type = 'system_announcement',
    priority = 'medium',
    actionButton,
    expiresAt
  }) {
    const User = require('../models/User');

    const users = await User.find({
      role: { $in: targetRoles },
      isActive: true
    }).select('_id');

    const userIds = users.map(user => user._id);

    if (userIds.length > 0) {
      return await this.createNotification({
        recipients: userIds,
        title,
        message,
        type,
        priority,
        actionButton,
        channels: { inApp: true, email: true },
        expiresAt
      });
    }

    return [];
  }
}

module.exports = NotificationService;
