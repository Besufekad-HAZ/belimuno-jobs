const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Payment = require("../models/Payment");
const Region = require("../models/Region");
const Notification = require("../models/Notification");
const Report = require("../models/Report");
const Dispute = require("../models/Dispute");
const TeamMember = require("../models/TeamMember");
const DEFAULT_TEAM_MEMBERS = require("../data/defaultTeamMembers");
const News = require("../models/News");
const Client = require("../models/Client");
const asyncHandler = require("../utils/asyncHandler");
const Review = require("../models/Review");
const NotificationService = require("../utils/notificationService");
const path = require("path");
const multer = require("multer");
const crypto = require("crypto");
const {
  handlePhotoUpload,
  deletePhoto,
  normalizePhotoKey,
  inferManagedPhotoKey,
} = require("../utils/photoUpload");
const {
  deleteObject,
  buildPublicUrl,
  resolveKeyFromUrl,
} = require("../utils/s3Storage");

// Lightweight in-memory cache for dashboard
const __dashboardCache = { data: null, ts: 0 };
const TEAM_UPLOAD_PREFIX = (process.env.AWS_S3_TEAM_PREFIX || "public/team")
  .replace(/^\/+/, "")
  .replace(/\/+$/, "");

const ensureTeamKeyPrefix = (filename) =>
  TEAM_UPLOAD_PREFIX ? `${TEAM_UPLOAD_PREFIX}/${filename}` : filename;

const sanitizeFilename = (rawName) => {
  const fallbackBase = "team-member";
  if (!rawName) {
    return `${fallbackBase}.jpg`;
  }

  const withoutQuery = rawName.split("?")[0]?.split("#")[0] || rawName;
  const ext = path.extname(withoutQuery);
  const baseName = path.basename(withoutQuery, ext);

  const sanitizedBase = baseName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const sanitizedExt = ext && /\.[a-zA-Z0-9]+$/.test(ext) ? ext : ".jpg";

  const finalBase = sanitizedBase || fallbackBase;
  return `${finalBase}${sanitizedExt}`;
};

const stripKnownTeamPrefixes = (value) => {
  if (!value) {
    return value;
  }

  const normalized = value.replace(/^\/+/, "");
  const prefixes = ["uploads/team/", "public/team/"];

  if (TEAM_UPLOAD_PREFIX && !prefixes.includes(`${TEAM_UPLOAD_PREFIX}/`)) {
    prefixes.push(`${TEAM_UPLOAD_PREFIX}/`);
  }

  for (const prefix of prefixes) {
    if (normalized.toLowerCase().startsWith(prefix.toLowerCase())) {
      return normalized.slice(prefix.length);
    }
  }

  return normalized;
};

const extractFilenamePart = (value) => {
  if (!value) {
    return undefined;
  }

  let candidate = String(value).trim();
  if (!candidate) {
    return undefined;
  }

  if (/^https?:\/\//i.test(candidate)) {
    try {
      const url = new URL(candidate);
      candidate = url.pathname || "";
    } catch (_error) {
      // leave candidate as-is if URL parsing fails
    }
  }

  candidate = candidate.replace(/\\/g, "/");
  candidate = candidate.split("?")[0]?.split("#")[0] || candidate;
  candidate = candidate.replace(/^\/+/, "");
  const stripped = stripKnownTeamPrefixes(candidate);

  const parts = stripped.split("/");
  const filename = parts.pop();
  if (!filename) {
    return undefined;
  }
  return filename;
};

const normalizeTeamPhotoKey = (rawKey) => {
  const filename = extractFilenamePart(rawKey);
  if (!filename) {
    return undefined;
  }

  const sanitized = sanitizeFilename(filename);
  return ensureTeamKeyPrefix(sanitized);
};

