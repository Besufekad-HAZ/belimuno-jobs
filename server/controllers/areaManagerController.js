const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Region = require('../models/Region');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get area manager dashboard
// @route   GET /api/area-manager/dashboard
// @access  Private/Area Manager
exports.getDashboard = asyncHandler(async (req, res) => {
  const areaManager = req.user;

  if (!areaManager.region) {
    return res.status(400).json({
      success: false,
      message: 'Area manager must be assigned to a region'
    });
  }

  // Get jobs in the manager's region
  const jobs = await Job.find({ region: areaManager.region })
    .populate('client', 'name profile.avatar')
    .populate('worker', 'name profile.avatar')
    .sort({ createdAt: -1 });

  const activeJobs = jobs.filter(job => ['posted', 'assigned', 'in_progress'].includes(job.status));
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const pendingJobs = jobs.filter(job => job.status === 'posted');

  // Get workers in the region
  const workers = await User.find({
    role: 'worker',
    region: areaManager.region
  });

  const clients = await User.find({
    role: 'client',
    region: areaManager.region
  });

  // Get pending applications in region
  const pendingApplications = await Application.find({
    job: { $in: jobs.map(job => job._id) },
    status: 'pending'
  })
    .populate('worker', 'name profile.avatar workerProfile.rating')
    .populate('job', 'title budget')
    .sort({ appliedAt: -1 })
    .limit(10);

  // Get notifications for area manager
  const notifications = await Notification.find({
    recipient: areaManager._id,
    isRead: false
  })
    .sort({ createdAt: -1 })
    .limit(10);

  // Calculate regional revenue
  const regionalRevenue = completedJobs.reduce((sum, job) =>
    sum + (job.payment?.totalAmount || 0), 0
  );

  const dashboardData = {
    region: await Region.findById(areaManager.region),
    stats: {
      totalJobs: jobs.length,
      activeJobs: activeJobs.length,
      completedJobs: completedJobs.length,
      pendingJobs: pendingJobs.length,
      totalWorkers: workers.length,
      verifiedWorkers: workers.filter(w => w.isVerified).length,
      unverifiedWorkers: workers.filter(w => !w.isVerified).length,
      totalClients: clients.length,
      regionalRevenue,
      pendingApplications: pendingApplications.length
    },
    recentJobs: jobs.slice(0, 10),
    pendingApplications,
    notifications,
    topWorkers: workers
      .filter(w => w.workerProfile?.rating > 0)
      .sort((a, b) => (b.workerProfile.rating || 0) - (a.workerProfile.rating || 0))
      .slice(0, 5)
  };

  res.status(200).json({
    success: true,
    data: dashboardData
  });
});

// @desc    Get workers in area manager's region
// @route   GET /api/area-manager/workers
// @access  Private/Area Manager
exports.getWorkers = asyncHandler(async (req, res) => {
  const { isVerified, isActive, page = 1, limit = 20, search } = req.query;

  const query = {
    role: 'worker',
    region: req.user.region
  };

  if (isVerified !== undefined) query.isVerified = isVerified === 'true';
  if (isActive !== undefined) query.isActive = isActive === 'true';

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const workers = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(query);

  // Get job statistics for each worker
  const workersWithStats = await Promise.all(
    workers.map(async (worker) => {
      const workerJobs = await Job.find({ worker: worker._id });
      const completedJobs = workerJobs.filter(job => job.status === 'completed');
      const activeJobs = workerJobs.filter(job => ['assigned', 'in_progress'].includes(job.status));

      return {
        ...worker.toObject(),
        jobStats: {
          total: workerJobs.length,
          completed: completedJobs.length,
          active: activeJobs.length,
          totalEarnings: completedJobs.reduce((sum, job) =>
            sum + (job.payment?.workerEarnings || 0), 0
          )
        }
      };
    })
  );

  res.status(200).json({
    success: true,
    count: workers.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: workersWithStats
  });
});

