const express = require('express');
// const {
//   verifyWorker,
//   getPerformanceMetrics
// } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('super_admin'));

// Placeholder routes - controllers will be implemented later
router.put('/verify-worker/:id', (req, res) => {
  res.json({ success: true, message: 'Admin verify worker endpoint - coming soon!' });
});

router.get('/performance', (req, res) => {
  res.json({ success: true, message: 'Admin performance metrics endpoint - coming soon!' });
});

module.exports = router;
