const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get worker dashboard
// @route   GET /api/worker/dashboard
// @access  Private/Worker
exports.getDashboard = asyncHandler(async (req, res) => {
  const worker = req.user;

  // Get worker's jobs
  const jobs = await Job.find({ worker: worker._id })
    .populate('client', 'name profile.avatar')
    .sort({ createdAt: -1 });

  const activeJobs = jobs.filter(job => ['assigned', 'in_progress'].includes(job.status));
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.payment?.workerEarnings || 0), 0);

  // Get pending applications
  const pendingApplications = await Application.find({
    worker: worker._id,
    status: 'pending'
  })
    .populate('job', 'title budget deadline')
    .sort({ appliedAt: -1 })
    .limit(5);

  // Get notifications
  const notifications = await Notification.find({
    recipient: worker._id,
    isRead: false
  })
    .sort({ createdAt: -1 })
    .limit(10);

  const dashboardData = {
    worker: {
      name: worker.name,
      rating: worker.workerProfile?.rating || 0,
      completedJobs: worker.workerProfile?.completedJobs || 0,
      totalEarnings,
      isVerified: worker.isVerified
    },
    jobs: {
      active: activeJobs,
      recent: jobs.slice(0, 5)
    },
    applications: pendingApplications,
    notifications,
    stats: {
      totalJobs: jobs.length,
      activeJobs: activeJobs.length,
      completedJobs: completedJobs.length,
      totalEarnings,
      pendingApplications: pendingApplications.length
    }
  };

  res.status(200).json({
    success: true,
    data: dashboardData
  });
});

// @desc    Get worker's jobs
// @route   GET /api/worker/jobs
// @access  Private/Worker
exports.getJobs = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10, sort = '-createdAt' } = req.query;

  const query = { worker: req.user._id };
  if (status) {
    query.status = status;
  }

  const jobs = await Job.find(query)
    .populate('client', 'name profile.avatar clientProfile.companyName')
    .populate('region', 'name')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Job.countDocuments(query);

  res.status(200).json({
    success: true,
    count: jobs.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: jobs
  });
});

// Legacy method name for backward compatibility
exports.getWorkerJobs = exports.getJobs;

// @desc    Get single job details for worker
// @route   GET /api/worker/jobs/:id
// @access  Private/Worker
exports.getJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    worker: req.user._id
  })
    .populate('client', 'name profile clientProfile')
    .populate('region', 'name');

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  res.status(200).json({
    success: true,
    data: job
  });
});

// @desc    Update job status/progress
// @route   PUT /api/worker/jobs/:id/status
// @access  Private/Worker
exports.updateJobStatus = asyncHandler(async (req, res) => {
  const { status, progressPercentage, updateMessage, attachments } = req.body;

  const job = await Job.findOne({
    _id: req.params.id,
    worker: req.user._id
  }).populate('client');

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  // Validate status transitions
  const validTransitions = {
    'assigned': ['in_progress'],
    'in_progress': ['submitted'],
    'revision_requested': ['in_progress', 'submitted']
  };

  if (!validTransitions[job.status]?.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot change status from ${job.status} to ${status}`
    });
  }

  // Update job status
  job.status = status;

  if (status === 'in_progress') {
    job.startDate = job.startDate || new Date();
  }

  // Update progress if provided
  if (progressPercentage !== undefined) {
    job.progress.percentage = Math.max(0, Math.min(100, progressPercentage));
  }

  // Add progress update
  if (updateMessage) {
    job.progress.updates.push({
      message: updateMessage,
      updatedBy: req.user._id,
      attachments: attachments || []
    });
  }

  await job.save();

  // Create notification for client
  let notificationMessage = '';
  let notificationType = 'general';

  switch (status) {
    case 'in_progress':
      notificationMessage = `${req.user.name} has started working on "${job.title}"`;
      notificationType = 'job_assigned';
      break;
    case 'submitted':
      notificationMessage = `${req.user.name} has submitted the work for "${job.title}"`;
      notificationType = 'job_completed';
      break;
  }

  if (notificationMessage) {
    await Notification.create({
      recipient: job.client._id,
      sender: req.user._id,
      title: 'Job Status Update',
      message: notificationMessage,
      type: notificationType,
      relatedJob: job._id,
      actionButton: {
        text: 'View Job',
        action: 'view_job'
      }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Job status updated successfully',
    data: job
  });
});

// @desc    Get worker's applications
// @route   GET /api/worker/applications
// @access  Private/Worker
exports.getApplications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { worker: req.user._id };
  if (status) {
    query.status = status;
  }

  const applications = await Application.find(query)
    .populate('job', 'title description budget deadline status')
    .populate('job.client', 'name profile.avatar')
    .sort({ appliedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Application.countDocuments(query);

  res.status(200).json({
    success: true,
    count: applications.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: applications
  });
});

// @desc    Withdraw job application
// @route   DELETE /api/worker/applications/:id
// @access  Private/Worker
exports.withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.id,
    worker: req.user._id
  }).populate('job');

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }

  if (application.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Can only withdraw pending applications'
    });
  }

  application.status = 'withdrawn';
  await application.save();

  res.status(200).json({
    success: true,
    message: 'Application withdrawn successfully',
    data: application
  });
});

// @desc    Update worker profile
// @route   PUT /api/worker/profile
// @access  Private/Worker
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name', 'phone', 'profile', 'workerProfile'
  ];

  const updateData = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updateData[key] = req.body[key];
    }
  });

  const worker = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: worker
  });
});

// @desc    Get worker's earnings/payments
// @route   GET /api/worker/earnings
// @access  Private/Worker
exports.getEarnings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const payments = await Payment.find({
    worker: req.user._id,
    status: { $in: ['completed', 'pending'] }
  })
    .populate('job', 'title')
    .populate('client', 'name profile.avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Payment.countDocuments({
    worker: req.user._id,
    status: { $in: ['completed', 'pending'] }
  });

  // Calculate earnings summary
  const totalEarnings = await Payment.aggregate([
    {
      $match: {
        worker: req.user._id,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const pendingEarnings = await Payment.aggregate([
    {
      $match: {
        worker: req.user._id,
        status: 'pending'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const summary = {
    totalEarnings: totalEarnings[0]?.total || 0,
    completedPayments: totalEarnings[0]?.count || 0,
    pendingEarnings: pendingEarnings[0]?.total || 0,
    pendingPayments: pendingEarnings[0]?.count || 0
  };

  res.status(200).json({
    success: true,
    count: payments.length,
    total,
    summary,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: payments
  });
});
