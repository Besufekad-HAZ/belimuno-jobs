const express = require('express');
const {
  getDashboard,
  getJobs,
  createJob,
  getJob,
  updateJob,
  acceptApplication,
  rejectApplication,
  markJobCompleted,
  requestRevision,
  getPayments,
  getJobMessages,
  sendJobMessage,
  uploadPaymentProof
} = require('../controllers/clientController');
const { protect } = require('../middleware/auth');
const { requireClient } = require('../middleware/roleCheck');

const router = express.Router();

// All client routes require authentication and client role
router.use(protect, requireClient);

// Dashboard and overview
router.get('/dashboard', getDashboard);

// Job management
router.get('/jobs', getJobs);
router.post('/jobs', createJob);
router.get('/jobs/:id', getJob);
router.put('/jobs/:id', updateJob);
router.get('/jobs/:id/messages', getJobMessages);
router.post('/jobs/:id/messages', sendJobMessage);

// Application management
router.put('/jobs/:jobId/applications/:applicationId/accept', acceptApplication);
router.put('/jobs/:jobId/applications/:applicationId/reject', rejectApplication);

// Job completion and review
router.put('/jobs/:id/complete', markJobCompleted);
router.put('/jobs/:id/request-revision', requestRevision);

// Payments
router.get('/payments', getPayments);
router.put('/payments/:id/proof', uploadPaymentProof);

module.exports = router;
