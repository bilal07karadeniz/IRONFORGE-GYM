const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./auth.validator');

const validCategories = ['yoga', 'cardio', 'strength', 'pilates', 'spinning', 'boxing', 'dance', 'swimming', 'crossfit', 'other'];
const validDifficultyLevels = ['beginner', 'intermediate', 'advanced'];

const createClassValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Class name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Class name must be between 2 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('duration_minutes')
    .isInt({ min: 15, max: 240 })
    .withMessage('Duration must be between 15 and 240 minutes'),
  body('max_capacity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Max capacity must be between 1 and 100'),
  body('trainer_id')
    .optional()
    .isUUID()
    .withMessage('Valid trainer ID is required'),
  body('category')
    .isIn(validCategories)
    .withMessage(`Category must be one of: ${validCategories.join(', ')}`),
  body('difficulty_level')
    .optional()
    .isIn(validDifficultyLevels)
    .withMessage(`Difficulty level must be one of: ${validDifficultyLevels.join(', ')}`),
  body('equipment_needed')
    .optional()
    .isArray()
    .withMessage('Equipment needed must be an array'),
  body('equipment_needed.*')
    .optional()
    .isString()
    .withMessage('Each equipment item must be a string'),
  handleValidationErrors,
];

const updateClassValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid class ID is required'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Class name cannot be empty')
    .isLength({ min: 2, max: 255 })
    .withMessage('Class name must be between 2 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('duration_minutes')
    .optional()
    .isInt({ min: 15, max: 240 })
    .withMessage('Duration must be between 15 and 240 minutes'),
  body('max_capacity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max capacity must be between 1 and 100'),
  body('trainer_id')
    .optional()
    .isUUID()
    .withMessage('Valid trainer ID is required'),
  body('category')
    .optional()
    .isIn(validCategories)
    .withMessage(`Category must be one of: ${validCategories.join(', ')}`),
  body('difficulty_level')
    .optional()
    .isIn(validDifficultyLevels)
    .withMessage(`Difficulty level must be one of: ${validDifficultyLevels.join(', ')}`),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  handleValidationErrors,
];

const classIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid class ID is required'),
  handleValidationErrors,
];

const listClassesValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('category')
    .optional()
    .isIn(validCategories)
    .withMessage(`Category must be one of: ${validCategories.join(', ')}`),
  query('difficulty')
    .optional()
    .isIn(validDifficultyLevels)
    .withMessage(`Difficulty must be one of: ${validDifficultyLevels.join(', ')}`),
  query('trainer_id')
    .optional()
    .isUUID()
    .withMessage('Valid trainer ID is required'),
  query('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
  handleValidationErrors,
];

module.exports = {
  createClassValidator,
  updateClassValidator,
  classIdValidator,
  listClassesValidator,
  validCategories,
  validDifficultyLevels,
};
