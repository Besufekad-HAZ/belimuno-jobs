const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Payment = require("../models/Payment");
const Region = require("../models/Region");
const Notification = require("../models/Notification");
const Report = require("../models/Report");
const Dispute = require("../models/Dispute");
const asyncHandler = require("../utils/asyncHandler");
const Review = require("../models/Review");
const NotificationService = require("../utils/notificationService");

// Lightweight in-memory cache for dashboard
const __dashboardCache = { data: null, ts: 0 };

// @desc    Get admin dashboard (optimized)
// @route   GET /api/admin/dashboard
// @access  Private/Super Admin
exports.getDashboard = asyncHandler(async (req, res) => {
  const now = Date.now();
  const cacheTTL = 15 * 1000; // 15 seconds
  if (__dashboardCache.data && now - __dashboardCache.ts < cacheTTL) {
    return res.status(200).json({ success: true, data: __dashboardCache.data });
  }

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const minimal = String(req.query.minimal || "false").toLowerCase() === "true";

  // Run independent computations in parallel
  const [
    usersCounts,
    jobsCounts,
    paymentsAgg,
    jobsByStatus,
    monthlyRevenue,
    recentUsers,
    recentJobs,
  ] = await Promise.all([
    // Users counters
    Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "worker" }),
      User.countDocuments({ role: "client" }),
      User.countDocuments({ role: "worker", isVerified: true }),
    ]),
    // Jobs counters
    Promise.all([
      Job.countDocuments(),
      Job.countDocuments({
        status: { $in: ["posted", "assigned", "in_progress"] },
      }),
      Job.countDocuments({ status: "completed" }),
    ]),
    // Revenue total
    Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    // Jobs by status
    Job.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    // Monthly revenue (last 12 months)
    minimal
      ? Promise.resolve([])
      : Payment.aggregate([
          {
            $match: {
              status: "completed",
              createdAt: { $gte: twelveMonthsAgo },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
              },
              revenue: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),
    // Only a few recent users, lean objects
    User.find()
      .select("name email role isVerified createdAt")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    // Only lightweight job fields for recent jobs, no heavy arrays; lean + minimal populate
    Job.find({}, "title status budget createdAt client worker")
      .populate({ path: "client", select: "name profile.avatar" })
      .populate({ path: "worker", select: "name profile.avatar" })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
  ]);

  const [totalUsers, totalWorkers, totalClients, verifiedWorkers] = usersCounts;
  const [totalJobs, activeJobs, completedJobs] = jobsCounts;
  const totalRevenue = paymentsAgg[0]?.total || 0;

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
      completedPayments: undefined, // not used on UI currently
      pendingVerifications: totalWorkers - verifiedWorkers,
    },
    charts: {
      jobsByStatus,
      monthlyRevenue,
    },
    recent: {
      jobs: recentJobs,
      users: recentUsers,
    },
  };

  __dashboardCache.data = dashboardData;
  __dashboardCache.ts = Date.now();

  res.status(200).json({ success: true, data: dashboardData });
});

// @desc    Get all users with filtering
// @route   GET /api/admin/users
// @access  Private/Super Admin
exports.getUsers = asyncHandler(async (req, res) => {
  const {
    role,
    isVerified,
    isActive,
    page = 1,
    limit = 20,
    search,
    select,
    sort,
  } = req.query;

  const query = {};
  if (role) query.role = role;
  if (isVerified !== undefined) query.isVerified = isVerified === "true";
  if (isActive !== undefined) query.isActive = isActive === "true";

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const projection = select ? String(select).split(",").join(" ") : "-password";
  const sortBy = sort ? String(sort).split(",").join(" ") : "-createdAt";
  const usersQuery = User.find(query)
    .select(projection)
    .sort(sortBy)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // populate region only when requested
  if (!select || String(select).includes("region")) {
    usersQuery.populate("region", "name");
  }

  const users = await usersQuery;

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    data: users,
  });
});