// @desc    Verify worker in region
// @route   PUT /api/area-manager/workers/:id/verify
// @access  Private/Area Manager
exports.verifyWorker = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  // Check if worker is in area manager's region
  const worker = await User.findOne({
    _id: req.params.id,
    role: 'worker',
    region: req.user.region
  });

  if (!worker) {
    return res.status(404).json({
      success: false,
      message: 'Worker not found in your region'
    });
  }

  if (worker.isVerified) {
    return res.status(400).json({
      success: false,
      message: 'Worker is already verified'
    });
  }

  // Update worker verification
  worker.isVerified = true;
  worker.verificationNotes = notes;
  worker.verifiedBy = req.user._id;
  worker.verifiedAt = new Date();
  await worker.save();

  // Create notification for worker
  await Notification.create({
    recipient: worker._id,
    sender: req.user._id,
    title: 'Profile Verified',
    message: 'Congratulations! Your worker profile has been verified by your area manager. You can now apply for jobs.',
    type: 'profile_verified'
  });

  res.status(200).json({
    success: true,
    message: 'Worker verified successfully',
    data: worker
  });
});

// @desc    Get jobs in area manager's region
// @route   GET /api/area-manager/jobs
// @access  Private/Area Manager
exports.getJobs = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = { region: req.user.region };
  if (status) query.status = status;

  const jobs = await Job.find(query)
    .populate('client', 'name profile.avatar clientProfile.companyName')
    .populate('worker', 'name profile.avatar workerProfile.rating')
    .sort({ createdAt: -1 })
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

// @desc    Get job applications in region
// @route   GET /api/area-manager/applications
// @access  Private/Area Manager
exports.getApplications = asyncHandler(async (req, res) => {
  const { status = 'pending', page = 1, limit = 20 } = req.query;

  // Get jobs in the region first
  const regionalJobs = await Job.find({ region: req.user.region }).select('_id');
  const jobIds = regionalJobs.map(job => job._id);

  const query = {
    job: { $in: jobIds },
    status
  };

  const applications = await Application.find(query)
    .populate('worker', 'name profile.avatar workerProfile.rating workerProfile.skills')
    .populate('job', 'title description budget deadline')
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

// @desc    Handle escalation or dispute in region
// @route   PUT /api/area-manager/jobs/:id/escalate
// @access  Private/Area Manager
exports.handleEscalation = asyncHandler(async (req, res) => {
  let { action, resolution, notes, reason } = req.body; // action: 'resolve', 'escalate_to_admin'
  // Backward-compat: if only reason provided, interpret as escalate_to_admin
  if (!action && reason) {
    action = 'escalate_to_admin';
    notes = reason;
  }

  const job = await Job.findOne({
    _id: req.params.id,
    region: req.user.region
  })
    .populate('client')
    .populate('worker');

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found in your region'
    });
  }

  if (!job.dispute.isDisputed) {
    return res.status(400).json({
      success: false,
      message: 'No active dispute for this job'
    });
  }

  if (action === 'resolve') {
    // Area manager resolves the dispute
    job.dispute.status = 'resolved';
    job.dispute.resolvedBy = req.user._id;
    job.dispute.resolution = resolution;
    job.dispute.resolvedAt = new Date();

    await job.save();

    // Create notifications
    await Notification.create({
      recipient: job.client._id,
      sender: req.user._id,
      title: 'Dispute Resolved',
      message: `Your dispute for "${job.title}" has been resolved by the area manager.`,
      type: 'dispute_resolved',
      relatedJob: job._id
    });

    await Notification.create({
      recipient: job.worker._id,
      sender: req.user._id,
      title: 'Dispute Resolved',
      message: `The dispute for "${job.title}" has been resolved by the area manager.`,
      type: 'dispute_resolved',
      relatedJob: job._id
    });

    res.status(200).json({
      success: true,
      message: 'Dispute resolved successfully',
      data: job
    });

  } else if (action === 'escalate_to_admin') {
    // Escalate to super admin
    job.dispute.status = 'escalated';
    job.escalationNotes = notes;
    job.escalatedBy = req.user._id;
    job.escalatedAt = new Date();

    await job.save();

    // Notify super admin
    const superAdmin = await User.findOne({ role: 'super_admin' });
    if (superAdmin) {
      await Notification.create({
        recipient: superAdmin._id,
        sender: req.user._id,
        title: 'Dispute Escalated',
        message: `A dispute for "${job.title}" has been escalated from ${req.user.region} region.`,
        type: 'dispute_raised',
        relatedJob: job._id,
        actionButton: {
          text: 'Review Dispute',
          action: 'view_job'
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Dispute escalated to super admin',
      data: job
    });
  }
});

// @desc    Get messages for any job in manager's region
// @route   GET /api/area-manager/jobs/:id/messages
// @access  Private/Area Manager
exports.getJobMessages = asyncHandler(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, region: req.user.region })
    .populate('messages.sender', 'name role');
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found in your region' });
  }
  res.status(200).json({ success: true, data: job.messages || [] });
});

