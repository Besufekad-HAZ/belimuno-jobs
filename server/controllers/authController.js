const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const https = require('https');
const User = require('../models/User');
const Region = require('../models/Region');
const ErrorResponse = require('../utils/errorResponse');
const { generateToken, generateShortToken } = require('../utils/jwtUtils');
const dns = require('dns');
// Prefer IPv4 results first to avoid IPv6 connectivity issues in some environments (e.g., WSL)
try { if (dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first'); } catch {}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, region, profile, workerProfile, clientProfile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Find region if provided
    let userRegion = null;
    if (region) {
      userRegion = await Region.findById(region);
      if (!userRegion) {
        return res.status(400).json({
          success: false,
          message: 'Invalid region specified'
        });
      }
    }

    // Create user object
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      region: userRegion ? userRegion._id : null,
      profile: profile || {},
      isVerified: true, // Auto-verify all users for testing (can be changed to false for production)
    };

    // Add role-specific profile data
    if (role === 'worker' && workerProfile) {
      userData.workerProfile = workerProfile;
    } else if (role === 'client' && clientProfile) {
      userData.clientProfile = clientProfile;
    }

    // Create user
    const user = await User.create(userData);

    // Generate JWT token
    const token = generateToken({ id: user._id });

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password').populate('region');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken({ id: user._id });

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('region');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    // Build update operators to better control nested merges and unsets
    const updateOps = { $set: {}, $unset: {} };

    if (req.body.name !== undefined) updateOps.$set.name = req.body.name;
    if (req.body.phone !== undefined) updateOps.$set.phone = req.body.phone;
    if (req.body.notifications !== undefined) updateOps.$set.notifications = req.body.notifications;

    // Profile: deep-merge with existing, and support explicit CV deletion when null is sent
    if (req.body.profile !== undefined) {
      const currentUser = await User.findById(req.user.id);
      const currentProfile = (currentUser && currentUser.profile)
        ? (typeof currentUser.profile.toObject === 'function' ? currentUser.profile.toObject() : currentUser.profile)
        : {};
      const incomingProfile = req.body.profile || {};

      // Track explicit CV deletion intent
      let shouldUnsetCv = false;
      if (Object.prototype.hasOwnProperty.call(incomingProfile, 'cv') && incomingProfile.cv === null) {
        updateOps.$unset['profile.cv'] = '';
        shouldUnsetCv = true;
        delete incomingProfile.cv; // ensure it's not included in $set merge below
      }

      // Merge existing with incoming (shallow merge is enough for our fields)
      const mergedProfile = { ...currentProfile, ...incomingProfile };

      // If CV is being unset, ensure it does not sneak back in through $set
      if (shouldUnsetCv && Object.prototype.hasOwnProperty.call(mergedProfile, 'cv')) {
        delete mergedProfile.cv;
      }

      updateOps.$set.profile = mergedProfile;
    }

    // Update role-specific profiles
    if (req.body.workerProfile) {
      // Shallow-merge workerProfile; arrays are replaced as provided by client
      updateOps.$set.workerProfile = {
        ...(req.user.workerProfile || {}),
        ...req.body.workerProfile,
      };
    }
    if (req.body.clientProfile) {
      updateOps.$set.clientProfile = {
        ...(req.user.clientProfile || {}),
        ...req.body.clientProfile
      };
    }

    // Cleanup empty operators
    if (Object.keys(updateOps.$set).length === 0) delete updateOps.$set;
    if (Object.keys(updateOps.$unset).length === 0) delete updateOps.$unset;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateOps,
      {
        new: true,
        runValidators: true
      }
    ).populate('region');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email'
      });
    }

    // Generate reset token (expires in 10 minutes)
    const resetToken = generateShortToken({ id: user._id, email: user.email }, '10m');

    // In a real application, you would send this token via email
    // For now, we'll just return it in the response (for development)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: 'Password reset instructions sent to your email',
      // Remove this in production - only for development
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing forgot password request',
      error: error.message
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Verify email error:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: error.message
    });
  }
};

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerification = async (req, res, next) => {
  try {
    if (req.user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate verification token
    const verificationToken = generateShortToken({ id: req.user._id }, '24h');

    // In a real application, you would send this token via email
    console.log(`Email verification token for ${req.user.email}: ${verificationToken}`);

    res.status(200).json({
      success: true,
      message: 'Verification email sent',
      // Remove this in production - only for development
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification email',
      error: error.message
    });
  }
};

module.exports = {
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
};

/**
 * Google OAuth: verify ID token without external deps using tokeninfo endpoint
 */
async function verifyGoogleIdToken(idToken) {
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const payload = JSON.parse(data);
          if (payload.error_description || payload.error) return reject(new Error(payload.error_description || payload.error));
          resolve(payload);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('timeout', () => {
      req.destroy(new Error('ETIMEDOUT'));
    });
    req.on('error', async (err) => {
      // Optional dev fallback (offline verify) when network is blocked
      if (process.env.GOOGLE_OFFLINE_VERIFY === 'true') {
        try {
          const decoded = jwt.decode(idToken) || {};
          if (!decoded || typeof decoded !== 'object') return reject(err);
          // Minimal checks
          const now = Math.floor(Date.now() / 1000);
          if (decoded.exp && now > decoded.exp) return reject(new Error('Token expired'));
          if (!decoded.aud) return reject(new Error('Missing audience'));
          resolve({
            aud: decoded.aud,
            email: decoded.email,
            email_verified: decoded.email_verified || decoded.email_verified === 'true',
            name: decoded.name,
            picture: decoded.picture,
            iss: decoded.iss,
          });
          return;
        } catch (e) {
          return reject(err);
        }
      }
      reject(err);
    });
    req.end();
  });
}

