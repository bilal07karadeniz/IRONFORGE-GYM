const { body, validationResult } = require('express-validator');
const AppError = require('../../utils/AppError');
const { validatePassword, getRequirementsText } = require('../../utils/passwordValidator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new AppError('Validation failed', 400);
    error.type = 'validation';
    error.errors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.path === 'password' || err.path === 'newPassword' ? '[REDACTED]' : err.value,
    }));
    return next(error);
  }
  next();
};

// Custom password validator that uses comprehensive strength checking
const passwordStrengthValidator = (value, { req }) => {
  const email = req.body.email || null;
  const result = validatePassword(value, email);

  if (!result.isValid) {
    throw new Error(result.errors[0]); // Return first error for clearer messaging
  }

  return true;
};

// Custom validator to ensure new password is different from current
const passwordDifferentValidator = (value, { req }) => {
  if (value === req.body.currentPassword) {
    throw new Error('New password must be different from current password');
  }
  return true;
};

const registerValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .custom(passwordStrengthValidator),
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[\p{L}\s'-]+$/u)
    .withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s+()-]{7,20}$/)
    .withMessage('Please provide a valid phone number (7-20 characters)'),
  body('role')
    .optional()
    .isIn(['member', 'trainer', 'admin'])
    .withMessage('Role must be member, trainer, or admin'),
  handleValidationErrors,
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 128 })
    .withMessage('Password is too long'),
  handleValidationErrors,
];

const refreshTokenValidator = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string')
    .isLength({ min: 10 })
    .withMessage('Invalid refresh token format'),
  handleValidationErrors,
];

const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .custom(passwordStrengthValidator)
    .custom(passwordDifferentValidator),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
  handleValidationErrors,
];

const updateProfileValidator = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[\p{L}\s'-]+$/u)
    .withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s+()-]{7,20}$/)
    .withMessage('Please provide a valid phone number (7-20 characters)'),
  handleValidationErrors,
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  handleValidationErrors,
];

const resetPasswordValidator = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 32 })
    .withMessage('Invalid reset token'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .custom(passwordStrengthValidator),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
  handleValidationErrors,
];

const verifyEmailValidator = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
    .isLength({ min: 32 })
    .withMessage('Invalid verification token'),
  handleValidationErrors,
];

const resendVerificationValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  handleValidationErrors,
];

module.exports = {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  changePasswordValidator,
  updateProfileValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator,
  resendVerificationValidator,
  handleValidationErrors,
  getRequirementsText,
};
