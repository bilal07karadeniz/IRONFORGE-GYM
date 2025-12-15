const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createClassValidator,
  updateClassValidator,
  classIdValidator,
  listClassesValidator,
} = require('../middleware/validators');

// ============================================
// PUBLIC ROUTES
// ============================================

// Get all class categories
// GET /api/classes/categories
router.get('/categories',
  classController.getClassCategories
);

// List all classes with filters and search
// GET /api/classes?category=&difficulty=&trainer_id=&active=&search=&page=&limit=
router.get('/',
  listClassesValidator,
  classController.getAllClasses
);

// Get class details with trainer info and upcoming schedules
// GET /api/classes/:id
router.get('/:id',
  classIdValidator,
  classController.getClassById
);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// Create new class
// POST /api/classes
router.post('/',
  authenticate,
  authorize('admin'),
  createClassValidator,
  classController.createClass
);

// Update class (supports both PUT and PATCH)
// PUT /api/classes/:id
router.put('/:id',
  authenticate,
  authorize('admin'),
  updateClassValidator,
  classController.updateClass
);

// PATCH /api/classes/:id
router.patch('/:id',
  authenticate,
  authorize('admin'),
  updateClassValidator,
  classController.updateClass
);

// Delete class (only if no active schedules)
// DELETE /api/classes/:id
router.delete('/:id',
  authenticate,
  authorize('admin'),
  classIdValidator,
  classController.deleteClass
);

module.exports = router;