// @desc    Get single user details
// @route   GET /api/admin/users/:id
// @access  Private/Super Admin
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("region", "name");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Get user's jobs if they're a client or worker
  let jobs = [];
  if (user.role === "client") {
    jobs = await Job.find({ client: user._id })
      .populate("worker", "name profile.avatar")
      .sort({ createdAt: -1 });
  } else if (user.role === "worker") {
    jobs = await Job.find({ worker: user._id })
      .populate("client", "name profile.avatar")
      .sort({ createdAt: -1 });
  }

  // Get user's payments (as payer or recipient)
  const payments = await Payment.find({
    $or: [{ payer: user._id }, { recipient: user._id }],
  })
    .populate("job", "title")
    .populate("payer", "name role profile.avatar")
    .populate("recipient", "name role profile.avatar")
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      user,
      jobs,
      payments,
    },
  });
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Super Admin
exports.updateUser = asyncHandler(async (req, res) => {
  const allowedFields = [
    "name",
    "email",
    "role",
    "isVerified",
    "isActive",
    "region",
    "profile",
  ];

  const updateData = {};
  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updateData[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: user,
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
      message: "Worker not found",
    });
  }

  // Create notification for worker using NotificationService
  try {
    await NotificationService.notifyWorkerVerified(worker._id);
  } catch (error) {
    console.error("Failed to create worker verification notification:", error);
    // Don't fail the verification if notification fails
  }

  res.status(200).json({
    success: true,
    message: "Worker verified successfully",
    data: worker,
  });
});

// @desc    Get all jobs with filtering
// @route   GET /api/admin/jobs
// @access  Private/Super Admin
exports.getJobs = asyncHandler(async (req, res) => {
  const {
    status,
    category,
    region,
    page = 1,
    limit = 20,
    select,
    sort,
  } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (region) query.region = region;

  const projection = select ? String(select).split(",").join(" ") : undefined;
  const sortBy = sort ? String(sort).split(",").join(" ") : "-createdAt";
  const jobsQuery = Job.find(query, projection)
    .sort(sortBy)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // populate only if corresponding fields present
  const wantsClient = !projection || /\bclient\b/.test(projection);
  const wantsWorker = !projection || /\bworker\b/.test(projection);
  const wantsRegion = !projection || /\bregion\b/.test(projection);
  if (wantsClient)
    jobsQuery.populate({ path: "client", select: "name profile.avatar" });
  if (wantsWorker)
    jobsQuery.populate({ path: "worker", select: "name profile.avatar" });
  if (wantsRegion) jobsQuery.populate({ path: "region", select: "name" });

  const jobs = await jobsQuery;

  const total = await Job.countDocuments(query);

  res.status(200).json({
    success: true,
    count: jobs.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    data: jobs,
  });
});

// @desc    Get single job by ID
// @route   GET /api/admin/jobs/:id
// @access  Private/Super Admin
exports.getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate("client", "name email profile.avatar clientProfile")
    .populate("worker", "name email profile.avatar workerProfile")
    .populate("region", "name")
    .populate("messages.sender", "name role");

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  // Get applications for this job
  const applications = await Application.find({ job: job._id })
    .populate(
      "worker",
      "name email profile.avatar workerProfile.rating workerProfile.skills"
    )
    .sort({ appliedAt: -1 });

  // Transform applications into the expected format
  const transformedApplications = applications.map((app) => ({
    worker: app.worker,
    appliedAt: app.appliedAt,
    proposal: app.proposal,
    proposedBudget: app.proposedBudget,
    status: app.status,
  }));

  // Add applications to job data
  const jobData = job.toObject();
  jobData.applicants = transformedApplications;

  res.status(200).json({
    success: true,
    data: jobData,
  });
});

// @desc    Create a job (admin)
// @route   POST /api/admin/jobs
// @access  Private/Super Admin
exports.createJob = asyncHandler(async (req, res) => {
  const job = await Job.create({ ...req.body });
  res.status(201).json({ success: true, data: job });
});

// @desc    Update a job (admin)
// @route   PUT /api/admin/jobs/:id
// @access  Private/Super Admin
exports.updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!job)
    return res.status(404).json({ success: false, message: "Job not found" });
  res.status(200).json({ success: true, data: job });
});

// @desc    Delete a job (admin)
// @route   DELETE /api/admin/jobs/:id
// @access  Private/Super Admin
exports.deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndDelete(req.params.id);
  if (!job)
    return res.status(404).json({ success: false, message: "Job not found" });
  res.status(200).json({ success: true, message: "Job deleted" });
});

