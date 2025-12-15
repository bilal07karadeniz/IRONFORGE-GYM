const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createBookingValidator,
  cancelBookingValidator,
  bookingIdValidator,
  listBookingsValidator,
  rateBookingValidator,
  scheduleIdValidator,
  attendanceValidator,
} = require('../middleware/validators');

// All booking routes require authentication
router.use(authenticate);

// ============================================
// STATIC ROUTES (must be before :id routes)
// ============================================

// Get user's bookings (upcoming and past)
// GET /api/bookings/my-bookings?type=upcoming|past&status=&page=&limit=
router.get('/my-bookings',
  listBookingsValidator,
  bookingController.getMyBookings
);

// Get all bookings for a specific schedule (Admin/Trainer)
// GET /api/bookings/schedule/:scheduleId
router.get('/schedule/:scheduleId',
  authorize('admin', 'trainer'),
  scheduleIdValidator,
  bookingController.getScheduleBookings
);

// Get all bookings (admin only)
// GET /api/bookings?status=&user_id=&schedule_id=&class_id=&trainer_id=&from=&to=
router.get('/',
  authorize('admin'),
  listBookingsValidator,
  bookingController.getAllBookings
);

// ============================================
// USER BOOKING ROUTES
// ============================================

// Create a new booking
// POST /api/bookings
router.post('/',
  createBookingValidator,
  bookingController.createBooking
);

// Get booking by ID
// GET /api/bookings/:id
router.get('/:id',
  bookingIdValidator,
  bookingController.getBookingById
);

// Cancel booking (must be >2 hours before class)
// DELETE /api/bookings/:id
router.delete('/:id',
  cancelBookingValidator,
  bookingController.cancelBooking
);

// Rate a completed booking
// POST /api/bookings/:id/rate
router.post('/:id/rate',
  rateBookingValidator,
  bookingController.rateBooking
);

// Mark attendance
// PATCH /api/bookings/:id/attendance
router.patch('/:id/attendance',
  authorize('admin', 'trainer'),
  attendanceValidator,
  bookingController.markAttendance
);

module.exports = router;
