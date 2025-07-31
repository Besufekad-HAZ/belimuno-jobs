const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route to get all jobs
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Jobs listing endpoint - coming soon!' });
});

// Protected routes
router.use(protect);

// Create new job (clients only)
router.post('/', authorize('client'), (req, res) => {
  res.json({ success: true, message: 'Create job endpoint - coming soon!' });
});

// Apply to job (workers only)
router.post('/:id/apply', authorize('worker'), (req, res) => {
  res.json({ success: true, message: 'Apply to job endpoint - coming soon!' });
});

module.exports = router;
