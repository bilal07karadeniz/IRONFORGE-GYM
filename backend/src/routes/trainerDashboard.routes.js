const express = require('express');
const router = express.Router();
const trainerDashboardController = require('../controllers/trainerDashboard.controller');
const { authenticate, authorize } = require('../middleware/auth');
const {
  trainerScheduleListValidator,
  trainerStudentListValidator,
} = require('../middleware/validators/trainer.validator');

// All trainer dashboard routes require authentication and trainer role
router.use(authenticate);
router.use(authorize('trainer', 'admin'));

// ============================================
// TRAINER DASHBOARD
// ============================================

/**
 * Get trainer's dashboard stats
 * GET /api/trainer/stats
 *
 * Returns:
 * - Profile info and rating
 * - Schedule statistics
 * - Booking and student counts
 * - Today's schedule
 */
router.get('/stats', trainerDashboardController.getTrainerStats);

/**
 * Get trainer's upcoming schedules
 * GET /api/trainer/my-schedules?status=&from=&to=&include_past=&page=&limit=
 *
 * Returns the trainer's classes with:
 * - Class info and timing
 * - Current bookings and capacity
 * - Waiting list count
 */
router.get('/my-schedules',
  trainerScheduleListValidator,
  trainerDashboardController.getMySchedules
);

/**
 * Get students in trainer's classes
 * GET /api/trainer/my-students?schedule_id=&upcoming_only=&search=&page=&limit=
 *
 * If schedule_id provided: Returns students for that specific class
 * Otherwise: Returns all unique students with their booking history
 */
router.get('/my-students',
  trainerStudentListValidator,
  trainerDashboardController.getMyStudents
);

module.exports = router;
