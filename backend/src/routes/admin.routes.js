const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');
const {
  adminUserListValidator,
  adminUpdateRoleValidator,
  adminUpdateStatusValidator,
  adminBookingListValidator,
  reportQueryValidator,
} = require('../middleware/validators/admin.validator');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// ============================================
// DASHBOARD & STATS
// ============================================

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 *
 * Returns overview metrics including:
 * - User counts (total, by role, active, new)
 * - Class and schedule statistics
 * - Booking metrics and ratings
 * - Capacity utilization
 * - Revenue projections
 */
router.get('/stats', adminController.getDashboardStats);

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * Get all users with filters
 * GET /api/admin/users?role=&is_active=&search=&page=&limit=
 */
router.get('/users',
  adminUserListValidator,
  adminController.getAllUsers
);

/**
 * Update user role
 * PUT /api/admin/users/:id/role
 * Body: { role: 'member' | 'trainer' | 'admin' }
 */
router.put('/users/:id/role',
  adminUpdateRoleValidator,
  adminController.updateUserRole
);

/**
 * Update user status (activate/deactivate)
 * PUT /api/admin/users/:id/status
 * Body: { is_active: boolean }
 */
router.put('/users/:id/status',
  adminUpdateStatusValidator,
  adminController.updateUserStatus
);

// ============================================
// BOOKING MANAGEMENT
// ============================================

/**
 * Get all bookings with advanced filters
 * GET /api/admin/bookings?status=&user_id=&trainer_id=&class_id=&category=&from=&to=&has_rating=
 */
router.get('/bookings',
  adminBookingListValidator,
  adminController.getAllBookingsAdmin
);

// ============================================
// REPORTS
// ============================================

/**
 * Get popular classes report
 * GET /api/admin/reports/popular-classes?period=30&limit=10
 *
 * Returns most booked classes with:
 * - Booking counts and rates
 * - Average ratings
 * - Category breakdown
 */
router.get('/reports/popular-classes',
  reportQueryValidator,
  adminController.getPopularClassesReport
);

/**
 * Get trainer performance report
 * GET /api/admin/reports/trainer-performance?period=30&limit=20
 *
 * Returns trainer metrics including:
 * - Schedule and booking counts
 * - Ratings and reviews
 * - Capacity utilization
 * - No-show rates
 */
router.get('/reports/trainer-performance',
  reportQueryValidator,
  adminController.getTrainerPerformanceReport
);

module.exports = router;
