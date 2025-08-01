const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all jobs (public/filtered)
// @route   GET /api/jobs
// @access  Public
exports.getJobs = asyncHandler(async (req, res) => {
  const {
    category,
    subcategory,
    region,
    budgetMin,
    budgetMax,
    experienceLevel,
    skills,
    page = 1,
    limit = 10,
    sort = '-createdAt'
  } = req.query;

  // Build query
  const query = {
    status: 'posted',
    isPublic: true
  };

  if (category) query.category = category;
  if (subcategory) query.subcategory = subcategory;
  if (region) query.region = region;
  if (experienceLevel) query.experienceLevel = experienceLevel;

  if (budgetMin || budgetMax) {
    query.budget = {};
    if (budgetMin) query.budget.$gte = Number(budgetMin);
    if (budgetMax) query.budget.$lte = Number(budgetMax);
  }

  if (skills) {
    const skillsArray = skills.split(',').map(skill => skill.trim());
    query.requiredSkills = { $in: skillsArray };
  }

  const jobs = await Job.find(query)
    .populate('client', 'name profile.avatar clientProfile.companyName')
    .populate('region', 'name')
    .select('-applicants -messages -payment.chapaTransactionId')
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

// @desc    Get single job details
// @route   GET /api/jobs/:id
// @access  Public
exports.getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate('client', 'name profile clientProfile.companyName')
    .populate('region', 'name')
    .populate('worker', 'name profile.avatar workerProfile.rating');

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  // Don't show sensitive information for public access
  const publicJob = {
    ...job.toObject(),
    applicants: undefined,
    messages: undefined,
    payment: {
      totalAmount: job.payment?.totalAmount,
      paymentStatus: job.payment?.paymentStatus
    }
  };

  // If user is authenticated, show more details based on role
  if (req.user) {
    const isClient = req.user._id.toString() === job.client._id.toString();
    const isWorker = job.worker && req.user._id.toString() === job.worker._id.toString();
    const isAdmin = ['super_admin', 'area_manager'].includes(req.user.role);

    if (isClient || isWorker || isAdmin) {
      // Show full job details for authorized users
      publicJob.applicants = job.applicants;
      publicJob.messages = job.messages;
      publicJob.payment = job.payment;
    }
  }

  res.status(200).json({
    success: true,
    data: publicJob
  });
});

// @desc    Apply for a job
// @route   POST /api/jobs/:id/apply
// @access  Private/Worker
exports.applyForJob = asyncHandler(async (req, res) => {
  const { proposal, proposedBudget, estimatedDuration, coverLetter } = req.body;
  const jobId = req.params.id;
  const workerId = req.user._id;

  // Check if job exists and is still open
  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  if (job.status !== 'posted') {
    return res.status(400).json({
      success: false,
      message: 'Job is no longer accepting applications'
    });
  }

  // Check if worker already applied
  const existingApplication = await Application.findOne({
    job: jobId,
    worker: workerId
  });

  if (existingApplication) {
    return res.status(400).json({
      success: false,
      message: 'You have already applied for this job'
    });
  }

  // Check if worker is verified
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'You must be verified to apply for jobs'
    });
  }

  // Validate required fields
  if (!proposal || !proposedBudget) {
    return res.status(400).json({
      success: false,
      message: 'Proposal and proposed budget are required'
    });
  }

  // Create application
  const application = await Application.create({
    job: jobId,
    worker: workerId,
    proposal,
    proposedBudget,
    estimatedDuration,
    coverLetter
  });

  // Populate application with worker details
  await application.populate('worker', 'name profile.avatar workerProfile.rating workerProfile.skills');

  // Create notification for client
  await Notification.create({
    recipient: job.client,
    sender: workerId,
    title: 'New Job Application',
    message: `${req.user.name} has applied for your job "${job.title}"`,
    type: 'job_application',
    relatedJob: jobId,
    relatedUser: workerId,
    actionButton: {
      text: 'Review Application',
      action: 'view_application'
    }
  });

  // Also notify area manager if exists
  if (job.areaManager) {
    await Notification.create({
      recipient: job.areaManager,
      sender: workerId,
      title: 'New Job Application in Your Region',
      message: `A worker has applied for "${job.title}" in your region`,
      type: 'job_application',
      relatedJob: jobId,
      relatedUser: workerId
    });
  }

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: application
  });
});