// @desc    Google login/register
// @route   POST /api/auth/google
// @access  Public
async function googleAuth(req, res) {
  try {
  const { credential, role } = req.body || {};
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Missing Google credential' });
    }

    let googlePayload;
    try {
      googlePayload = await verifyGoogleIdToken(credential);
    } catch (err) {
      console.error('Google auth verify error:', err);
      const allowOffline = process.env.GOOGLE_OFFLINE_VERIFY === 'true' || (process.env.NODE_ENV || 'development') !== 'production';
      if (allowOffline) {
        try {
          const decoded = jwt.decode(credential) || {};
          const now = Math.floor(Date.now() / 1000);
          if (!decoded || typeof decoded !== 'object') throw err;
          if (decoded.exp && now > decoded.exp) throw new Error('Token expired');
          googlePayload = {
            aud: decoded.aud,
            email: decoded.email,
            email_verified: decoded.email_verified || decoded.email_verified === 'true',
            name: decoded.name,
            picture: decoded.picture,
          };
          console.warn('Google auth: using offline JWT decode fallback (dev mode).');
        } catch (e) {
          return res.status(400).json({ success: false, message: 'Invalid Google credential. Please try again.', error: (e && e.message) || 'decode_failed' });
        }
      } else {
        return res.status(503).json({ success: false, message: 'Unable to verify Google token (network). Please try again later.', error: err.message });
      }
    }
    const audience = googlePayload.aud;
    const expectedStr = (process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_IDS || '').trim();
    const expectedList = expectedStr ? expectedStr.split(',').map(s=>s.trim()).filter(Boolean) : [];

    const isProd = (process.env.NODE_ENV || 'development') === 'production';
    const offlineVerify = process.env.GOOGLE_OFFLINE_VERIFY === 'true';

    if (expectedList.length === 0) {
      if (!isProd || offlineVerify) {
        console.warn('Google auth: GOOGLE_CLIENT_ID not set; skipping audience check in development/offline mode.');
      } else {
        return res.status(500).json({ success: false, message: 'Server misconfiguration: GOOGLE_CLIENT_ID not set' });
      }
    } else if (!expectedList.includes(audience)) {
      if (!isProd || offlineVerify) {
        console.warn(`Google auth: token audience ${audience} not in expected list [${expectedList.join(', ')}]; allowing in development/offline mode.`);
      } else {
        return res.status(401).json({ success: false, message: 'Invalid token audience', expected: expectedList, received: audience });
      }
    }
    const emailVerified = googlePayload.email_verified === true || googlePayload.email_verified === 'true';
    if (!emailVerified) {
      return res.status(401).json({ success: false, message: 'Google email not verified' });
    }

    const email = googlePayload.email;
    const name = googlePayload.name || email.split('@')[0];
    const picture = googlePayload.picture;

    let user = await User.findOne({ email });
    if (!user) {
      // If role provided and allowed, create a new account (Google sign-up)
      const allowedSignupRoles = ['worker', 'client'];
      if (role && allowedSignupRoles.includes(role)) {
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 12);
        const profile = { avatar: picture };
        user = await User.create({
          name,
          email,
          password: hashedPassword,
          role,
          profile,
          isVerified: true,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'No account found for this Google email. Please sign up first or select a role to create an account.'
        });
      }
    } else {
      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Account has been deactivated. Please contact support.' });
      }
      // Ensure avatar gets updated if empty
      if (picture && (!user.profile || !user.profile.avatar)) {
        user.profile = user.profile || {};
        user.profile.avatar = picture;
        await user.save();
      }
    }

    const token = generateToken({ id: user._id });
    user.password = undefined;
    res.status(200).json({ success: true, message: 'Google login successful', token, user });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, message: 'Error during Google authentication', error: error.message });
  }
}
