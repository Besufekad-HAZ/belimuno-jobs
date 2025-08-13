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

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/google', googleAuth);
router.post('/forgot-password', validatePasswordReset, forgotPassword);
router.post('/reset-password/:token', validateNewPassword, resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.use(protect); // All routes below this require authentication

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/profile', validateProfileUpdate, updateProfile);
router.put('/password', changePassword);
router.post('/resend-verification', resendVerification);

module.exports = router;
