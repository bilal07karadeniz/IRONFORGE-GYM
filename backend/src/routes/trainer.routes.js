const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainer.controller');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const {
  createTrainerValidator,
  updateTrainerValidator,
  trainerIdValidator,
  listTrainersValidator,
} = require('../middleware/validators');

// Public routes
router.get('/', listTrainersValidator, trainerController.getAllTrainers);
router.get('/:id', trainerIdValidator, trainerController.getTrainerById);
router.get('/:id/schedule', trainerIdValidator, trainerController.getTrainerSchedule);

// Admin only routes
router.post('/', authenticate, authorize('admin'), createTrainerValidator, trainerController.createTrainer);
router.delete('/:id', authenticate, authorize('admin'), trainerIdValidator, trainerController.deleteTrainer);

// Admin or trainer can update their own profile
router.patch('/:id', authenticate, authorize('admin', 'trainer'), updateTrainerValidator, trainerController.updateTrainer);

module.exports = router;
