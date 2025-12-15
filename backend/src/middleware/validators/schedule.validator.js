const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./auth.validator');

const createScheduleValidator = [
  body('class_id')
    .isUUID()
    .withMessage('Valid class ID is required'),
  body('trainer_id')
    .isUUID()
    .withMessage('Valid trainer ID is required'),
  body('start_time')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),
  body('end_time')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_time)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('room')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Room name must not exceed 100 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  handleValidationErrors,
];

const updateScheduleValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid schedule ID is required'),
  body('start_time')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  body('end_time')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date'),
  body('status')
    .optional()
    .isIn(['active', 'cancelled', 'completed'])
    .withMessage('Status must be active, cancelled, or completed'),
  body('room')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Room name must not exceed 100 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  handleValidationErrors,
];

const scheduleIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid schedule ID is required'),
  handleValidationErrors,
];

const listSchedulesValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('class_id')
    .optional()
    .isUUID()
    .withMessage('Valid class ID is required'),
  query('trainer_id')
    .optional()
    .isUUID()
    .withMessage('Valid trainer ID is required'),
  query('status')
    .optional()
    .isIn(['active', 'cancelled', 'completed'])
    .withMessage('Status must be active, cancelled, or completed'),
  query('from')
    .optional()
    .isISO8601()
    .withMessage('From date must be a valid ISO 8601 date'),
  query('to')
    .optional()
    .isISO8601()
    .withMessage('To date must be a valid ISO 8601 date'),
  handleValidationErrors,
];

module.exports = {
  createScheduleValidator,
  updateScheduleValidator,
  scheduleIdValidator,
  listSchedulesValidator,
};
