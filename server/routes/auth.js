const express = require('express');
const router = express.Router();

// Import controllers
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  googleAuth,
} = require('../controllers/authController');

// Import middleware
const { protect } = require('../middleware/auth');
const {
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validateNewPassword,
  validateProfileUpdate,
} = require('../middleware/validation');
const {
  registerLimiter,
  authLimiter,
  passwordResetLimiter,
} = require('../middleware/rateLimiter');

// Public routes
router.post('/register', registerLimiter, validateRegistration, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/google', authLimiter, googleAuth);
router.post('/forgot-password', passwordResetLimiter, validatePasswordReset, forgotPassword);
router.post('/reset-password/:token', passwordResetLimiter, validateNewPassword, resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.use(protect); // All routes below this require authentication

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/profile', validateProfileUpdate, updateProfile);
router.put('/password', changePassword);
router.post('/resend-verification', resendVerification);

module.exports = router;
