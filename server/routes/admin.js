const express = require('express');
const {
  getDashboard,
  getUsers,
  getUser,
  updateUser,
  verifyWorker,
  getJobs,
  createJob,
  updateJob,
  deleteJob,
  getPerformanceMetrics,
  getPayments,
  handlePaymentDispute,
  markPaymentPaid,
  deactivateUser,
  activateUser
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { requireSuperAdmin, requireAnyAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// All admin routes require authentication and any admin role by default
router.use(protect, requireAnyAdmin);

// Dashboard and overview
router.get('/dashboard', getDashboard);
router.get('/performance', getPerformanceMetrics);

// User management (super admin only)
router.get('/users', requireSuperAdmin, getUsers);
router.get('/users/:id', requireSuperAdmin, getUser);
router.put('/users/:id', requireSuperAdmin, updateUser);
router.put('/users/:id/deactivate', requireSuperAdmin, deactivateUser);
router.put('/users/:id/activate', requireSuperAdmin, activateUser);

// Worker verification (any admin)
router.put('/verify-worker/:id', verifyWorker);

// Job management (any admin)
router.get('/jobs', getJobs);
router.post('/jobs', createJob);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);

// Payment management (any admin can view/mark paid; disputes handled by super admin)
router.get('/payments', getPayments);
router.put('/payments/:id/dispute', requireSuperAdmin, handlePaymentDispute);
router.put('/payments/:id/mark-paid', markPaymentPaid);

module.exports = router;
