const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Payment = require('../models/Payment');
const Region = require('../models/Region');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get admin dashboard
// @route   GET /api/admin/dashboard
// @access  Private/Super Admin
exports.getDashboard = asyncHandler(async (req, res) => {
  // Get overall statistics
  const totalUsers = await User.countDocuments();
  const totalWorkers = await User.countDocuments({ role: 'worker' });
  const totalClients = await User.countDocuments({ role: 'client' });
  const verifiedWorkers = await User.countDocuments({ role: 'worker', isVerified: true });

  const totalJobs = await Job.countDocuments();
  const activeJobs = await Job.countDocuments({ status: { $in: ['posted', 'assigned', 'in_progress'] } });
  const completedJobs = await Job.countDocuments({ status: 'completed' });

  const totalPayments = await Payment.countDocuments();
  const completedPayments = await Payment.countDocuments({ status: 'completed' });

  // Calculate revenue
  const revenueData = await Payment.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const totalRevenue = revenueData[0]?.total || 0;

  // Get recent activities
  const recentJobs = await Job.find()
    .populate('client', 'name profile.avatar')
    .populate('worker', 'name profile.avatar')
    .sort({ createdAt: -1 })
    .limit(10);

  const recentUsers = await User.find()
    .select('name email role isVerified createdAt')
    .sort({ createdAt: -1 })
    .limit(10);

  // Jobs by status
  const jobsByStatus = await Job.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Revenue by month (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyRevenue = await Payment.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: twelveMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const dashboardData = {
    overview: {
      totalUsers,
      totalWorkers,
      totalClients,
      verifiedWorkers,
      totalJobs,
      activeJobs,
      completedJobs,
      totalRevenue,
      completedPayments,
      pendingVerifications: totalWorkers - verifiedWorkers
    },
    charts: {
      jobsByStatus,
      monthlyRevenue
    },
    recent: {
      jobs: recentJobs,
      users: recentUsers
    }
  };

  res.status(200).json({
    success: true,
    data: dashboardData
  });
});

// @desc    Get all users with filtering
// @route   GET /api/admin/users
// @access  Private/Super Admin
exports.getUsers = asyncHandler(async (req, res) => {
  const { role, isVerified, isActive, page = 1, limit = 20, search } = req.query;

  const query = {};
  if (role) query.role = role;
  if (isVerified !== undefined) query.isVerified = isVerified === 'true';
  if (isActive !== undefined) query.isActive = isActive === 'true';

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .populate('region', 'name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: users
  });
});

// @desc    Get single user details
// @route   GET /api/admin/users/:id
// @access  Private/Super Admin
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('region', 'name');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get user's jobs if they're a client or worker
  let jobs = [];
  if (user.role === 'client') {
    jobs = await Job.find({ client: user._id })
      .populate('worker', 'name profile.avatar')
      .sort({ createdAt: -1 });
  } else if (user.role === 'worker') {
    jobs = await Job.find({ worker: user._id })
      .populate('client', 'name profile.avatar')
      .sort({ createdAt: -1 });
  }

  // Get user's payments
  const payments = await Payment.find({
    $or: [
      { client: user._id },
      { worker: user._id }
    ]
  })
    .populate('job', 'title')
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      user,
      jobs,
      payments
    }
  });
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Super Admin
exports.updateUser = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name', 'email', 'role', 'isVerified', 'isActive', 'region', 'profile'
  ];

  const updateData = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updateData[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

// @desc    Verify worker profile
// @route   PUT /api/admin/verify-worker/:id
// @access  Private/Super Admin
exports.verifyWorker = asyncHandler(async (req, res) => {
  const worker = await User.findByIdAndUpdate(
    req.params.id,
    { isVerified: true },
    { new: true, runValidators: true }
  );

  if (!worker) {
    return res.status(404).json({
      success: false,
      message: 'Worker not found'
    });
  }

  // Create notification for worker
  await Notification.create({
    recipient: worker._id,
    title: 'Profile Verified',
    message: 'Congratulations! Your worker profile has been verified. You can now apply for jobs.',
    type: 'profile_verified'
  });

  res.status(200).json({
    success: true,
    message: 'Worker verified successfully',
    data: worker
  });
});

// @desc    Get all jobs with filtering
// @route   GET /api/admin/jobs
// @access  Private/Super Admin
exports.getJobs = asyncHandler(async (req, res) => {
  const { status, category, region, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (region) query.region = region;

  const jobs = await Job.find(query)
    .populate('client', 'name profile.avatar')
    .populate('worker', 'name profile.avatar')
    .populate('region', 'name')
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

// @desc    Get performance metrics
// @route   GET /api/admin/performance
// @access  Private/Super Admin
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
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  // User metrics
  const totalUsers = await User.countDocuments();
  const newUsers = await User.countDocuments({ createdAt: { $gte: startDate } });
  const activeWorkers = await User.countDocuments({
    role: 'worker',
    isActive: true,
    isVerified: true
  });

  // Job metrics
  const totalJobs = await Job.countDocuments();
  const newJobs = await Job.countDocuments({ createdAt: { $gte: startDate } });
  const completedJobs = await Job.countDocuments({
    status: 'completed',
    completionDate: { $gte: startDate }
  });

  // Financial metrics
  const revenueData = await Payment.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        avgTransactionValue: { $avg: '$amount' }
      }
    }
  ]);

  const revenue = revenueData[0] || {
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransactionValue: 0
  };

  // Top performing workers
  const topWorkers = await User.aggregate([
    { $match: { role: 'worker', isVerified: true } },
    {
      $lookup: {
        from: 'jobs',
        localField: '_id',
        foreignField: 'worker',
        as: 'jobs'
      }
    },
    {
      $project: {
        name: 1,
        'profile.avatar': 1,
        'workerProfile.rating': 1,
        completedJobs: {
          $size: {
            $filter: {
              input: '$jobs',
              cond: { $eq: ['$$this.status', 'completed'] }
            }
          }
        },
        totalEarnings: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$jobs',
                  cond: { $eq: ['$$this.status', 'completed'] }
                }
              },
              as: 'job',
              in: '$$job.payment.workerEarnings'
            }
          }
        }
      }
    },
    { $sort: { completedJobs: -1, totalEarnings: -1 } },
    { $limit: 10 }
  ]);

  // Regional performance
  const regionalStats = await Region.aggregate([
    {
      $lookup: {
        from: 'jobs',
        localField: '_id',
        foreignField: 'region',
        as: 'jobs'
      }
    },
    {
      $project: {
        name: 1,
        totalJobs: { $size: '$jobs' },
        completedJobs: {
          $size: {
            $filter: {
              input: '$jobs',
              cond: { $eq: ['$$this.status', 'completed'] }
            }
          }
        },
        revenue: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$jobs',
                  cond: { $eq: ['$$this.status', 'completed'] }
                }
              },
              as: 'job',
              in: '$$job.payment.totalAmount'
            }
          }
        }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  const metrics = {
    overview: {
      totalUsers,
      newUsers,
      activeWorkers,
      totalJobs,
      newJobs,
      completedJobs,
      ...revenue
    },
    topWorkers,
    regionalStats,
    period
  };

  res.status(200).json({
    success: true,
    data: metrics
  });
});

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Private/Super Admin
exports.getPayments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;

  const payments = await Payment.find(query)
    .populate('client', 'name profile.avatar')
    .populate('worker', 'name profile.avatar')
    .populate('job', 'title')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Payment.countDocuments(query);

  res.status(200).json({
    success: true,
    count: payments.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: payments
  });
});

