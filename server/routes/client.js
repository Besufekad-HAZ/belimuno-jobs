const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All client routes require authentication and client role
router.use(protect, authorize('client'));

// Client dashboard
router.get('/dashboard', (req, res) => {
  res.json({ success: true, message: 'Client dashboard - coming soon!' });
});

// Get client's jobs
router.get('/jobs', (req, res) => {
  res.json({ success: true, message: 'Client jobs endpoint - coming soon!' });
});

module.exports = router;
