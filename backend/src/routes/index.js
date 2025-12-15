const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const trainerRoutes = require('./trainer.routes');
const classRoutes = require('./class.routes');
const scheduleRoutes = require('./schedule.routes');
const bookingRoutes = require('./booking.routes');
const waitingListRoutes = require('./waitingList.routes');
const adminRoutes = require('./admin.routes');
const trainerDashboardRoutes = require('./trainerDashboard.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/trainers', trainerRoutes);
router.use('/classes', classRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/bookings', bookingRoutes);
router.use('/waiting-list', waitingListRoutes);
router.use('/admin', adminRoutes);
router.use('/trainer', trainerDashboardRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;
