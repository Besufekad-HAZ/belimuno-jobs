const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Generate short-lived tokens for password reset, email verification, etc.
const generateShortToken = (payload, expiresIn = '10m') => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
  });
};

// Extract token from request headers
const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  return null;
};

// Extract token from cookies (alternative method)
const extractTokenFromCookie = (req) => {
  return req.cookies?.token || null;
};

module.exports = {
  generateToken,
  verifyToken,
  generateShortToken,
  extractTokenFromHeader,
  extractTokenFromCookie,
};
