const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./auth.validator');

const createBookingValidator = [
  body('schedule_id')
    .isUUID()
    .withMessage('Valid schedule ID is required'),
  handleValidationErrors,
];

const cancelBookingValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid booking ID is required'),
  body('cancellation_reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason must not exceed 500 characters'),
  handleValidationErrors,
];

const bookingIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid booking ID is required'),
  handleValidationErrors,
];

const scheduleIdValidator = [
  param('scheduleId')
    .isUUID()
    .withMessage('Valid schedule ID is required'),
  handleValidationErrors,
];

const listBookingsValidator = [
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
  query('type')
    .optional()
    .isIn(['upcoming', 'past'])
    .withMessage('Type must be upcoming or past'),
  query('from')
    .optional()
    .isISO8601()
    .withMessage('From date must be a valid ISO 8601 date'),
  query('to')
    .optional()
    .isISO8601()
    .withMessage('To date must be a valid ISO 8601 date'),
  query('user_id')
    .optional()
    .isUUID()
    .withMessage('Valid user ID is required'),
  query('class_id')
    .optional()
    .isUUID()
    .withMessage('Valid class ID is required'),
  query('trainer_id')
    .optional()
    .isUUID()
    .withMessage('Valid trainer ID is required'),
  query('sort_by')
    .optional()
    .isIn(['booking_date', 'start_time', 'status', 'rating'])
    .withMessage('Sort by must be booking_date, start_time, status, or rating'),
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  handleValidationErrors,
];

const rateBookingValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid booking ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback must not exceed 1000 characters'),
  handleValidationErrors,
];

const attendanceValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid booking ID is required'),
  body('attended')
    .isBoolean()
    .withMessage('Attended must be a boolean value'),
  handleValidationErrors,
];

const joinWaitingListValidator = [
  body('schedule_id')
    .isUUID()
    .withMessage('Valid schedule ID is required'),
  handleValidationErrors,
];

const waitingListIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid waiting list entry ID is required'),
  handleValidationErrors,
];

module.exports = {
  createBookingValidator,
  cancelBookingValidator,
  bookingIdValidator,
  scheduleIdValidator,
  listBookingsValidator,
  rateBookingValidator,
  attendanceValidator,
  joinWaitingListValidator,
  waitingListIdValidator,
};