// @desc    Handle payment dispute
// @route   PUT /api/admin/payments/:id/dispute
// @access  Private/Super Admin
exports.handlePaymentDispute = asyncHandler(async (req, res) => {
  const { resolution, action } = req.body; // action: 'refund', 'release', 'partial'

  const payment = await Payment.findById(req.params.id)
    .populate('job')
    .populate('client')
    .populate('worker');

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  // Update payment based on admin decision
  switch (action) {
    case 'refund':
      payment.status = 'refunded';
      break;
    case 'release':
      payment.status = 'completed';
      break;
    case 'partial':
      // Handle partial refund logic
      payment.status = 'partially_refunded';
      break;
  }

  payment.adminResolution = {
    resolvedBy: req.user._id,
    resolution,
    action,
    resolvedAt: new Date()
  };

  await payment.save();

  // Update job dispute status
  if (payment.job && payment.job.dispute.isDisputed) {
    payment.job.dispute.status = 'resolved';
    payment.job.dispute.resolvedBy = req.user._id;
    payment.job.dispute.resolution = resolution;
    payment.job.dispute.resolvedAt = new Date();
    await payment.job.save();
  }

  // Create notifications
  await Notification.create({
    recipient: payment.client._id,
    title: 'Payment Dispute Resolved',
    message: `The dispute for your payment has been resolved: ${resolution}`,
    type: 'dispute_resolved',
    relatedPayment: payment._id
  });

  await Notification.create({
    recipient: payment.worker._id,
    title: 'Payment Dispute Resolved',
    message: `The dispute for your payment has been resolved: ${resolution}`,
    type: 'dispute_resolved',
    relatedPayment: payment._id
  });

  res.status(200).json({
    success: true,
    message: 'Dispute resolved successfully',
    data: payment
  });
});

// @desc    Deactivate user
// @route   PUT /api/admin/users/:id/deactivate
// @access  Private/Super Admin
exports.deactivateUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      isActive: false,
      deactivationReason: reason,
      deactivatedAt: new Date(),
      deactivatedBy: req.user._id
    },
    { new: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Create notification
  await Notification.create({
    recipient: user._id,
    title: 'Account Deactivated',
    message: `Your account has been deactivated. Reason: ${reason}`,
    type: 'system_announcement'
  });

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully',
    data: user
  });
});

// @desc    Activate (reactivate) user
// @route   PUT /api/admin/users/:id/activate
// @access  Private/Super Admin
exports.activateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      isActive: true,
      deactivationReason: undefined,
      deactivatedAt: undefined,
      deactivatedBy: undefined
    },
    { new: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Create notification
  await Notification.create({
    recipient: user._id,
    title: 'Account Reactivated',
    message: 'Your account has been reactivated. You can now access your account again.',
    type: 'system_announcement'
  });

  res.status(200).json({
    success: true,
    message: 'User activated successfully',
    data: user
  });
});