const inferManagedTeamPhotoKey = (url) => {
  if (!url || typeof url !== "string") {
    return undefined;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return undefined;
  }

  const lower = trimmed.toLowerCase();
  const patterns = ["/uploads/team/", "/public/team/"];
  if (TEAM_UPLOAD_PREFIX) {
    patterns.push(`/${TEAM_UPLOAD_PREFIX.toLowerCase()}/`);
  }

  const matchesManagedPattern = patterns.some((pattern) =>
    lower.includes(pattern)
  );

  if (!matchesManagedPattern) {
    const resolvedKey = resolveKeyFromUrl(trimmed);
    if (!resolvedKey) {
      return undefined;
    }
    const normalizedKey = resolvedKey.replace(/^\/+/, "");
    if (
      TEAM_UPLOAD_PREFIX &&
      !normalizedKey
        .toLowerCase()
        .startsWith(`${TEAM_UPLOAD_PREFIX.toLowerCase()}/`)
    ) {
      return undefined;
    }
    return normalizeTeamPhotoKey(normalizedKey);
  }

  return normalizeTeamPhotoKey(trimmed);
};

const resolveTeamObjectKey = (rawKey) => normalizeTeamPhotoKey(rawKey);

const deleteTeamPhoto = async (photoKey) => {
  const managedKey =
    resolveTeamObjectKey(photoKey) || inferManagedTeamPhotoKey(photoKey);

  if (!managedKey) {
    return;
  }

  try {
    await deleteObject(managedKey);
  } catch (error) {
    console.warn("Failed to delete team member photo", managedKey, error);
  }
};

const teamPhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed."));
      return;
    }
    cb(null, true);
  },
});

const generateTeamObjectKey = (originalName) => {
  const sanitizedName = sanitizeFilename(originalName);
  const ext = path.extname(sanitizedName) || ".jpg";
  const base = path.basename(sanitizedName, ext);
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const combined = `${uniqueSuffix}-${base}`
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  const finalBase = combined || `${uniqueSuffix}-team-member`;
  const normalizedExt = ext || ".jpg";
  return ensureTeamKeyPrefix(`${finalBase}${normalizedExt}`);
};

const buildTeamPhotoUrl = (key) => buildPublicUrl(key);
// @desc    Seed default team members if collection is empty
// @route   POST /api/admin/team/seed-defaults
// @access  Private/Admin HR
exports.seedDefaultTeamMembers = asyncHandler(async (req, res) => {
  const existingCount = await TeamMember.countDocuments();
  if (existingCount > 0) {
    return res.status(200).json({
      success: true,
      message: "Team collection already initialized",
      data: { seeded: false, count: existingCount },
    });
  }

  try {
    const docs = (DEFAULT_TEAM_MEMBERS || []).map((m) => ({
      name: m.name,
      role: m.role,
      department: m.department,
      photoUrl: m.image || undefined,
      status: "active",
      order:
        typeof m.order === "number" && Number.isFinite(m.order)
          ? m.order
          : undefined,
    }));
    if (docs.length > 0) {
      await TeamMember.insertMany(docs, { ordered: false });
    }
    const count = await TeamMember.countDocuments();
    return res.status(201).json({
      success: true,
      message: "Default team members seeded",
      data: { seeded: true, count },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to seed default team members",
      error: error?.message || String(error),
    });
  }
});

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
// @access  Private/Admins
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

  // For each job, fetch its applications and attach as applicants[]
  const jobIds = jobs.map((job) => job._id);
  // Get all applications for these jobs in one query
  const applications = await Application.find({ job: { $in: jobIds } })
    .populate(
      "worker",
      "name email profile.avatar workerProfile.rating workerProfile.skills"
    )
    .sort({ appliedAt: -1 })
    .lean();

  // Group applications by job id
  const appsByJob = {};
  for (const app of applications) {
    const jobId = String(app.job);
    if (!appsByJob[jobId]) appsByJob[jobId] = [];
    appsByJob[jobId].push({
      worker: app.worker,
      appliedAt: app.appliedAt,
      proposal: app.proposal,
      proposedBudget: app.proposedBudget,
      status: app.status,
    });
  }

  // Attach applicants to each job
  const jobsWithApplicants = jobs.map((job) => ({
    ...job,
    applicants: appsByJob[String(job._id)] || [],
  }));

  const total = await Job.countDocuments(query);

  res.status(200).json({
    success: true,
    count: jobsWithApplicants.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    data: jobsWithApplicants,
  });
});

