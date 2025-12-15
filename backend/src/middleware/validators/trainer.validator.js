const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./auth.validator');

const createTrainerValidator = [
  body('user_id')
    .isUUID()
    .withMessage('Valid user ID is required'),
  body('specialization')
    .trim()
    .notEmpty()
    .withMessage('Specialization is required')
    .isLength({ max: 255 })
    .withMessage('Specialization must not exceed 255 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must not exceed 1000 characters'),
  body('years_experience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Years of experience must be between 0 and 50'),
  body('hourly_rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  handleValidationErrors,
];

const updateTrainerValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid trainer ID is required'),
  body('specialization')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Specialization cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Specialization must not exceed 255 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must not exceed 1000 characters'),
  body('years_experience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Years of experience must be between 0 and 50'),
  body('hourly_rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  body('is_available')
    .optional()
    .isBoolean()
    .withMessage('is_available must be a boolean'),
  handleValidationErrors,
];

const trainerIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid trainer ID is required'),
  handleValidationErrors,
];

const listTrainersValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('specialization')
    .optional()
    .trim(),
  query('available')
    .optional()
    .isBoolean()
    .withMessage('Available must be a boolean'),
  handleValidationErrors,
];

// Trainer Dashboard Validators
const trainerScheduleListValidator = [
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
    .isIn(['active', 'cancelled', 'completed', 'all'])
    .withMessage('Status must be active, cancelled, completed, or all'),
  query('from')
    .optional()
    .isISO8601()
    .withMessage('From date must be a valid ISO 8601 date'),
  query('to')
    .optional()
    .isISO8601()
    .withMessage('To date must be a valid ISO 8601 date'),
  query('include_past')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('include_past must be true or false'),
  handleValidationErrors,
];

const trainerStudentListValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('schedule_id')
    .optional()
    .isUUID()
    .withMessage('Valid schedule ID is required'),
  query('upcoming_only')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('upcoming_only must be true or false'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  query('sort_by')
    .optional()
    .isIn(['booking_count', 'full_name', 'last_booking', 'average_rating'])
    .withMessage('Invalid sort column'),
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  handleValidationErrors,
];

module.exports = {
  createTrainerValidator,
  updateTrainerValidator,
  trainerIdValidator,
  listTrainersValidator,
  trainerScheduleListValidator,
  trainerStudentListValidator,
};