// @desc    Send a message to a job thread in manager's region
// @route   POST /api/area-manager/jobs/:id/messages
// @access  Private/Area Manager
exports.sendJobMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: 'Message content required' });
  }
  const job = await Job.findOne({ _id: req.params.id, region: req.user.region });
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found in your region' });
  }
  job.messages.push({ sender: req.user._id, content: content.trim(), sentAt: new Date(), attachments: [] });
  await job.save();
  await job.populate('messages.sender', 'name role');
  res.status(201).json({ success: true, data: job.messages[job.messages.length - 1] });
});

// @desc    Reject worker onboarding in region
// @route   PUT /api/area-manager/workers/:id/reject
// @access  Private/Area Manager
exports.rejectWorker = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const worker = await User.findOne({ _id: req.params.id, role: 'worker', region: req.user.region });
  if (!worker) {
    return res.status(404).json({ success: false, message: 'Worker not found in your region' });
  }
  worker.isVerified = false;
  worker.verificationNotes = reason;
  await worker.save();

  await Notification.create({
    recipient: worker._id,
    sender: req.user._id,
    title: 'Verification Rejected',
    message: `Your worker verification was rejected${reason ? `: ${reason}` : ''}.`,
    type: 'profile_rejected'
  });

  res.status(200).json({ success: true, message: 'Worker verification rejected', data: worker });
});

// @desc    Get regional performance metrics
// @route   GET /api/area-manager/performance
// @access  Private/Area Manager
exports.getPerformanceMetrics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

  // Calculate date range
  let startDate = new Date();
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  // Get jobs in region
  const allJobs = await Job.find({ region: req.user.region });
  const periodJobs = await Job.find({
    region: req.user.region,
    createdAt: { $gte: startDate }
  });

  const completedJobs = allJobs.filter(job => job.status === 'completed');
  const activeJobs = allJobs.filter(job => ['posted', 'assigned', 'in_progress'].includes(job.status));

  // Worker metrics
  const workers = await User.find({
    role: 'worker',
    region: req.user.region
  });

  // Revenue calculation
  const totalRevenue = completedJobs.reduce((sum, job) =>
    sum + (job.payment?.totalAmount || 0), 0
  );

  // Job completion rate
  const completionRate = allJobs.length > 0 ?
    (completedJobs.length / allJobs.length) * 100 : 0;

  // Average job value
  const avgJobValue = completedJobs.length > 0 ?
    totalRevenue / completedJobs.length : 0;

  const metrics = {
    overview: {
      totalJobs: allJobs.length,
      newJobs: periodJobs.length,
      completedJobs: completedJobs.length,
      activeJobs: activeJobs.length,
      totalWorkers: workers.length,
      verifiedWorkers: workers.filter(w => w.isVerified).length,
      totalRevenue,
      avgJobValue,
      completionRate: Math.round(completionRate * 100) / 100
    },
    trends: {
      period,
      jobsThisPeriod: periodJobs.length,
      completedThisPeriod: periodJobs.filter(job => job.status === 'completed').length
    },
    topPerformers: workers
      .filter(w => w.workerProfile?.completedJobs > 0)
      .sort((a, b) => (b.workerProfile.rating || 0) - (a.workerProfile.rating || 0))
      .slice(0, 5)
      .map(worker => ({
        _id: worker._id,
        name: worker.name,
        avatar: worker.profile?.avatar,
        rating: worker.workerProfile?.rating || 0,
        completedJobs: worker.workerProfile?.completedJobs || 0
      }))
  };

  res.status(200).json({
    success: true,
    data: metrics
  });
});

// @desc    Update regional settings
// @route   PUT /api/area-manager/region/settings
// @access  Private/Area Manager
exports.updateRegionalSettings = asyncHandler(async (req, res) => {
  const allowedSettings = [
    'workHourRules', 'payRates', 'settings'
  ];

  const updateData = {};
  Object.keys(req.body).forEach(key => {
    if (allowedSettings.includes(key)) {
      updateData[key] = req.body[key];
    }
  });

  const region = await Region.findByIdAndUpdate(
    req.user.region,
    updateData,
    { new: true, runValidators: true }
  );

  if (!region) {
    return res.status(404).json({
      success: false,
      message: 'Region not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Regional settings updated successfully',
    data: region
  });
});

// Legacy method for backward compatibility
exports.updateRegionSettings = exports.updateRegionalSettings;
