const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

/**
 * Create a custom rate limit error handler
 */
const rateLimitHandler = (req, res, next, options) => {
  const error = AppError.tooManyRequests(options.message);
  next(error);
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 * 5 attempts per 15 minutes for login/register
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
});

/**
 * Login-specific rate limiter
 * More strict: 5 attempts per 30 minutes
 * Helps prevent credential stuffing
 */
const loginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5,
  message: 'Too many login attempts. Please try again after 30 minutes or reset your password',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Registration rate limiter
 * 3 registrations per hour per IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many accounts created from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Password reset rate limiter
 * 3 attempts per hour
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts. Please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Token refresh rate limiter
 * 30 refreshes per 15 minutes
 */
const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: 'Too many token refresh attempts. Please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Email verification rate limiter
 * 5 attempts per hour
 */
const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many email verification attempts. Please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Account-specific rate limiter by user ID
 * Used for sensitive operations
 */
const createAccountLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user?.id || req.ip;
    },
    handler: rateLimitHandler,
  });
};

/**
 * Profile update limiter
 * 10 updates per hour per user
 */
const profileUpdateLimiter = createAccountLimiter(
  60 * 60 * 1000, // 1 hour
  10,
  'Too many profile updates. Please try again after an hour'
);

/**
 * Password change limiter
 * 3 changes per hour per user
 */
const passwordChangeLimiter = createAccountLimiter(
  60 * 60 * 1000, // 1 hour
  3,
  'Too many password change attempts. Please try again after an hour'
);

module.exports = {
  generalLimiter,
  authLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  refreshTokenLimiter,
  emailVerificationLimiter,
  profileUpdateLimiter,
  passwordChangeLimiter,
  createAccountLimiter,
};