// @desc    Get single job by ID
// @route   GET /api/admin/jobs/:id
// @access  Private/Admins
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
// @route   POST /api/admin/jobs/create
// @access  Private/Admins
exports.createJob = asyncHandler(async (req, res) => {
  const jobData = {
    ...req.body,
    admin: req.user._id,
  };

  // Validate required fields
  const requiredFields = [
    "title",
    "description",
    "category",
    "budget",
    "deadline",
    "company",
    "industry",
  ];
  for (const field of requiredFields) {
    if (!jobData[field]) {
      return res.status(400).json({
        success: false,
        message: `${field} is required`,
      });
    }
  }

  const job = await Job.create(jobData);

  // Find all verified workers to notify them about the new job
  const verifiedWorkers = await User.find({
    role: "worker",
    isVerified: true,
    isActive: true,
  }).select("_id");

  // Notify all verified workers about the new job
  if (verifiedWorkers.length > 0) {
    try {
      await NotificationService.notifyJobPosted(
        job._id,
        req.user._id,
        verifiedWorkers.map((w) => w._id)
      );
      console.log(
        `Notified ${verifiedWorkers.length} verified workers about new job`
      );
    } catch (error) {
      console.error("Failed to send job notifications:", error);
      // Don't fail the job creation if notifications fail
    }
  } else {
    console.log("No verified workers found for job notification");
  }

  // Create notification for admin outsource
  const adminOutsource = await User.findOne({ role: "admin_outsource" });
  if (adminOutsource) {
    await Notification.create({
      recipient: adminOutsource._id,
      sender: req.user._id,
      title: "New Job Posted",
      message: `A new job "${job.title}" has been posted`,
      type: "job_posted",
      relatedJob: job._id,
      actionButton: {
        text: "View Job",
        action: "view_job",
      },
    });
  }

  res.status(201).json({
    success: true,
    data: job,
  });
});

// @desc    Update a job (admin)
// @route   PUT /api/admin/jobs/update/:id
// @access  Private/Admins
exports.updateJob = asyncHandler(async (req, res) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  // Prevent updating certain fields if job is already assigned
  if (job.status === "assigned" || job.status === "in_progress") {
    const restrictedFields = ["budget", "requiredSkills"];
    const hasRestrictedUpdates = restrictedFields.some((field) => {
      if (field === "budget") {
        return req.body.budget !== undefined && req.body.budget !== job.budget;
      } else if (field === "requiredSkills") {
        const currentSkills = job.requiredSkills || [];
        const newSkills = req.body.requiredSkills || [];
        return JSON.stringify(currentSkills) !== JSON.stringify(newSkills);
      }
      return false;
    });

    if (hasRestrictedUpdates) {
      return res.status(400).json({
        success: false,
        message: "Cannot update budget or required skills for assigned jobs",
      });
    }
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("region", "name");

  res.status(200).json({
    success: true,
    data: job,
  });
});

// @desc    Delete a job (admin)
// @route   DELETE /api/admin/jobs/delete/:id
// @access  Private/Admins
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
// @desc    Shortlist an application
// @route   PUT /api/admin/applications/:id/shortlist
// @access  Private/Super Admin
exports.shortlistApplication = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const application = await Application.findById(req.params.id)
    .populate("job")
    .populate("worker");

  if (!application) {
    return res.status(404).json({
      success: false,
      message: "Application not found",
    });
  }

  // Update application status
  application.status = "shortlisted";
  application.shortlistedAt = new Date();
  application.shortlistedBy = req.user._id;
  if (notes) application.shortlistNotes = notes;

  await application.save();

  // Notify the client about the shortlisted candidate
  await Notification.create({
    recipient: application.job.client,
    title: "New Shortlisted Candidate",
    message: `A new candidate has been shortlisted for your job: ${application.job.title}`,
    type: "application_shortlisted",
    relatedJob: application.job._id,
    relatedUser: application.worker._id,
    priority: "high",
  });

  res.status(200).json({
    success: true,
    message: "Application shortlisted successfully",
    data: application,
  });
});