// @desc    Get job categories
// @route   GET /api/jobs/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
  // This could be stored in database or configuration
  const categories = [
    {
      name: 'Technology',
      subcategories: ['Web Development', 'Mobile Development', 'Data Science', 'AI/ML', 'DevOps', 'Cybersecurity']
    },
    {
      name: 'Design',
      subcategories: ['Graphic Design', 'UI/UX Design', 'Brand Design', 'Illustration', 'Video Editing']
    },
    {
      name: 'Writing & Translation',
      subcategories: ['Content Writing', 'Copywriting', 'Technical Writing', 'Translation', 'Proofreading']
    },
    {
      name: 'Marketing',
      subcategories: ['Digital Marketing', 'SEO', 'Social Media', 'Email Marketing', 'Market Research']
    },
    {
      name: 'Business',
      subcategories: ['Consulting', 'Project Management', 'Business Analysis', 'Financial Analysis', 'HR']
    },
    {
      name: 'Construction',
      subcategories: ['Residential Construction', 'Commercial Construction', 'Renovation', 'Electrical', 'Plumbing']
    },
    {
      name: 'Healthcare',
      subcategories: ['Nursing', 'Medical Assistant', 'Healthcare Administration', 'Therapy', 'Medical Research']
    },
    {
      name: 'Education',
      subcategories: ['Tutoring', 'Curriculum Development', 'Online Teaching', 'Training', 'Educational Content']
    },
    {
      name: 'Other',
      subcategories: ['General Labor', 'Customer Service', 'Data Entry', 'Virtual Assistant', 'Research']
    }
  ];

  res.status(200).json({
    success: true,
    data: categories
  });
});

// @desc    Get job statistics
// @route   GET /api/jobs/stats
// @access  Public
exports.getJobStats = asyncHandler(async (req, res) => {
  const totalJobs = await Job.countDocuments();
  const activeJobs = await Job.countDocuments({ status: { $in: ['posted', 'assigned', 'in_progress'] } });
  const completedJobs = await Job.countDocuments({ status: 'completed' });

  // Get jobs by category
  const jobsByCategory = await Job.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Get average budget by category
  const avgBudgetByCategory = await Job.aggregate([
    { $group: { _id: '$category', avgBudget: { $avg: '$budget' } } },
    { $sort: { avgBudget: -1 } }
  ]);

  // Get recent job trends (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentJobs = await Job.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalJobs,
        activeJobs,
        completedJobs,
        recentJobs
      },
      jobsByCategory,
      avgBudgetByCategory
    }
  });
});

// @desc    Search jobs
// @route   GET /api/jobs/search
// @access  Public
exports.searchJobs = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const searchRegex = new RegExp(q, 'i');

  const query = {
    status: 'posted',
    isPublic: true,
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
      { subcategory: searchRegex },
      { requiredSkills: { $in: [searchRegex] } },
      { tags: { $in: [searchRegex] } }
    ]
  };

  const jobs = await Job.find(query)
    .populate('client', 'name profile.avatar clientProfile.companyName')
    .populate('region', 'name')
    .select('-applicants -messages -payment.chapaTransactionId')
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

// @desc    Get recommended jobs for worker
// @route   GET /api/jobs/recommended
// @access  Private/Worker
exports.getRecommendedJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const worker = req.user;

  // Build recommendation query based on worker's skills and preferences
  const query = {
    status: 'posted',
    isPublic: true,
    region: worker.region // Jobs in worker's region
  };

  // Match jobs that require worker's skills
  if (worker.workerProfile?.skills && worker.workerProfile.skills.length > 0) {
    query.requiredSkills = { $in: worker.workerProfile.skills };
  }

  const jobs = await Job.find(query)
    .populate('client', 'name profile.avatar clientProfile.companyName')
    .populate('region', 'name')
    .select('-applicants -messages -payment.chapaTransactionId')
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
