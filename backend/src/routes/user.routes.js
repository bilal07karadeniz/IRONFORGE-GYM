const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validators');

// All user admin routes require admin authentication
router.use(authenticate, authorize('admin'));

// Validators
const listUsersValidator = [
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
    .isIn(['member', 'trainer', 'admin'])
    .withMessage('Role must be member, trainer, or admin'),
  query('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
  handleValidationErrors,
];

const userIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid user ID is required'),
  handleValidationErrors,
];

const updateUserValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid user ID is required'),
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s+()-]+$/)
    .withMessage('Please provide a valid phone number'),
  body('role')
    .optional()
    .isIn(['member', 'trainer', 'admin'])
    .withMessage('Role must be member, trainer, or admin'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  handleValidationErrors,
];

const resetPasswordValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid user ID is required'),
  body('new_password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  handleValidationErrors,
];

// Routes
router.get('/', listUsersValidator, userController.getAllUsers);
router.get('/:id', userIdValidator, userController.getUserById);
router.patch('/:id', updateUserValidator, userController.updateUser);
router.delete('/:id', userIdValidator, userController.deleteUser);
router.post('/:id/reset-password', resetPasswordValidator, userController.resetUserPassword);

module.exports = router;