// @desc    Remove application from shortlist
// @route   PUT /api/admin/applications/:id/unshortlist
// @access  Private/Super Admin
exports.unshortlistApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return res.status(404).json({
      success: false,
      message: "Application not found",
    });
  }

  // Reset shortlist status
  application.status = "reviewed";
  application.shortlistedAt = undefined;
  application.shortlistedBy = undefined;
  application.shortlistNotes = undefined;

  await application.save();

  res.status(200).json({
    success: true,
    message: "Application removed from shortlist",
    data: application,
  });
});

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

// @desc    Get all team members
// @route   GET /api/admin/team
// @access  Private/Admin HR or Super Admin
exports.getTeamMembers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sort = "order", status } = req.query;

  const query = {};
  if (status && ["active", "archived"].includes(String(status))) {
    query.status = status;
  }

  const sortTokens = String(sort)
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  const sortCriteria = sortTokens.length
    ? Object.fromEntries(
        sortTokens.map((token) => {
          const direction = token.startsWith("-") ? -1 : 1;
          const key = token.replace(/^[-+]/, "");
          return [key || "order", direction];
        })
      )
    : { order: 1, createdAt: -1 };

  const numericLimit = Math.min(
    Math.max(parseInt(String(limit), 10) || 20, 1),
    100
  );
  const numericPage = Math.max(parseInt(String(page), 10) || 1, 1);

  const [rawMembers, rawTotal] = await Promise.all([
    TeamMember.find(query)
      .sort(sortCriteria)
      .limit(numericLimit)
      .skip((numericPage - 1) * numericLimit)
      .lean(),
    TeamMember.countDocuments(query),
  ]);

  // Deduplicate by normalized name + role to avoid showing duplicates
  const normalizeKey = (m) => {
    const name = (m.name || "").toString().trim().toLowerCase();
    const role = (m.role || "").toString().trim().toLowerCase();
    return `${name}::${role}`;
  };

  const dedupeMap = new Map();
  for (const m of rawMembers) {
    const key = normalizeKey(m);
    if (!dedupeMap.has(key)) {
      dedupeMap.set(key, m);
      continue;
    }

    // prefer the member with the lower display order, then earlier createdAt
    const existing = dedupeMap.get(key);
    const existingOrder =
      typeof existing.order === "number"
        ? existing.order
        : Number.POSITIVE_INFINITY;
    const incomingOrder =
      typeof m.order === "number" ? m.order : Number.POSITIVE_INFINITY;

    if (incomingOrder < existingOrder) {
      dedupeMap.set(key, m);
    } else if (incomingOrder === existingOrder) {
      const existingCreated = existing.createdAt
        ? new Date(existing.createdAt)
        : new Date(0);
      const incomingCreated = m.createdAt ? new Date(m.createdAt) : new Date(0);
      if (incomingCreated < existingCreated) {
        dedupeMap.set(key, m);
      }
    }
  }

  const members = Array.from(dedupeMap.values());

  // Recompute pagination based on deduped total when returning full pages
  const dedupedTotal = members.length;

  res.status(200).json({
    success: true,
    count: members.length,
    total: dedupedTotal,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      pages: Math.ceil(dedupedTotal / numericLimit) || 1,
    },
    data: members,
  });
});

// @desc    Upload a team member profile photo
// @route   POST /api/admin/team/upload-photo
// @access  Private/Admin HR or Super Admin
exports.uploadTeamMemberPhoto = asyncHandler(async (req, res) => {
  try {
    const result = await handlePhotoUpload(req, res, "team", "team-member");

    return res.status(201).json({
      success: true,
      message: "Profile photo uploaded successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to upload photo",
    });
  }
});

