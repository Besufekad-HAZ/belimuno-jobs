const express = require('express');
const {
  getDashboard,
  getWorkers,
  verifyWorker,
  getJobs,
  getApplications,
  handleEscalation,
  getPerformanceMetrics,
  updateRegionalSettings,
  getJobMessages,
  sendJobMessage,
  rejectWorker
} = require('../controllers/areaManagerController');
const { protect } = require('../middleware/auth');
const { requireAreaManagerOrAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// All area manager routes require authentication and area manager role
router.use(protect, requireAreaManagerOrAdmin);

// Dashboard and overview
router.get('/dashboard', getDashboard);
router.get('/performance', getPerformanceMetrics);

// Worker management
router.get('/workers', getWorkers);
router.put('/workers/:id/verify', verifyWorker);
router.put('/workers/:id/reject', rejectWorker);

// Job management
router.get('/jobs', getJobs);
router.get('/applications', getApplications);
router.get('/jobs/:id/messages', getJobMessages);
router.post('/jobs/:id/messages', sendJobMessage);

// Escalation handling
router.put('/jobs/:id/escalate', handleEscalation);

// Regional settings
router.put('/region/settings', updateRegionalSettings);

module.exports = router;
