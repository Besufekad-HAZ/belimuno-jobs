const Job = require('../models/Job');
const User = require('../models/User');
const Region = require('../models/Region');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get regional dashboard data
// @route   GET /api/area-manager/dashboard
// @access  Private/Area Manager
exports.getDashboard = asyncHandler(async (req, res) => {
  const region = await Region.findOne({ manager: req.user.id });

  const jobs = await Job.find({ region: region._id });
  const workers = await User.find({
    region: region._id,
    role: 'worker'
  });

  const jobStatus = {
    active: jobs.filter(job => job.status === 'active').length,
    completed: jobs.filter(job => job.status === 'completed').length,
    pending: jobs.filter(job => job.status === 'pending').length
  };

  res.status(200).json({
    success: true,
    data: { region, jobStatus, workers }
  });
});

// @desc    Update regional settings
// @route   PUT /api/area-manager/settings
// @access  Private/Area Manager
exports.updateRegionSettings = asyncHandler(async (req, res) => {
  const region = await Region.findOneAndUpdate(
    { manager: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: region });
});