// @desc    Get performance metrics
// @route   GET /api/admin/performance
// @access  Private/Super Admin
exports.getPerformanceMetrics = asyncHandler(async (req, res) => {
  const { period = "30d" } = req.query;

  // Calculate date range
  let startDate = new Date();
  switch (period) {
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(startDate.getDate() - 90);
      break;
    case "1y":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  // User metrics
  const totalUsers = await User.countDocuments();
  const newUsers = await User.countDocuments({
    createdAt: { $gte: startDate },
  });
  const activeWorkers = await User.countDocuments({
    role: "worker",
    isActive: true,
    isVerified: true,
  });

  // Job metrics
  const totalJobs = await Job.countDocuments();
  const newJobs = await Job.countDocuments({ createdAt: { $gte: startDate } });
  const completedJobs = await Job.countDocuments({
    status: "completed",
    completionDate: { $gte: startDate },
  });

  // Financial metrics
  const revenueData = await Payment.aggregate([
    {
      $match: {
        status: "completed",
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
        totalTransactions: { $sum: 1 },
        avgTransactionValue: { $avg: "$amount" },
      },
    },
  ]);

  const revenue = revenueData[0] || {
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransactionValue: 0,
  };

  // Top performing workers
  const topWorkers = await User.aggregate([
    { $match: { role: "worker", isVerified: true } },
    {
      $lookup: {
        from: "jobs",
        localField: "_id",
        foreignField: "worker",
        as: "jobs",
      },
    },
    {
      $project: {
        name: 1,
        "profile.avatar": 1,
        "workerProfile.rating": 1,
        completedJobs: {
          $size: {
            $filter: {
              input: "$jobs",
              cond: { $eq: ["$$this.status", "completed"] },
            },
          },
        },
        totalEarnings: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: "$jobs",
                  cond: { $eq: ["$$this.status", "completed"] },
                },
              },
              as: "job",
              in: "$$job.payment.workerEarnings",
            },
          },
        },
      },
    },
    { $sort: { completedJobs: -1, totalEarnings: -1 } },
    { $limit: 10 },
  ]);

  // Regional performance
  const regionalStats = await Region.aggregate([
    {
      $lookup: {
        from: "jobs",
        localField: "_id",
        foreignField: "region",
        as: "jobs",
      },
    },
    {
      $project: {
        name: 1,
        totalJobs: { $size: "$jobs" },
        completedJobs: {
          $size: {
            $filter: {
              input: "$jobs",
              cond: { $eq: ["$$this.status", "completed"] },
            },
          },
        },
        revenue: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: "$jobs",
                  cond: { $eq: ["$$this.status", "completed"] },
                },
              },
              as: "job",
              in: "$$job.payment.totalAmount",
            },
          },
        },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  const metrics = {
    overview: {
      totalUsers,
      newUsers,
      activeWorkers,
      totalJobs,
      newJobs,
      completedJobs,
      ...revenue,
    },
    topWorkers,
    regionalStats,
    period,
  };

  res.status(200).json({
    success: true,
    data: metrics,
  });
});

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Private/Super Admin
exports.getPayments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, select, sort } = req.query;

  const query = {};
  if (status) query.status = status;

  const projection = select ? String(select).split(",").join(" ") : undefined;
  const sortBy = sort ? String(sort).split(",").join(" ") : "-createdAt";
  const paymentsQuery = Payment.find(query, projection)
    .sort(sortBy)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  if (!projection || /\bpayer\b/.test(projection)) {
    paymentsQuery.populate("payer", "name role profile.avatar");
  }
  if (!projection || /\brecipient\b/.test(projection)) {
    paymentsQuery.populate("recipient", "name role profile.avatar");
  }
  if (!projection || /\bjob\b/.test(projection)) {
    paymentsQuery.populate("job", "title");
  }

  const payments = await paymentsQuery;

  const total = await Payment.countDocuments(query);

  res.status(200).json({
    success: true,
    count: payments.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    data: payments,
  });
});

// @desc    Handle payment dispute
// @route   PUT /api/admin/payments/:id/dispute
// @access  Private/Super Admin
exports.handlePaymentDispute = asyncHandler(async (req, res) => {
  const { resolution, action } = req.body; // action: 'refund', 'release', 'partial'

  const payment = await Payment.findById(req.params.id)
    .populate("job")
    .populate("payer")
    .populate("recipient")
    .populate("dispute");

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment not found",
    });
  }

  // Find associated dispute if not already populated
  let dispute = payment.dispute;
  if (!dispute && payment.job) {
    dispute = await Dispute.findOne({
      job: payment.job._id,
      type: "payment",
      status: { $in: ["open", "investigating"] },
    });
    if (dispute) {
      payment.dispute = dispute._id;
    }
  }

  // Update payment based on admin decision
  switch (action) {
    case "refund":
      payment.status = "refunded";
      break;
    case "release":
      payment.status = "completed";
      break;
    case "partial":
      // Handle partial refund logic
      payment.status = "partially_refunded";
      break;
  }

  payment.adminResolution = {
    resolvedBy: req.user._id,
    resolution,
    action,
    resolvedAt: new Date(),
  };

  await payment.save();

  // Update dispute status
  if (dispute) {
    dispute.status = "resolved";
    dispute.resolvedBy = req.user._id;
    dispute.resolution = resolution;
    dispute.resolvedAt = new Date();
    await dispute.save();

    // Update job dispute status
    if (payment.job) {
      payment.job.status = action === "refund" ? "cancelled" : "completed";
      payment.job.dispute = {
        isDisputed: false,
        resolvedBy: req.user._id,
        resolution: resolution,
        resolvedAt: new Date(),
        status: "resolved",
      };
      await payment.job.save();
    }
  }

  // Create notifications
  await Notification.create({
    recipient: payment.payer._id,
    title: "Payment Dispute Resolved",
    message: `The dispute for your payment has been resolved: ${resolution}`,
    type: "dispute_resolved",
    relatedPayment: payment._id,
  });

  await Notification.create({
    recipient: payment.recipient._id,
    title: "Payment Dispute Resolved",
    message: `The dispute for your payment has been resolved: ${resolution}`,
    type: "dispute_resolved",
    relatedPayment: payment._id,
  });

  res.status(200).json({
    success: true,
    message: "Dispute resolved successfully",
    data: payment,
  });
});

