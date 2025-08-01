const express = require('express');
const {
  getDashboard,
  getUsers,
  getUser,
  updateUser,
  verifyWorker,
  getJobs,
  getPerformanceMetrics,
  getPayments,
  handlePaymentDispute,
  deactivateUser
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// All admin routes require authentication and super admin role
router.use(protect, requireSuperAdmin);

// Dashboard and overview
router.get('/dashboard', getDashboard);
router.get('/performance', getPerformanceMetrics);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/deactivate', deactivateUser);

// Worker verification
router.put('/verify-worker/:id', verifyWorker);

// Job management
router.get('/jobs', getJobs);

// Payment management
router.get('/payments', getPayments);
router.put('/payments/:id/dispute', handlePaymentDispute);

module.exports = router;
