const express = require('express');
// const {
//   getDashboard,
//   updateRegionSettings
// } = require('../controllers/areaManagerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('area_manager'));

// Placeholder routes - controllers will be implemented later
router.get('/dashboard', (req, res) => {
  res.json({ success: true, message: 'Area Manager dashboard - coming soon!' });
});

router.put('/settings', (req, res) => {
  res.json({ success: true, message: 'Area Manager settings - coming soon!' });
});

module.exports = router;
