const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createScheduleValidator,
  updateScheduleValidator,
  scheduleIdValidator,
  listSchedulesValidator,
} = require('../middleware/validators');

// ============================================
// PUBLIC ROUTES
// ============================================

// List all schedules with filters
// GET /api/schedules?class_id=&trainer_id=&category=&status=&from=&to=&date=
router.get('/',
  listSchedulesValidator,
  scheduleController.getAllSchedules
);

// Get available schedules for booking
// GET /api/schedules/available?class_id=&trainer_id=&category=&from=&to=&days_ahead=
router.get('/available',
  listSchedulesValidator,
  scheduleController.getAvailableSchedules
);

// ============================================
// PROTECTED ROUTES (Trainer and Admin)
// ============================================

// Get trainer's own schedules (must be before /:id to avoid route conflict)
// GET /api/schedules/my
router.get('/my',
  authenticate,
  authorize('trainer'),
  scheduleController.getMySchedules
);

// Get schedule details
// GET /api/schedules/:id
router.get('/:id',
  scheduleIdValidator,
  scheduleController.getScheduleById
);

// Get schedule attendees
// GET /api/schedules/:id/attendees
router.get('/:id/attendees',
  authenticate,
  authorize('admin', 'trainer'),
  scheduleIdValidator,
  scheduleController.getScheduleAttendees
);

// Create new schedule (admin or trainer for themselves)
// POST /api/schedules
router.post('/',
  authenticate,
  authorize('admin', 'trainer'),
  createScheduleValidator,
  scheduleController.createSchedule
);

// Update schedule (admin or trainer for their own)
// PUT /api/schedules/:id
router.put('/:id',
  authenticate,
  authorize('admin', 'trainer'),
  updateScheduleValidator,
  scheduleController.updateSchedule
);

// Also support PATCH for partial updates
router.patch('/:id',
  authenticate,
  authorize('admin', 'trainer'),
  updateScheduleValidator,
  scheduleController.updateSchedule
);

// Cancel schedule (soft delete with user notification)
// POST /api/schedules/:id/cancel
router.post('/:id/cancel',
  authenticate,
  authorize('admin', 'trainer'),
  scheduleIdValidator,
  scheduleController.cancelSchedule
);

// Delete schedule (hard delete - only if no bookings)
// DELETE /api/schedules/:id
router.delete('/:id',
  authenticate,
  authorize('admin', 'trainer'),
  scheduleIdValidator,
  scheduleController.deleteSchedule
);

module.exports = router;
