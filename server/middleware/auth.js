const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { verifyToken, extractTokenFromHeader } = require('../utils/jwtUtils');

// Protect routes - user must be authenticated
const protect = async (req, res, next) => {
  let token;

  try {
    // Extract token from header
    token = extractTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No user found with this token'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Check if user is verified (disabled for testing - can be enabled later)
    /*
    if (!user.isVerified && user.role !== 'super_admin') {
      return res.status(401).json({
        success: false,
        message: 'Account not verified. Please verify your email.'
      });
    }
    */

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this resource`
      });
    }

    next();
  };
};

// Check if user owns the resource or has admin privileges
const authorizeOwnershipOrAdmin = (resourceOwnerField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Super admin can access everything
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Check ownership
    if (req.resource && req.resource[resourceOwnerField] && req.resource[resourceOwnerField].toString() === req.user._id.toString()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  };
};

// Middleware to check if user belongs to the same region (for admin roles)
const authorizeRegion = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  // Super admin can access all regions
  if (req.user.role === 'super_admin') {
    return next();
  }

  next();
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  let token;

  try {
    token = extractTokenFromHeader(req);

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');

      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log('Optional auth failed:', error.message);
  }

  next();
};

module.exports = {
  protect,
  authorize,
  authorizeOwnershipOrAdmin,
  authorizeRegion,
  optionalAuth,
};