// @desc    Mark a manual payment as paid and update job payment status
// @route   PUT /api/admin/payments/:id/mark-paid
// @access  Private/Super Admin
exports.markPaymentPaid = asyncHandler(async (req, res) => {
  // Load payment with relations
  const payment = await Payment.findById(req.params.id)
    .populate("job")
    .populate("recipient")
    .populate("payer");

  if (!payment) {
    return res
      .status(404)
      .json({ success: false, message: "Payment not found" });
  }

  // Idempotency: if already completed, still ensure job payment structure is updated and return success
  const now = new Date();
  const wasCompleted = payment.status === "completed";
  payment.status = "completed";
  payment.processedAt = payment.processedAt || now;
  payment.completedAt = payment.completedAt || now;
  await payment.save();

  // Safely update related job payment fields
  if (payment.job) {
    // Initialize job.payment object if missing
    if (!payment.job.payment) {
      payment.job.payment = {
        totalAmount: payment.amount,
        paidAmount: 0,
        escrowAmount: 0,
        platformFee: 0,
        workerEarnings: undefined,
        paymentStatus: "pending",
        paymentHistory: [],
      };
    }

    // Ensure history array exists
    payment.job.payment.paymentHistory =
      payment.job.payment.paymentHistory || [];

    // Update amounts and status
    const prevPaid = Number(payment.job.payment.paidAmount || 0);
    payment.job.payment.paidAmount = prevPaid + Number(payment.amount || 0);
    payment.job.payment.paymentStatus = "paid";

    // Append a history record if not already appended for this transactionId
    const alreadyLogged = payment.job.payment.paymentHistory.some(
      (h) => h && h.transactionId === payment.transactionId
    );
    if (!alreadyLogged) {
      payment.job.payment.paymentHistory.push({
        amount: payment.amount,
        type: payment.paymentMethod || "manual_check",
        transactionId: payment.transactionId,
        processedAt: now,
        status: "completed",
      });
    }

    await payment.job.save();
  }

  // Notify recipient (worker) if present
  if (payment.recipient) {
    await Notification.create({
      recipient: payment.recipient._id,
      title: "Payment Completed",
      message: `A manual check payment of ETB ${Number(
        payment.amount || 0
      ).toLocaleString()} has been approved.`,
      type: "payment",
      relatedPayment: payment._id,
      relatedJob: payment.job?._id,
    });
  }

  return res.status(200).json({
    success: true,
    message: wasCompleted
      ? "Payment already completed"
      : "Payment marked as completed",
    data: payment,
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
      deactivatedBy: req.user._id,
    },
    { new: true }
  ).select("-password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Create notification
  await Notification.create({
    recipient: user._id,
    title: "Account Deactivated",
    message: `Your account has been deactivated. Reason: ${reason}`,
    type: "system_announcement",
  });

  res.status(200).json({
    success: true,
    message: "User deactivated successfully",
    data: user,
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
      deactivatedBy: undefined,
    },
    { new: true }
  ).select("-password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Create notification
  await Notification.create({
    recipient: user._id,
    title: "Account Reactivated",
    message:
      "Your account has been reactivated. You can now access your account again.",
    type: "system_announcement",
  });

  res.status(200).json({
    success: true,
    message: "User activated successfully",
    data: user,
  });
});

// @desc    List reviews with filtering and moderation status
// @route   GET /api/admin/reviews
// @access  Private/Any Admin
exports.getReviews = asyncHandler(async (req, res) => {
  const {
    status,
    moderationStatus,
    reviewer,
    reviewee,
    page = 1,
    limit = 20,
  } = req.query;
  const query = {};
  if (status) query.status = status;
  if (moderationStatus) query.moderationStatus = moderationStatus;
  if (reviewer) query.reviewer = reviewer;
  if (reviewee) query.reviewee = reviewee;

  const reviews = await Review.find(query)
    .populate("job", "title")
    .populate("reviewer", "name role")
    .populate("reviewee", "name role")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Review.countDocuments(query);
  res.status(200).json({
    success: true,
    count: reviews.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    data: reviews,
  });
});

// @desc    Moderate a review (approve/reject/hide)
// @route   PUT /api/admin/reviews/:id
// @access  Private/Any Admin
exports.moderateReview = asyncHandler(async (req, res) => {
  const { moderationStatus, status, isPublic } = req.body;
  const allowedModeration = ["pending", "approved", "rejected"];
  const allowedStatus = ["draft", "published", "hidden"];

  const update = {};
  if (moderationStatus && allowedModeration.includes(moderationStatus))
    update.moderationStatus = moderationStatus;
  if (status && allowedStatus.includes(status)) update.status = status;
  if (typeof isPublic === "boolean") update.isPublic = isPublic;

  const review = await Review.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  })
    .populate("job", "title")
    .populate("reviewer", "name role")
    .populate("reviewee", "name role");

  if (!review)
    return res
      .status(404)
      .json({ success: false, message: "Review not found" });

  res.status(200).json({ success: true, data: review });
});

