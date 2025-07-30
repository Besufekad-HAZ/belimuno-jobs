const User = require('../models/User');
const Job = require('../models/Job');
const Report = require('../models/Report');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Verify worker profile
// @route   PUT /api/admin/verify-worker/:id
// @access  Private/Super Admin
exports.verifyWorker = asyncHandler(async (req, res) => {
  const worker = await User.findByIdAndUpdate(
    req.params.id,
    { isVerified: true },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: worker });
});

// @desc    Get performance metrics
// @route   GET /api/admin/performance
// @access  Private/Super Admin
exports.getPerformanceMetrics = asyncHandler(async (req, res) => {
  const workers = await User.find({ role: 'worker' });
  const jobs = await Job.find();

  const metrics = {
    totalWorkers: workers.length,
    activeJobs: jobs.filter(job => job.status === 'active').length,
    completedJobs: jobs.filter(job => job.status === 'completed').length,
    revenue: jobs.reduce((sum, job) => sum + (job.status === 'completed' ? job.budget : 0), 0)
  };

  res.status(200).json({ success: true, data: metrics });
});
