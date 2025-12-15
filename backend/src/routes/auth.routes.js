const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  changePasswordValidator,
  updateProfileValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator,
  resendVerificationValidator,
} = require('../middleware/validators');
const {
  loginLimiter,
  registerLimiter,
  refreshTokenLimiter,
  passwordResetLimiter,
  passwordChangeLimiter,
  emailVerificationLimiter,
  profileUpdateLimiter,
} = require('../middleware/rateLimiter');

// ============================================
// PUBLIC ROUTES (no authentication required)
// ============================================

// Registration - rate limited to 3 per hour per IP
router.post('/register',
  registerLimiter,
  registerValidator,
  authController.register
);

// Login - rate limited to 5 per 30 minutes per IP
router.post('/login',
  loginLimiter,
  loginValidator,
  authController.login
);

// Refresh token - rate limited to 30 per 15 minutes
router.post('/refresh',
  refreshTokenLimiter,
  refreshTokenValidator,
  authController.refreshToken
);

// Password reset request - rate limited to 3 per hour
router.post('/forgot-password',
  passwordResetLimiter,
  forgotPasswordValidator,
  authController.forgotPassword
);

// Password reset with token - rate limited to 3 per hour
router.post('/reset-password',
  passwordResetLimiter,
  resetPasswordValidator,
  authController.resetPassword
);

// Email verification - rate limited to 5 per hour
router.post('/verify-email',
  emailVerificationLimiter,
  verifyEmailValidator,
  authController.verifyEmail
);

// Resend verification email - rate limited to 5 per hour
router.post('/resend-verification',
  emailVerificationLimiter,
  resendVerificationValidator,
  authController.resendVerification
);

// Get password requirements (public)
router.get('/password-requirements',
  authController.getPasswordRequirements
);

// ============================================
// PROTECTED ROUTES (authentication required)
// ============================================

// Logout - invalidates refresh token
router.post('/logout',
  authenticate,
  authController.logout
);

// Get current user profile
router.get('/me',
  authenticate,
  authController.getCurrentUser
);

// Alias for /me (frontend compatibility)
router.get('/profile',
  authenticate,
  authController.getCurrentUser
);

// Update user profile - rate limited to 10 per hour
router.put('/profile',
  authenticate,
  profileUpdateLimiter,
  updateProfileValidator,
  authController.updateProfile
);

// Change password - rate limited to 3 per hour
router.put('/change-password',
  authenticate,
  passwordChangeLimiter,
  changePasswordValidator,
  authController.changePassword
);

module.exports = router;