// @desc    Get all disputes with filtering
// @route   GET /api/admin/disputes
// @access  Private/Any Admin
exports.getDisputes = asyncHandler(async (req, res) => {
  const { status, priority, type, page = 1, limit = 20, search } = req.query;

  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (type) query.type = type;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const disputes = await Dispute.find(query)
    .populate("worker", "name email phone workerProfile")
    .populate("client", "name email phone clientProfile")
    .populate("job", "title budget status")
    .populate("resolvedBy", "name")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Dispute.countDocuments(query);

  res.status(200).json({
    success: true,
    count: disputes.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    data: disputes,
  });
});

// @desc    Get single dispute details
// @route   GET /api/admin/disputes/:id
// @access  Private/Any Admin
exports.getDispute = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id)
    .populate("worker", "name email phone workerProfile")
    .populate("client", "name email phone clientProfile")
    .populate("job", "title budget status")
    .populate("resolvedBy", "name");

  if (!dispute) {
    return res.status(404).json({
      success: false,
      message: "Dispute not found",
    });
  }

  res.status(200).json({
    success: true,
    data: dispute,
  });
});

// @desc    Create a new dispute
// @route   POST /api/admin/disputes
// @access  Private/Any Admin
exports.createDispute = asyncHandler(async (req, res) => {
  const dispute = await Dispute.create(req.body);

  // Notify involved parties
  await Notification.create({
    recipient: dispute.worker,
    title: "New Dispute Created",
    message: `A dispute has been created regarding: ${dispute.title}`,
    type: "dispute",
    priority: "high",
  });

  await Notification.create({
    recipient: dispute.client,
    title: "New Dispute Created",
    message: `A dispute has been created regarding: ${dispute.title}`,
    type: "dispute",
    priority: "high",
  });

  res.status(201).json({
    success: true,
    data: dispute,
  });
});

// @desc    Update dispute status and resolution
// @route   PUT /api/admin/disputes/:id
// @access  Private/Any Admin
exports.updateDispute = asyncHandler(async (req, res) => {
  const { status, resolution, hrNotes } = req.body;
  const updateData = {};

  if (status) updateData.status = status;
  if (resolution) {
    updateData.resolution = resolution;
    updateData.resolvedAt = Date.now();
    updateData.resolvedBy = req.user._id;
  }
  if (hrNotes) updateData.hrNotes = hrNotes;

  const dispute = await Dispute.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("worker", "name email phone workerProfile")
    .populate("client", "name email phone clientProfile")
    .populate("job", "title budget status")
    .populate("resolvedBy", "name");

  if (!dispute) {
    return res.status(404).json({
      success: false,
      message: "Dispute not found",
    });
  }

  // If status changed to resolved, notify both parties
  if (status === "resolved") {
    await Notification.create({
      recipient: dispute.worker,
      title: "Dispute Resolution Update",
      message: `The dispute "${dispute.title}" has been resolved: ${resolution}`,
      type: "dispute_resolved",
      priority: "high",
    });

    await Notification.create({
      recipient: dispute.client,
      title: "Dispute Resolution Update",
      message: `The dispute "${dispute.title}" has been resolved: ${resolution}`,
      type: "dispute_resolved",
      priority: "high",
    });
  }

  res.status(200).json({
    success: true,
    data: dispute,
  });
});
