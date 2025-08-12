const ErrorResponse = require('../utils/errorResponse');

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// Check if user is super admin
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required'
    });
  }
  next();
};

// Check if user is any admin (super, HR, outsource)
const requireAnyAdmin = (req, res, next) => {
  if (!req.user || !['super_admin', 'admin_hr', 'admin_outsource'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Check if user is worker
const requireWorker = (req, res, next) => {
  if (!req.user || req.user.role !== 'worker') {
    return res.status(403).json({
      success: false,
      message: 'Worker access required'
    });
  }
  next();
};

// Check if user is client
const requireClient = (req, res, next) => {
  if (!req.user || req.user.role !== 'client') {
    return res.status(403).json({
      success: false,
      message: 'Client access required'
    });
  }
  next();
};

// Check if user owns the resource or is admin/area manager
const requireOwnershipOrAdmin = (req, res, next) => {
  // This middleware expects req.resourceOwnerId to be set by the route handler
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  const isOwner = req.resourceOwnerId && req.user._id.toString() === req.resourceOwnerId.toString();
  const isAdmin = ['super_admin', 'admin_hr', 'admin_outsource'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  }

  next();
};

// Check if user is verified
const requireVerified = (req, res, next) => {
  if (!req.user || !req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account verification required'
    });
  }
  next();
};

module.exports = {
  authorize,
  requireSuperAdmin,
  requireAnyAdmin,
  requireWorker,
  requireClient,
  requireOwnershipOrAdmin,
  requireVerified
};
