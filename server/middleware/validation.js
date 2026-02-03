const { body, validationResult } = require('express-validator');

// Validation middleware to check for errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }

  next();
};

// Helper function to detect suspicious/randomized names
const isSuspiciousName = (name) => {
  if (!name || typeof name !== 'string') return true;
  const trimmed = name.trim();

  // Check for random character patterns (too many consecutive consonants/vowels)
  const randomPattern = /[bcdfghjklmnpqrstvwxyz]{5,}|[aeiou]{5,}/i;
  if (randomPattern.test(trimmed)) return true;

  // Very long single words without spaces are suspicious
  if (!trimmed.includes(' ') && trimmed.length > 20) return true;

  // All caps or all lowercase long strings are suspicious
  if (trimmed.length > 15) {
    if (trimmed === trimmed.toUpperCase() && !trimmed.includes(' ')) return true;
    if (trimmed === trimmed.toLowerCase() && !trimmed.includes(' ') && trimmed.length > 20) return true;
  }

  return false;
};

// Helper function to detect randomized text in bio/experience/profession
const isRandomizedText = (text) => {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();

  if (trimmed.length < 5) return false;

  // Check for random character patterns
  const randomPattern = /[bcdfghjklmnpqrstvwxyz]{6,}|[aeiou]{5,}/i;
  if (randomPattern.test(trimmed)) return true;

  // All caps or all lowercase long strings without spaces
  if (trimmed.length > 10) {
    if (trimmed === trimmed.toUpperCase() && !trimmed.includes(' ')) return true;
    if (trimmed === trimmed.toLowerCase() && !trimmed.includes(' ') && trimmed.length > 15) return true;
  }

  return false;
};

// Registration validation rules
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .custom((value) => {
      if (isSuspiciousName(value)) {
        throw new Error('Name appears to be invalid or randomized. Please use your real name.');
      }
      return true;
    }),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
    .custom((value) => {
      // Check for suspicious email domains
      const domain = value.split('@')[1]?.toLowerCase();
      if (!domain) {
        throw new Error('Invalid email format');
      }

      // Block known temporary/disposable email domains
      const blockedDomains = [
        'tempmail.com', 'guerrillamail.com', '10minutemail.com',
        'throwaway.email', 'mailinator.com', 'getnada.com'
      ];

      if (blockedDomains.some(blocked => domain.includes(blocked))) {
        throw new Error('Temporary or disposable email addresses are not allowed');
      }

      return true;
    }),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('role')
    .isIn(['super_admin', 'admin_hr', 'admin_outsource', 'client', 'worker'])
    .withMessage('Role must be either super_admin, admin_hr, admin_outsource, client, or worker'),

  body('phone')
    .optional()
    .matches(/^(\+251|0)[1-9]\d{8}$/)
    .withMessage('Please provide a valid Ethiopian phone number'),

  // Validate profile fields to detect randomized content
  body('profile.bio')
    .optional()
    .custom((value) => {
      if (value && isRandomizedText(value)) {
        throw new Error('Bio appears to contain invalid or randomized content');
      }
      return true;
    }),

  body('profile.experience')
    .optional()
    .custom((value) => {
      if (value && isRandomizedText(value)) {
        throw new Error('Experience appears to contain invalid or randomized content');
      }
      return true;
    }),

  body('profile.profession')
    .optional()
    .custom((value) => {
      if (value && isRandomizedText(value)) {
        throw new Error('Profession appears to contain invalid or randomized content');
      }
      return true;
    }),

  handleValidationErrors
];

// Login validation rules
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

// Password reset validation rules
const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  handleValidationErrors
];

// New password validation rules
const validateNewPassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  handleValidationErrors
];

// Profile update validation rules
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .custom((value) => {
      if (value && isSuspiciousName(value)) {
        throw new Error('Name appears to be invalid or randomized. Please use your real name.');
      }
      return true;
    }),

  body('phone')
    .optional()
    .matches(/^(\+251|0)[1-9]\d{8}$/)
    .withMessage('Please provide a valid Ethiopian phone number'),

  body('profile.firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('First name must be between 1 and 30 characters'),

  body('profile.lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Last name must be between 1 and 30 characters'),

  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters')
    .custom((value) => {
      if (value && isRandomizedText(value)) {
        throw new Error('Bio appears to contain invalid or randomized content');
      }
      return true;
    }),

  body('profile.dob')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Date of birth must be a valid ISO8601 date (YYYY-MM-DD)'),

  body('profile.cv')
    .optional({ nullable: true })
    .custom((value) => {
      // Allow null (to delete), or an object with optional name/mimeType/data
      if (value === null) return true;
      if (typeof value !== 'object') throw new Error('CV must be an object or null');
      return true;
    }),

  body('workerProfile.skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array of strings'),
  body('workerProfile.certifications')
    .optional()
    .isArray()
    .withMessage('Certifications must be an array of strings'),
  body('workerProfile.languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array of strings'),
  body('workerProfile.education')
    .optional()
    .isArray()
    .withMessage('Education must be an array'),
  body('workerProfile.workHistory')
    .optional()
    .isArray()
    .withMessage('Work history must be an array'),

  handleValidationErrors
];

// Job creation validation rules
const validateJobCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Job title must be between 5 and 100 characters'),

  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Job description must be between 20 and 2000 characters'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Job category is required'),

  body('budget')
    .isFloat({ min: 100 })
    .withMessage('Budget must be at least 100 ETB'),

  body('deadline')
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),

  body('requiredSkills')
    .isArray({ min: 1 })
    .withMessage('At least one required skill must be specified'),

  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validateNewPassword,
  validateProfileUpdate,
  validateJobCreation,
};