// @desc    Create a new team member
// @route   POST /api/admin/team
// @access  Private/Admin HR or Super Admin
exports.createTeamMember = asyncHandler(async (req, res) => {
  const { name, role, department, photoUrl, photoKey, email, phone, bio } =
    req.body;
  let { order } = req.body;

  if (!name || !role || !department) {
    return res.status(400).json({
      success: false,
      message: "Name, role, and department are required",
    });
  }

  const trimmedName = name.trim();
  const trimmedRole = role.trim();
  const trimmedDepartment = department.trim();

  const existingMember = await TeamMember.findOne({
    name: trimmedName,
    role: trimmedRole,
  });

  if (existingMember) {
    return res.status(409).json({
      success: false,
      message: "A team member with this name and role already exists.",
      data: existingMember,
    });
  }

  let resolvedOrder;
  if (order !== undefined && order !== null && order !== "") {
    const parsedOrder = Number(order);
    if (Number.isNaN(parsedOrder) || parsedOrder < 0) {
      return res.status(400).json({
        success: false,
        message: "Display order must be a positive number",
      });
    }
    resolvedOrder = parsedOrder;
  } else {
    const highest = await TeamMember.findOne({}, "order")
      .sort({ order: -1 })
      .lean();
    resolvedOrder =
      highest && typeof highest.order === "number" ? highest.order + 1 : 1;
  }

  const sanitizedPhotoUrl = photoUrl?.trim() || undefined;

  const member = await TeamMember.create({
    name: trimmedName,
    role: trimmedRole,
    department: trimmedDepartment,
    photoUrl: sanitizedPhotoUrl,
    email: email?.trim() || undefined,
    phone: phone?.trim() || undefined,
    bio: bio?.trim() || undefined,
    order: resolvedOrder,
    createdBy: req.user?._id,
    updatedBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Team member created successfully",
    data: member,
  });
});

// @desc    Update a team member
// @route   PUT /api/admin/team/:id
// @access  Private/Admin HR or Super Admin
exports.updateTeamMember = asyncHandler(async (req, res) => {
  const member = await TeamMember.findById(req.params.id);

  if (!member) {
    return res.status(404).json({
      success: false,
      message: "Team member not found",
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
    const trimmedName = String(req.body.name || "").trim();
    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }
    member.name = trimmedName;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "role")) {
    const trimmedRole = String(req.body.role || "").trim();
    if (!trimmedRole) {
      return res.status(400).json({
        success: false,
        message: "Role cannot be empty",
      });
    }
    member.role = trimmedRole;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "department")) {
    const trimmedDepartment = String(req.body.department || "").trim();
    if (!trimmedDepartment) {
      return res.status(400).json({
        success: false,
        message: "Department cannot be empty",
      });
    }
    member.department = trimmedDepartment;
  }

  const previousPhotoKey = member.photoKey;

  let photoUrlProvided = false;
  let photoKeyProvided = false;

  if (Object.prototype.hasOwnProperty.call(req.body, "photoUrl")) {
    const trimmedUrl = String(req.body.photoUrl || "").trim();
    member.photoUrl = trimmedUrl || undefined;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "email")) {
    const trimmedEmail = String(req.body.email || "").trim();
    member.email = trimmedEmail || undefined;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "phone")) {
    const trimmedPhone = String(req.body.phone || "").trim();
    member.phone = trimmedPhone || undefined;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "bio")) {
    const trimmedBio = String(req.body.bio || "").trim();
    member.bio = trimmedBio || undefined;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "order")) {
    const incoming = req.body.order;
    if (incoming === null || incoming === undefined || incoming === "") {
      member.order = undefined;
    } else {
      const parsedOrder = Number(incoming);
      if (Number.isNaN(parsedOrder) || parsedOrder < 0) {
        return res.status(400).json({
          success: false,
          message: "Display order must be a positive number",
        });
      }
      member.order = parsedOrder;
    }
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "status")) {
    const normalizedStatus = String(req.body.status || "").trim();
    if (
      normalizedStatus &&
      !["active", "archived"].includes(normalizedStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Status must be either active or archived",
      });
    }
    if (normalizedStatus) {
      member.status = normalizedStatus;
    }
  }

  member.updatedBy = req.user?._id;

  await member.save();

  if (previousPhotoKey && previousPhotoKey !== member.photoKey) {
    await deletePhoto(previousPhotoKey, "team");
  }

  res.status(200).json({
    success: true,
    message: "Team member updated successfully",
    data: member,
  });
});

