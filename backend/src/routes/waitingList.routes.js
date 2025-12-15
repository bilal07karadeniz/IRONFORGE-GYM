const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth');
const {
  joinWaitingListValidator,
  waitingListIdValidator,
} = require('../middleware/validators');

// All waiting list routes require authentication
router.use(authenticate);

// ============================================
// WAITING LIST ROUTES
// ============================================

// Join waiting list when class is full
// POST /api/waiting-list
router.post('/',
  joinWaitingListValidator,
  bookingController.joinWaitingList
);

// Get user's waiting list entries
// GET /api/waiting-list/my-list
router.get('/my-list',
  bookingController.getMyWaitingList
);

// Confirm booking from waiting list (when notified)
// POST /api/waiting-list/:id/confirm
router.post('/:id/confirm',
  waitingListIdValidator,
  bookingController.confirmFromWaitingList
);

// Leave waiting list
// DELETE /api/waiting-list/:id
router.delete('/:id',
  waitingListIdValidator,
  bookingController.leaveWaitingList
);

module.exports = router;
