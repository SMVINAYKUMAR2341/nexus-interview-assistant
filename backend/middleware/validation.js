const { body, validationResult } = require('express-validator');

// Validation rules for user registration
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  body('role')
    .isIn(['Interviewer', 'Interviewee'])
    .withMessage('Role must be either Interviewer or Interviewee'),

  body('agreeTerms')
    .custom((value) => {
      // Accept boolean true or string 'true'
      if (value === true || value === 'true') {
        return true;
      }
      throw new Error('You must agree to the terms and conditions');
    })
];

// Validation rules for user login
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation rules for profile update
const validateProfileUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('profile.firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),

  body('profile.lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),

  body('profile.phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),

  body('profile.bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
];

// Validation rules for password change
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// Validation rules for password reset request
const validatePasswordResetRequest = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

// Validation rules for file upload
const validateFileUpload = [
  body('category')
    .optional()
    .isIn(['resume', 'cover_letter', 'portfolio', 'certificate', 'other'])
    .withMessage('Invalid file category'),

  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Each tag must be between 1 and 20 characters')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Custom validation for interviewer-specific fields
const validateInterviewerInfo = [
  body('interviewerInfo.company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),

  body('interviewerInfo.position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Position cannot exceed 100 characters'),

  body('interviewerInfo.experience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be between 0 and 50 years'),

  body('interviewerInfo.specializations')
    .optional()
    .isArray()
    .withMessage('Specializations must be an array'),

  body('interviewerInfo.specializations.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each specialization must be between 1 and 50 characters')
];

// Custom validation for interviewee-specific fields
const validateIntervieweeInfo = [
  body('intervieweeInfo.currentStatus')
    .optional()
    .isIn(['Student', 'Employed', 'Job Seeker', 'Career Changer', 'Other'])
    .withMessage('Invalid current status'),

  body('intervieweeInfo.education')
    .optional()
    .isArray()
    .withMessage('Education must be an array'),

  body('intervieweeInfo.experience')
    .optional()
    .isArray()
    .withMessage('Experience must be an array'),

  body('intervieweeInfo.skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),

  body('intervieweeInfo.skills.*.name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Skill name must be between 1 and 50 characters'),

  body('intervieweeInfo.skills.*.level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    .withMessage('Invalid skill level')
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validatePasswordResetRequest,
  validateFileUpload,
  validateInterviewerInfo,
  validateIntervieweeInfo,
  handleValidationErrors
};