const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const Review = require('../models/Review');

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

  // Application stats
  const totalApplications = await Application.countDocuments({ worker: worker._id });
  const pendingApplicationCount = await Application.countDocuments({ worker: worker._id, status: 'pending' });

  const averageRating = worker.workerProfile?.rating || 0; // placeholder if rating aggregated differently later

  const dashboardData = {
    name: worker.name,
    averageRating,
    completedJobs: worker.workerProfile?.completedJobs || 0,
    totalEarnings,
    isVerified: worker.isVerified,
    activeJobs: activeJobs.length,
    totalJobs: jobs.length,
    totalApplications,
    pendingApplications: pendingApplicationCount,
    recentJobs: jobs.slice(0, 5),
    activeJobDetails: activeJobs,
    pendingApplicationsList: pendingApplications,
    notifications
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

  // Validate status transitions with acceptance requirement
  const validTransitions = {
    'assigned': ['in_progress'],
    'in_progress': ['submitted'],
    'revision_requested': ['in_progress', 'submitted']
  };

  if (!validTransitions[job.status]?.includes(status)) {
    return res.status(400).json({ success: false, message: `Cannot change status from ${job.status} to ${status}` });
  }

  if (job.status === 'assigned' && job.workerAcceptance !== 'accepted') {
    return res.status(400).json({ success: false, message: 'You must accept the assignment before starting work' });
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

// @desc    Save a job (bookmark) for later
// @route   POST /api/worker/saved-jobs/:jobId
// @access  Private/Worker
exports.saveJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const job = await Job.findById(jobId).select('_id status isPublic');
  if (!job || (!job.isPublic && String(job.worker) !== String(req.user._id))) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { savedJobs: job._id } });
  res.status(200).json({ success: true, message: 'Job saved' });
});

// @desc    Remove saved job (unbookmark)
// @route   DELETE /api/worker/saved-jobs/:jobId
// @access  Private/Worker
exports.unsaveJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  await User.findByIdAndUpdate(req.user._id, { $pull: { savedJobs: jobId } });
  res.status(200).json({ success: true, message: 'Job removed from saved list' });
});

// @desc    List saved jobs
// @route   GET /api/worker/saved-jobs
// @access  Private/Worker
exports.getSavedJobs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({ path: 'savedJobs', select: 'title budget deadline category region status isPublic createdAt', populate: { path: 'region', select: 'name' } });
  res.status(200).json({ success: true, count: user.savedJobs?.length || 0, data: user.savedJobs || [] });
});

// @desc    Submit review from worker to client
// @route   POST /api/worker/jobs/:id/review
// @access  Private/Worker
exports.reviewClient = asyncHandler(async (req, res) => {
  const { rating, comment, title, detailedRatings } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating 1-5 required' });

  const job = await Job.findOne({ _id: req.params.id, worker: req.user._id });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  if (job.status !== 'completed') return res.status(400).json({ success: false, message: 'Can only review after completion' });
  if (job.review?.workerReview?.rating) {
    return res.status(200).json({ success: true, message: 'Already reviewed', data: job.review.workerReview });
  }

  // Persist to Review collection
  const review = await Review.create({
    job: job._id,
    reviewer: req.user._id,
    reviewee: job.client,
    reviewType: 'worker_to_client',
    rating,
    title,
    comment,
    detailedRatings,
  });

  // Also store summary on Job
  job.review = job.review || {};
  job.review.workerReview = { rating, comment, reviewedAt: new Date() };
  await job.save();

  // Update client's aggregated rating
  const client = await User.findById(job.client);
  client.clientProfile = client.clientProfile || {};
  const currentRating = client.clientProfile.rating || 0;
  const reviewsCount = Array.isArray(client.clientProfile.reviews) ? client.clientProfile.reviews.length : 0;
  const newAverage = ((currentRating * reviewsCount) + rating) / (reviewsCount + 1);
  client.clientProfile.rating = newAverage;
  client.clientProfile.reviews = client.clientProfile.reviews || [];
  client.clientProfile.reviews.push(review._id);
  await client.save();

  res.status(201).json({ success: true, data: review });
});

// @desc    Get messages for an assigned job (worker side)
// @route   GET /api/worker/jobs/:id/messages
// @access  Private/Worker
exports.getJobMessages = asyncHandler(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, worker: req.user._id })
    .populate('messages.sender', 'name role');
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found or not assigned to you' });
  }
  res.status(200).json({ success: true, data: job.messages || [] });
});

// @desc    Send a message in an assigned job (worker side)
// @route   POST /api/worker/jobs/:id/messages
// @access  Private/Worker
exports.sendJobMessage = asyncHandler(async (req, res) => {
  const { content, attachments } = req.body || {};
  if (!content && (!attachments || !attachments.length)) {
    return res.status(400).json({ success: false, message: 'Message content or attachments required' });
  }
  const job = await Job.findOne({ _id: req.params.id, worker: req.user._id });
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found or not assigned to you' });
  }
  const safeAttachments = Array.isArray(attachments) ? attachments.slice(0, 5) : [];
  const message = { sender: req.user._id, content: (content || '').trim(), sentAt: new Date(), attachments: safeAttachments };
  job.messages.push(message);
  await job.save();
  await job.populate('messages.sender', 'name role');
  res.status(201).json({ success: true, data: job.messages[job.messages.length - 1] });
});

// @desc    Decline an assigned job before starting
// @route   PUT /api/worker/jobs/:id/decline
// @access  Private/Worker
exports.declineAssignedJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, worker: req.user._id });
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  if (job.status !== 'assigned') {
    return res.status(400).json({ success: false, message: 'Only newly assigned jobs can be declined' });
  }
  const previousWorker = job.worker;
  job.worker = undefined;
  job.status = 'posted';
  job.workerAcceptance = 'declined';
  await job.save();

  // Notify client of decline
  await Notification.create({
    recipient: job.client,
    sender: previousWorker,
    title: 'Worker Declined Assignment',
    message: `${req.user.name} declined the assignment for "${job.title}". The job has been reopened.`,
    type: 'job_application',
    relatedJob: job._id
  });

  res.status(200).json({ success: true, message: 'Assignment declined and job reopened', data: job });
});

// @desc    Accept an assigned job (worker confirmation)
// @route   PUT /api/worker/jobs/:id/accept
// @access  Private/Worker
exports.acceptAssignedJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, worker: req.user._id });
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  if (job.status !== 'assigned') {
    return res.status(400).json({ success: false, message: 'Job is not in an assignable state' });
  }
  if (job.workerAcceptance === 'accepted') {
    return res.status(400).json({ success: false, message: 'Job already accepted' });
  }
  job.workerAcceptance = 'accepted';
  await job.save();

  await Notification.create({
    recipient: job.client,
    sender: req.user._id,
    title: 'Worker Accepted Assignment',
    message: `${req.user.name} accepted the assignment for "${job.title}"`,
    type: 'job_assigned',
    relatedJob: job._id
  });

  res.status(200).json({ success: true, message: 'Assignment accepted', data: job });
});