// @desc    Delete a team member
// @route   DELETE /api/admin/team/:id
// @access  Private/Admin HR or Super Admin
exports.deleteTeamMember = asyncHandler(async (req, res) => {
  const member = await TeamMember.findByIdAndDelete(req.params.id);

  if (!member) {
    return res.status(404).json({
      success: false,
      message: "Team member not found",
    });
  }

  const managedPhotoKey =
    member.photoKey || inferManagedTeamPhotoKey(member.photoUrl);
  if (managedPhotoKey) {
    await deletePhoto(managedPhotoKey, "team");
  }

  res.status(200).json({
    success: true,
    message: "Team member removed successfully",
  });
});

// @desc    Get all news articles with filtering
// @route   GET /api/admin/news
// @access  Private/Any Admin
exports.getNews = asyncHandler(async (req, res) => {
  const {
    status,
    category,
    page = 1,
    limit = 20,
    search,
    sort = "-date",
  } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { excerpt: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
      { author: { $regex: search, $options: "i" } },
    ];
  }

  const sortBy = sort ? String(sort).split(",").join(" ") : "-date";
  const newsQuery = News.find(query)
    .sort(sortBy)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const news = await newsQuery;
  const total = await News.countDocuments(query);

  res.status(200).json({
    success: true,
    count: news.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    data: news,
  });
});

// @desc    Get single news article
// @route   GET /api/admin/news/:id
// @access  Private/Any Admin
exports.getNewsArticle = asyncHandler(async (req, res) => {
  const news = await News.findById(req.params.id);

  if (!news) {
    return res.status(404).json({
      success: false,
      message: "News article not found",
    });
  }

  res.status(200).json({
    success: true,
    data: news,
  });
});

// @desc    Upload a news article image
// @route   POST /api/admin/news/upload-image
// @access  Private/Any Admin
exports.uploadNewsImage = asyncHandler(async (req, res) => {
  try {
    const result = await handlePhotoUpload(req, res, "news", "news-article");

    return res.status(201).json({
      success: true,
      message: "News image uploaded successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to upload image",
    });
  }
});

// @desc    Create a new news article
// @route   POST /api/admin/news
// @access  Private/Any Admin
exports.createNews = asyncHandler(async (req, res) => {
  const { title, excerpt, content, date, category, image, readTime, author } =
    req.body;

  if (!title || !excerpt || !category) {
    return res.status(400).json({
      success: false,
      message: "Title, excerpt, and category are required",
    });
  }

  const newsData = {
    title: title.trim(),
    excerpt: excerpt.trim(),
    category: category.trim(),
    createdBy: req.user._id,
    updatedBy: req.user._id,
  };

  if (content) newsData.content = content.trim();
  if (date) newsData.date = new Date(date);
  if (image) {
    // Store the full URL instead of the key
    newsData.image = image;
  }
  if (readTime) newsData.readTime = readTime.trim();
  if (author) newsData.author = author.trim();

  const news = await News.create(newsData);

  res.status(201).json({
    success: true,
    message: "News article created successfully",
    data: news,
  });
});

// @desc    Update a news article
// @route   PUT /api/admin/news/:id
// @access  Private/Any Admin
exports.updateNews = asyncHandler(async (req, res) => {
  const news = await News.findById(req.params.id);

  if (!news) {
    return res.status(404).json({
      success: false,
      message: "News article not found",
    });
  }

  const allowedFields = [
    "title",
    "excerpt",
    "content",
    "date",
    "category",
    "image",
    "readTime",
    "author",
    "status",
  ];

  const updateData = {};
  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      if (key === "date" && req.body[key]) {
        updateData[key] = new Date(req.body[key]);
      } else if (key === "image") {
        // Store the full URL
        updateData[key] = req.body[key];
      } else if (typeof req.body[key] === "string") {
        updateData[key] = req.body[key].trim();
      } else {
        updateData[key] = req.body[key];
      }
    }
  });

  updateData.updatedBy = req.user._id;

  // If image is being updated, delete the old one
  if (updateData.image && news.image && updateData.image !== news.image) {
    await deletePhoto(news.image, "news");
  }

  const updatedNews = await News.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "News article updated successfully",
    data: updatedNews,
  });
});

