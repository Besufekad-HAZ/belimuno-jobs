const express = require('express');
const {
  verifyWorker,
  getPerformanceMetrics
} = require('../controllers/adminController');
const { protect, roleCheck } = require('../middleware/auth');

const router = express.Router();

router.use(protect, roleCheck('super_admin'));

router.put('/verify-worker/:id', verifyWorker);
router.get('/performance', getPerformanceMetrics);

module.exports = router;
