const express = require('express');
const {
  getJobs,
  getJob,
  applyForJob,
  getCategories,
  getJobStats,
  searchJobs,
  getRecommendedJobs
} = require('../controllers/jobController');
const { protect } = require('../middleware/auth');
const { requireWorker } = require('../middleware/roleCheck');

const router = express.Router();

// Public routes
router.get('/', getJobs);
router.get('/categories', getCategories);
router.get('/stats', getJobStats);
router.get('/search', searchJobs);
router.get('/:id', getJob);

// Protected routes
router.use(protect);

// Worker-specific routes
router.post('/:id/apply', requireWorker, applyForJob);
router.get('/recommended', requireWorker, getRecommendedJobs);

module.exports = router;
