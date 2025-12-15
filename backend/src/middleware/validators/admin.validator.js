const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./auth.validator');

const validRoles = ['member', 'trainer', 'admin'];

const adminUserListValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(validRoles)
    .withMessage(`Role must be one of: ${validRoles.join(', ')}`),
  query('is_active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('is_active must be true or false'),
  query('email_verified')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('email_verified must be true or false'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  query('sort_by')
    .optional()
    .isIn(['created_at', 'full_name', 'email', 'role', 'last_login'])
    .withMessage('Sort by must be created_at, full_name, email, role, or last_login'),
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  handleValidationErrors,
];

const adminUpdateRoleValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid user ID is required'),
  body('role')
    .isIn(validRoles)
    .withMessage(`Role must be one of: ${validRoles.join(', ')}`),
  handleValidationErrors,
];

const adminUpdateStatusValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid user ID is required'),
  body('is_active')
    .isBoolean()
    .withMessage('is_active must be a boolean value'),
  handleValidationErrors,
];

const adminBookingListValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['confirmed', 'cancelled', 'completed', 'no_show'])
    .withMessage('Status must be confirmed, cancelled, completed, or no_show'),
  query('user_id')
    .optional()
    .isUUID()
    .withMessage('Valid user ID is required'),
  query('trainer_id')
    .optional()
    .isUUID()
    .withMessage('Valid trainer ID is required'),
  query('class_id')
    .optional()
    .isUUID()
    .withMessage('Valid class ID is required'),
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  query('from')
    .optional()
    .isISO8601()
    .withMessage('From date must be a valid ISO 8601 date'),
  query('to')
    .optional()
    .isISO8601()
    .withMessage('To date must be a valid ISO 8601 date'),
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  query('has_rating')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('has_rating must be true or false'),
  query('sort_by')
    .optional()
    .isIn(['booking_date', 'start_time', 'status', 'rating', 'user_name', 'class_name'])
    .withMessage('Invalid sort column'),
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  handleValidationErrors,
];

const reportQueryValidator = [
  query('period')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Period must be between 1 and 365 days'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

module.exports = {
  adminUserListValidator,
  adminUpdateRoleValidator,
  adminUpdateStatusValidator,
  adminBookingListValidator,
  reportQueryValidator,
};
