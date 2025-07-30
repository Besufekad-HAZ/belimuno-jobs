const express = require('express');
const {
  getDashboard,
  updateRegionSettings
} = require('../controllers/areaManagerController');
const { protect, roleCheck } = require('../middleware/auth');

const router = express.Router();

router.use(protect, roleCheck('area_manager'));

router.get('/dashboard', getDashboard);
router.put('/settings', updateRegionSettings);

module.exports = router;
