const Job = require('../models/Job');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Update job status
// @route   PUT /api/worker/jobs/:id/status
// @access  Private/Worker
exports.updateJobStatus = asyncHandler(async (req, res) => {
  const job = await Job.findOneAndUpdate(
    {
      _id: req.params.id,
      worker: req.user.id
    },
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  if(!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  res.status(200).json({ success: true, data: job });
});

// @desc    Get worker jobs
// @route   GET /api/worker/jobs
// @access  Private/Worker
exports.getWorkerJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ worker: req.user.id });
  res.status(200).json({ success: true, data: jobs });
});
