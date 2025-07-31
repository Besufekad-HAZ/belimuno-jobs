const express = require('express');
// const {
//   updateJobStatus,
//   getWorkerJobs
// } = require('../controllers/workerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('worker'));

// Placeholder routes - controllers will be implemented later
router.put('/jobs/:id/status', (req, res) => {
  res.json({ success: true, message: 'Worker update job status endpoint - coming soon!' });
});

router.get('/jobs', (req, res) => {
  res.json({ success: true, message: 'Worker jobs endpoint - coming soon!' });
});

module.exports = router;