// @desc    Delete a news article
// @route   DELETE /api/admin/news/:id
// @access  Private/Any Admin
exports.deleteNews = asyncHandler(async (req, res) => {
  const news = await News.findById(req.params.id);

  if (!news) {
    return res.status(404).json({
      success: false,
      message: "News article not found",
    });
  }

  // Delete associated image if exists
  if (news.image) {
    await deletePhoto(news.image, "news");
  }

  await news.deleteOne();

  res.status(200).json({
    success: true,
    message: "News article deleted successfully",
  });
});

// @desc    Get all clients with filtering
// @route   GET /api/admin/clients
// @access  Private/Any Admin
exports.getClients = asyncHandler(async (req, res) => {
  const {
    status,
    type,
    service,
    page = 1,
    limit = 20,
    search,
    sort = "-createdAt",
  } = req.query;

  const query = {};
  if (status) query.status = status;
  if (type) query.type = type;
  if (service) query.service = service;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { type: { $regex: search, $options: "i" } },
      { service: { $regex: search, $options: "i" } },
    ];
  }

  const sortBy = sort ? String(sort).split(",").join(" ") : "-createdAt";
  const clientsQuery = Client.find(query)
    .sort(sortBy)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const clients = await clientsQuery;
  const total = await Client.countDocuments(query);

  res.status(200).json({
    success: true,
    count: clients.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    data: clients,
  });
});

// @desc    Get single client details
// @route   GET /api/admin/clients/:id
// @access  Private/Any Admin
exports.getClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(404).json({
      success: false,
      message: "Client not found",
    });
  }

  res.status(200).json({
    success: true,
    data: client,
  });
});

// @desc    Upload a client logo
// @route   POST /api/admin/clients/upload-logo
// @access  Private/Any Admin
exports.uploadClientLogo = asyncHandler(async (req, res) => {
  try {
    const result = await handlePhotoUpload(req, res, "client", "client-logo");

    return res.status(201).json({
      success: true,
      message: "Client logo uploaded successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to upload logo",
    });
  }
});

// @desc    Create a new client
// @route   POST /api/admin/clients
// @access  Private/Any Admin
exports.createClient = asyncHandler(async (req, res) => {
  const { name, type, service, logo } = req.body;

  if (!name || !type) {
    return res.status(400).json({
      success: false,
      message: "Name and type are required",
    });
  }

  const clientData = {
    name: name.trim(),
    type: type.trim(),
    createdBy: req.user._id,
    updatedBy: req.user._id,
  };

  if (service) clientData.service = service.trim();
  if (logo) {
    // Store the full URL instead of the key
    clientData.logo = logo;
  }

  const client = await Client.create(clientData);

  res.status(201).json({
    success: true,
    message: "Client created successfully",
    data: client,
  });
});

// @desc    Update a client
// @route   PUT /api/admin/clients/:id
// @access  Private/Any Admin
exports.updateClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(404).json({
      success: false,
      message: "Client not found",
    });
  }

  const allowedFields = ["name", "type", "service", "logo", "status"];

  const updateData = {};
  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      if (key === "logo") {
        // Store the full URL
        updateData[key] = req.body[key];
      } else if (typeof req.body[key] === "string") {
        updateData[key] = req.body[key].trim();
      } else {
        updateData[key] = req.body[key];
      }
    }
  });

  updateData.updatedBy = req.user._id;

  // If logo is being updated, delete the old one
  if (updateData.logo && client.logo && updateData.logo !== client.logo) {
    await deletePhoto(client.logo, "client");
  }

  const updatedClient = await Client.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    message: "Client updated successfully",
    data: updatedClient,
  });
});

// @desc    Delete a client
// @route   DELETE /api/admin/clients/:id
// @access  Private/Any Admin
exports.deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(404).json({
      success: false,
      message: "Client not found",
    });
  }

  // Delete associated logo if exists
  if (client.logo) {
    await deletePhoto(client.logo, "client");
  }

  await client.deleteOne();

  res.status(200).json({
    success: true,
    message: "Client deleted successfully",
  });
});
